#!/usr/bin/env node
/**
 * Supabase Database Backup Script (without pg_dump)
 * Connects via DATABASE_URL from .env and extracts schema + data
 * strictly read-only — never modifies the source database.
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const OUTPUT_FILE = path.join(__dirname, 'supabase_backup.sql');

// Schemas to back up (public + auth + storage + extensions managed by Supabase)
const SCHEMAS_TO_BACKUP = ['public'];

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 30000,
  query_timeout: 120000,
  statement_timeout: 120000,
  ssl: { rejectUnauthorized: false },
});

const sqlLines = [];
const errors = [];
const stats = {
  tables: 0,
  views: 0,
  functions: 0,
  triggers: 0,
  indexes: 0,
  policies: 0,
  sequences: 0,
  foreignKeys: 0,
  constraints: 0,
  rowsInserted: 0,
};

function emit(line) {
  sqlLines.push(line);
}

function emitComment(text) {
  emit(`-- ${text}`);
}

async function q(sql, params = []) {
  const res = await client.query(sql, params);
  return res.rows;
}

function quoteIdent(name) {
  if (!name) return '""';
  return `"${name.replace(/"/g, '""')}"`;
}

function quoteLiteral(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return String(val);
  if (val instanceof Date) return `'${val.toISOString()}'`;
  if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
  const str = String(val).replace(/\\/g, '\\\\').replace(/'/g, "''");
  return `'${str}'`;
}

/** Parse a PostgreSQL array literal like {a,b,c} into a JS array */
function parsePgArray(val) {
  if (val === null || val === undefined) return [];
  if (Array.isArray(val)) return val;
  if (typeof val !== 'string') return [val];
  const trimmed = val.replace(/^{/, '').replace(/}$/, '');
  if (trimmed === '') return [];
  return trimmed.split(',');
}

// ── 1. Extensions ──────────────────────────────────────────────────────────────
async function backupExtensions() {
  emitComment('═══════════════════════════════════════════════════════════════');
  emitComment('  EXTENSIONS');
  emitComment('═══════════════════════════════════════════════════════════════');
  const rows = await q(`
    SELECT extname, extversion
    FROM pg_extension
    WHERE extname NOT IN ('plpgsql', 'pg_catalog', 'information_schema')
    ORDER BY extname
  `);
  for (const r of rows) {
    emit(`CREATE EXTENSION IF NOT EXISTS ${quoteIdent(r.extname)};`);
  }
  emit('');
}

// ── 2. Types (custom ENUM types) ──────────────────────────────────────────────
async function backupCustomTypes() {
  emitComment('═══════════════════════════════════════════════════════════════');
  emitComment('  CUSTOM TYPES (ENUM)');
  emitComment('═══════════════════════════════════════════════════════════════');
  const rows = await q(`
    SELECT t.typname, t.typtype,
           array_agg(e.enumlabel ORDER BY e.enumsortorder) AS enum_values
    FROM pg_type t
    LEFT JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE t.typtype = 'e'
      AND n.nspname = 'public'
    GROUP BY t.typname, t.typtype
    ORDER BY t.typname
  `);
  for (const r of rows) {
    const vals = r.enum_values.map(v => quoteLiteral(v)).join(', ');
    emit(`DO $$ BEGIN`);
    emit(`  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = '${r.typname}') THEN`);
    emit(`    CREATE TYPE ${quoteIdent(r.typname)} AS ENUM (${vals});`);
    emit(`  END IF;`);
    emit(`END $$;`);
  }
  emit('');
}

// ── 3. Sequences ───────────────────────────────────────────────────────────────
async function backupSequences() {
  emitComment('═══════════════════════════════════════════════════════════════');
  emitComment('  SEQUENCES');
  emitComment('═══════════════════════════════════════════════════════════════');
  const rows = await q(`
    SELECT schemaname, sequencename, data_type, start_value, increment_by, min_value, max_value, cycle
    FROM pg_sequences
    WHERE schemaname = 'public'
    ORDER BY sequencename
  `);
  for (const r of rows) {
    emit(`CREATE SEQUENCE IF NOT EXISTS ${quoteIdent(r.sequencename)} START WITH ${r.start_value} INCREMENT BY ${r.increment_by} MINVALUE ${r.min_value} MAXVALUE ${r.max_value}${r.cycle ? ' CYCLE' : ' NO CYCLE'};`);
    stats.sequences++;
  }
  emit('');
}

// ── 4. Tables ──────────────────────────────────────────────────────────────────
async function backupTables() {
  emitComment('═══════════════════════════════════════════════════════════════');
  emitComment('  TABLES');
  emitComment('═══════════════════════════════════════════════════════════════');

  const tables = await q(`
    SELECT t.table_name, obj_description((quote_ident(t.table_schema)||'.'||quote_ident(t.table_name))::regclass) AS table_comment
    FROM information_schema.tables t
    WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
    ORDER BY t.table_name
  `);

  for (const tbl of tables) {
    const tableName = tbl.table_name;

    // Get columns
    const cols = await q(`
      SELECT c.column_name, c.data_type, c.udt_name, c.character_maximum_length,
             c.numeric_precision, c.is_nullable, c.column_default,
             col_description((quote_ident($1)||'.'||quote_ident($2))::regclass, c.ordinal_position) AS col_comment
      FROM information_schema.columns c
      WHERE c.table_schema = 'public' AND c.table_name = $2
      ORDER BY c.ordinal_position
    `, ['public', tableName]);

    const colDefs = cols.map(c => {
      let colType = c.udt_name || c.data_type;
      // Handle arrays
      if (c.data_type === 'ARRAY') {
        colType = (c.udt_name || 'text') + '[]';
      }
      if (c.character_maximum_length && c.data_type !== 'ARRAY') {
        colType = `${c.udt_name || c.data_type}(${c.character_maximum_length})`;
      }
      let def = '';
      if (c.column_default) {
        // Avoid serial defaults being explicit
        if (!c.column_default.includes('nextval(')) {
          def = ` DEFAULT ${c.column_default}`;
        } else {
          // Map nextval to the sequence
          const seqMatch = c.column_default.match(/nextval\('([^']+)'/);
          if (seqMatch) {
            def = ` DEFAULT nextval('${seqMatch[1]}'::regclass)`;
          }
        }
      }
      const nullable = c.is_nullable === 'YES' ? '' : ' NOT NULL';
      const comment = c.col_comment ? ` -- ${c.col_comment.replace(/\n/g, ' ')}` : '';
      return `  ${quoteIdent(c.column_name)} ${colType}${nullable}${def}${comment}`;
    });

    emit(`CREATE TABLE IF NOT EXISTS ${quoteIdent(tableName)} (`);
    emit(colDefs.join(',\n'));
    emit(`);`);

    if (tbl.table_comment) {
      emit(`COMMENT ON TABLE ${quoteIdent(tableName)} IS ${quoteLiteral(tbl.table_comment)};`);
    }

    // Column comments
    for (const c of cols) {
      if (c.col_comment) {
        emit(`COMMENT ON COLUMN ${quoteIdent(tableName)}.${quoteIdent(c.column_name)} IS ${quoteLiteral(c.col_comment)};`);
      }
    }

    stats.tables++;
  }
  emit('');
}

// ── 5. Primary Keys ───────────────────────────────────────────────────────────
async function backupPrimaryKeys() {
  emitComment('═══════════════════════════════════════════════════════════════');
  emitComment('  PRIMARY KEYS');
  emitComment('═══════════════════════════════════════════════════════════════');
  const rows = await q(`
    SELECT tc.table_name, tc.constraint_name,
           array_agg(kcu.column_name ORDER BY kcu.ordinal_position) AS columns
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    WHERE tc.table_schema = 'public' AND tc.constraint_type = 'PRIMARY KEY'
    GROUP BY tc.table_name, tc.constraint_name
    ORDER BY tc.table_name
  `);
  for (const r of rows) {
    const cols = parsePgArray(r.columns).map(c => quoteIdent(c)).join(', ');
    emit(`ALTER TABLE ONLY ${quoteIdent(r.table_name)} ADD CONSTRAINT ${quoteIdent(r.constraint_name)} PRIMARY KEY (${cols});`);
    stats.constraints++;
  }
  emit('');
}

// ── 6. Unique Constraints ─────────────────────────────────────────────────────
async function backupUniqueConstraints() {
  emitComment('═══════════════════════════════════════════════════════════════');
  emitComment('  UNIQUE CONSTRAINTS');
  emitComment('═══════════════════════════════════════════════════════════════');
  const rows = await q(`
    SELECT tc.table_name, tc.constraint_name,
           array_agg(kcu.column_name ORDER BY kcu.ordinal_position) AS columns
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    WHERE tc.table_schema = 'public' AND tc.constraint_type = 'UNIQUE'
    GROUP BY tc.table_name, tc.constraint_name
    ORDER BY tc.table_name
  `);
  for (const r of rows) {
    const cols = parsePgArray(r.columns).map(c => quoteIdent(c)).join(', ');
    emit(`ALTER TABLE ONLY ${quoteIdent(r.table_name)} ADD CONSTRAINT ${quoteIdent(r.constraint_name)} UNIQUE (${cols});`);
    stats.constraints++;
  }
  emit('');
}

// ── 7. Check Constraints ──────────────────────────────────────────────────────
async function backupCheckConstraints() {
  emitComment('═══════════════════════════════════════════════════════════════');
  emitComment('  CHECK CONSTRAINTS');
  emitComment('═══════════════════════════════════════════════════════════════');
  const rows = await q(`
    SELECT tc.table_name, tc.constraint_name, pg_get_constraintdef(c.oid) AS definition
    FROM information_schema.table_constraints tc
    JOIN pg_constraint c ON c.conname = tc.constraint_name
      AND c.connamespace = (SELECT oid FROM pg_namespace WHERE nspname = tc.table_schema)
    WHERE tc.table_schema = 'public' AND tc.constraint_type = 'CHECK'
    ORDER BY tc.table_name
  `);
  for (const r of rows) {
    emit(`ALTER TABLE ONLY ${quoteIdent(r.table_name)} ADD CONSTRAINT ${quoteIdent(r.constraint_name)} ${r.definition};`);
    stats.constraints++;
  }
  emit('');
}

// ── 8. Foreign Keys ───────────────────────────────────────────────────────────
async function backupForeignKeys() {
  emitComment('═══════════════════════════════════════════════════════════════');
  emitComment('  FOREIGN KEYS');
  emitComment('═══════════════════════════════════════════════════════════════');
  const rows = await q(`
    SELECT
      tc.table_name AS source_table,
      tc.constraint_name,
      kcu.column_name AS source_column,
      ccu.table_name AS target_table,
      ccu.column_name AS target_column,
      c.confupdtype,
      c.confdeltype,
      c.condeferrable,
      c.condeferred
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name = ccu.constraint_name AND tc.table_schema = ccu.table_schema
    JOIN pg_constraint c ON c.conname = tc.constraint_name
      AND c.connamespace = (SELECT oid FROM pg_namespace WHERE nspname = tc.table_schema)
    WHERE tc.table_schema = 'public' AND tc.constraint_type = 'FOREIGN KEY'
    ORDER BY tc.table_name, tc.constraint_name
  `);

  // Group by constraint
  const fkMap = new Map();
  for (const r of rows) {
    if (!fkMap.has(r.constraint_name)) {
      fkMap.set(r.constraint_name, {
        source_table: r.source_table,
        target_table: r.target_table,
        source_columns: [],
        target_columns: [],
        confupdtype: r.confupdtype,
        confdeltype: r.confdeltype,
        condeferrable: r.condeferrable,
        condeferred: r.condeferred,
      });
    }
    const fk = fkMap.get(r.constraint_name);
    fk.source_columns.push(r.source_column);
    fk.target_columns.push(r.target_column);
  }

  const actions = { a: 'NO ACTION', r: 'RESTRICT', c: 'CASCADE', n: 'SET NULL', d: 'SET DEFAULT' };

  for (const [name, fk] of fkMap) {
    const srcCols = fk.source_columns.map(c => quoteIdent(c)).join(', ');
    const tgtCols = fk.target_columns.map(c => quoteIdent(c)).join(', ');
    const onUpdate = actions[fk.confupdtype] || 'NO ACTION';
    const onDelete = actions[fk.confdeltype] || 'NO ACTION';
    const deferrable = fk.condeferrable ? ' DEFERRABLE' : '';
    const deferred = fk.condeferred ? ' INITIALLY DEFERRED' : '';
    emit(`ALTER TABLE ONLY ${quoteIdent(fk.source_table)} ADD CONSTRAINT ${quoteIdent(name)} FOREIGN KEY (${srcCols}) REFERENCES ${quoteIdent(fk.target_table)}(${tgtCols}) ON UPDATE ${onUpdate} ON DELETE ${onDelete}${deferrable}${deferred};`);
    stats.foreignKeys++;
  }
  emit('');
}

// ── 9. Indexes ─────────────────────────────────────────────────────────────────
async function backupIndexes() {
  emitComment('═══════════════════════════════════════════════════════════════');
  emitComment('  INDEXES');
  emitComment('═══════════════════════════════════════════════════════════════');
  const rows = await q(`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname NOT LIKE '%_pkey'
      AND indexname NOT LIKE '%_key'
    ORDER BY indexname
  `);
  for (const r of rows) {
    // Replace CREATE UNIQUE INDEX with CREATE UNIQUE INDEX IF NOT EXISTS
    let def = r.indexdef;
    if (!def.includes('IF NOT EXISTS')) {
      def = def.replace(/CREATE (UNIQUE )?INDEX/, 'CREATE $1INDEX IF NOT EXISTS');
    }
    emit(`${def};`);
    stats.indexes++;
  }
  emit('');
}

// ── 10. Views ──────────────────────────────────────────────────────────────────
async function backupViews() {
  emitComment('═══════════════════════════════════════════════════════════════');
  emitComment('  VIEWS');
  emitComment('═══════════════════════════════════════════════════════════════');
  const rows = await q(`
    SELECT table_name, view_definition
    FROM information_schema.views
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);
  for (const r of rows) {
    if (!r.view_definition) {
      emitComment(`  WARNING: Could not retrieve definition for view "${r.table_name}"`);
      continue;
    }
    // view_definition ends with semicolon sometimes, strip it
    const def = r.view_definition.replace(/;\s*$/, '');
    emit(`CREATE OR REPLACE VIEW ${quoteIdent(r.table_name)} AS ${def};`);
    stats.views++;
  }
  emit('');
}

// ── 11. Functions ──────────────────────────────────────────────────────────────
async function backupFunctions() {
  emitComment('═══════════════════════════════════════════════════════════════');
  emitComment('  FUNCTIONS');
  emitComment('═══════════════════════════════════════════════════════════════');

  // We get function DDL from pg_get_functiondef
  const rows = await q(`
    SELECT p.proname AS function_name,
           pg_get_functiondef(p.oid) AS definition
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
    ORDER BY p.proname
  `);
  for (const r of rows) {
    emit(`${r.definition};`);
    stats.functions++;
  }
  emit('');
}

// ── 12. Triggers ───────────────────────────────────────────────────────────────
async function backupTriggers() {
  emitComment('═══════════════════════════════════════════════════════════════');
  emitComment('  TRIGGERS');
  emitComment('═══════════════════════════════════════════════════════════════');
  const rows = await q(`
    SELECT
      t.tgname AS trigger_name,
      c.relname AS table_name,
      p.proname AS function_name,
      CASE WHEN t.tgtype & 2 = 2 THEN 'BEFORE' ELSE 'AFTER' END AS timing,
      CASE
        WHEN t.tgtype & 4 = 4 THEN 'INSERT'
        WHEN t.tgtype & 8 = 8 THEN 'DELETE'
        WHEN t.tgtype & 16 = 16 THEN 'UPDATE'
        WHEN t.tgtype & 20 = 20 THEN 'INSERT OR UPDATE'
        WHEN t.tgtype & 28 = 28 THEN 'INSERT OR UPDATE OR DELETE'
        ELSE 'UNKNOWN'
      END AS event,
      t.tgtype & 1 = 1 AS row_level,
      pg_get_triggerdef(t.oid) AS trigger_def
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_proc p ON t.tgfoid = p.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND NOT t.tgisinternal
    ORDER BY c.relname, t.tgname
  `);
  for (const r of rows) {
    emit(`${r.trigger_def};`);
    stats.triggers++;
  }
  emit('');
}

// ── 13. RLS Policies ──────────────────────────────────────────────────────────
async function backupRLSPolicies() {
  emitComment('═══════════════════════════════════════════════════════════════');
  emitComment('  ROW LEVEL SECURITY POLICIES');
  emitComment('═══════════════════════════════════════════════════════════════');

  // First, enable RLS on tables that have it
  const rlsTables = await q(`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND rowsecurity = true
    ORDER BY tablename
  `);
  for (const r of rlsTables) {
    emit(`ALTER TABLE ${quoteIdent(r.tablename)} ENABLE ROW LEVEL SECURITY;`);
  }
  emit('');

  // Get policies
  const rows = await q(`
    SELECT
      schemaname,
      tablename,
      policyname,
      permissive,
      roles,
      cmd,
      qual AS using_expr,
      with_check AS check_expr
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname
  `);
  for (const r of rows) {
    const roles = r.roles && r.roles.length > 0 ? ` TO ${r.roles.map(role => quoteIdent(role)).join(', ')}` : '';
    const permissive = r.permissive === 'PERMISSIVE' ? '' : ` AS ${r.permissive}`;
    let stmt = `CREATE POLICY ${quoteIdent(r.policyname)} ON ${quoteIdent(r.tablename)}${permissive}${roles} FOR ${r.cmd.toUpperCase()}`;
    if (r.using_expr) stmt += ` USING (${r.using_expr})`;
    if (r.check_expr) stmt += ` WITH CHECK (${r.check_expr})`;
    emit(`${stmt};`);
    stats.policies++;
  }
  emit('');
}

// ── 14. Data (INSERT statements) ──────────────────────────────────────────────
async function backupData() {
  emitComment('═══════════════════════════════════════════════════════════════');
  emitComment('  DATA');
  emitComment('═══════════════════════════════════════════════════════════════');

  const tables = await q(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);

  for (const tbl of tables) {
    const tableName = tbl.table_name;

    // Get column info for proper casting
    const cols = await q(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);

    const colNames = cols.map(c => quoteIdent(c.column_name)).join(', ');

    // Get row count
    const countRes = await q(`SELECT COUNT(*)::bigint AS cnt FROM ${quoteIdent(tableName)}`);
    const rowCount = parseInt(countRes[0].cnt, 10);

    if (rowCount === 0) continue;

    emitComment(`  Table: ${tableName} (${rowCount} rows)`);
    emit(`ALTER TABLE ${quoteIdent(tableName)} DISABLE ROW LEVEL SECURITY;`);
    emit(`TRUNCATE ${quoteIdent(tableName)} CASCADE;`);

    // Fetch data in batches
    const BATCH = 500;
    let offset = 0;

    while (offset < rowCount) {
      const rows = await q(`SELECT * FROM ${quoteIdent(tableName)} ORDER BY ctid LIMIT ${BATCH} OFFSET ${offset}`);

      if (rows.length === 0) break;

      // Build INSERT
      emit(`INSERT INTO ${quoteIdent(tableName)} (${colNames}) VALUES`);
      const valueLines = rows.map(row => {
        const vals = cols.map(c => {
          let val = row[c.column_name];
          if (val === null) return 'NULL';

          // Handle JSON/JSONB
          if (typeof val === 'object' && !(val instanceof Date)) {
            return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
          }

          // Handle arrays (pg returns JS arrays for PG arrays)
          if (Array.isArray(val)) {
            const arrStr = val.map(v => {
              if (v === null) return 'NULL';
              if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
              const s = String(v).replace(/\\/g, '\\\\').replace(/'/g, "''");
              return `'${s}'`;
            }).join(', ');
            return `ARRAY[${arrStr}]`;
          }

          // Handle booleans
          if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';

          // Handle numbers
          if (typeof val === 'number') return String(val);

          // Handle UUIDs
          if (c.udt_name === 'uuid') return `'${val}'::uuid`;

          // Handle dates/times
          if (c.data_type === 'timestamp with time zone' || c.data_type === 'timestamp without time zone') return `'${val}'::timestamptz`;
          if (c.data_type === 'date') return `'${val}'::date`;
          if (c.data_type === 'time without time zone' || c.data_type === 'time with time zone') return `'${val}'::time`;

          // Default: text escape
          const s = String(val).replace(/\\/g, '\\\\').replace(/'/g, "''");
          return `'${s}'`;
        });
        return `(${vals.join(', ')})`;
      });

      emit(valueLines.join(',\n') + ';');
      stats.rowsInserted += rows.length;
      offset += BATCH;
    }

    emit('');
  }
}

// ── 15. Reset sequences to current max ────────────────────────────────────────
async function backupSequenceResets() {
  emitComment('═══════════════════════════════════════════════════════════════');
  emitComment('  SEQUENCE RESETS');
  emitComment('═══════════════════════════════════════════════════════════════');
  const rows = await q(`
    SELECT sequencename, sequencename || '_seq' AS seq_name_for_col
    FROM pg_sequences
    WHERE schemaname = 'public'
    ORDER BY sequencename
  `);
  for (const r of rows) {
    // Try to set to max(id)+1 based on common naming patterns
    emit(`SELECT setval(${quoteLiteral(r.sequencename)}, COALESCE((SELECT MAX(id) FROM ${quoteIdent(r.sequencename.replace('_seq', ''))}), 1));`);
  }
  emit('');
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  console.log('Connecting to database...');
  await client.connect();
  console.log('Connected successfully.');

  emit('-- ═══════════════════════════════════════════════════════════════');
  emit('--  Supabase Database Backup');
  emit(`--  Generated: ${new Date().toISOString()}`);
  emit('--  Method: pg catalog queries (read-only, no pg_dump)');
  emit('--  Note: This backup is for the "public" schema only.');
  emit('-- ═══════════════════════════════════════════════════════════════');
  emit('');
  emit('BEGIN;');
  emit('');

  try {
    console.log('Backing up extensions...');
    await backupExtensions();
    console.log('Backing up custom types...');
    await backupCustomTypes();
    console.log('Backing up sequences...');
    await backupSequences();
    console.log('Backing up tables...');
    await backupTables();
    console.log('Backing up primary keys...');
    await backupPrimaryKeys();
    console.log('Backing up unique constraints...');
    await backupUniqueConstraints();
    console.log('Backing up check constraints...');
    await backupCheckConstraints();
    console.log('Backing up foreign keys...');
    await backupForeignKeys();
    console.log('Backing up indexes...');
    await backupIndexes();
    console.log('Backing up views...');
    await backupViews();
    console.log('Backing up functions...');
    await backupFunctions();
    console.log('Backing up triggers...');
    await backupTriggers();
    console.log('Backing up RLS policies...');
    await backupRLSPolicies();
    console.log('Backing up data...');
    await backupData();
    console.log('Backing up sequence resets...');
    await backupSequenceResets();
  } catch (err) {
    errors.push(`Error during backup: ${err.message}`);
    console.error('Error during backup:', err.message);
  }

  emit('');
  emit('COMMIT;');
  emit('');
  emit('-- ═══════════════════════════════════════════════════════════════');
  emit('--  Backup complete');
  emit('-- ═══════════════════════════════════════════════════════════════');

  // Write file
  const content = sqlLines.join('\n');
  fs.writeFileSync(OUTPUT_FILE, content, 'utf-8');

  const fileSize = fs.statSync(OUTPUT_FILE).size;
  console.log(`\n═══════════════════════════════════════════════════════════════`);
  console.log(`  Backup written to: ${OUTPUT_FILE}`);
  console.log(`  File size: ${(fileSize / 1024).toFixed(2)} KB`);
  console.log(`  Total rows: ${stats.rowsInserted}`);
  console.log(`  Objects:`);
  console.log(`    Tables:       ${stats.tables}`);
  console.log(`    Views:        ${stats.views}`);
  console.log(`    Functions:    ${stats.functions}`);
  console.log(`    Triggers:     ${stats.triggers}`);
  console.log(`    Indexes:      ${stats.indexes}`);
  console.log(`    Policies RLS: ${stats.policies}`);
  console.log(`    Sequences:    ${stats.sequences}`);
  console.log(`    Foreign Keys: ${stats.foreignKeys}`);
  console.log(`    Constraints:  ${stats.constraints}`);
  if (errors.length > 0) {
    console.log(`  Errors: ${errors.length}`);
    errors.forEach(e => console.log(`    - ${e}`));
  }
  console.log(`═══════════════════════════════════════════════════════════════`);

  await client.end();
  console.log('Connection closed.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
