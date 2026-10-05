import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const databaseUrl = process.env.DATABASE_TEST_URL;
const integrationRequired = process.env.CI === 'true';

test('migración, documentación, favoritos y agenda funcionan contra PostgreSQL real', {
    skip: !databaseUrl && !integrationRequired ? 'Configurar DATABASE_TEST_URL para integración' : false,
}, async () => {
    assert.ok(databaseUrl, 'CI necesita DATABASE_TEST_URL para correr los flujos con PostgreSQL');

    const { Client } = await import('pg');
    const schema = `codex_it_${process.pid}_${Date.now()}`;
    const client = new Client({ connectionString: databaseUrl });
    let server;
    let pool;
    let connected = false;
    const previousDatabaseUrl = process.env.DATABASE_URL;
    const previousPgOptions = process.env.PGOPTIONS;
    const previousJwtSecret = process.env.JWT_SECRET;

    try {
        await client.connect();
        connected = true;
        await client.query(`CREATE SCHEMA "${schema}"`);
        await client.query(`SET search_path TO "${schema}"`);

        await client.query(`
            CREATE TABLE "Pais" (
                "ID" integer PRIMARY KEY,
                "nombre" varchar(100),
                "descripcion" varchar(500),
                "imagen" text,
                "codigo" varchar(2),
                "gmt" numeric
            );
            CREATE TABLE "PaisInfo" (
                "ID" integer PRIMARY KEY,
                "IDPais" integer NOT NULL UNIQUE,
                "requisitosVisa" text,
                "vacunasObligatorias" text,
                "vacunasRecomendadas" text,
                "notasGenerales" text,
                "reglas" text,
                "vidaDiaria" text,
                "documentacion" text
            );
            CREATE TABLE "PaisDocumentacion" (
                "IDPais" bigint,
                "nombre" text NOT NULL,
                "codigo" text NOT NULL,
                "descripcion" text NOT NULL,
                "imagen" text NOT NULL,
                "documentacion" text NOT NULL,
                "reglas" text NOT NULL,
                "vidaDiaria" text NOT NULL
            );
            CREATE TABLE "DocumentacionPais" (
                "IDPais" bigint PRIMARY KEY,
                "documentacion" text NOT NULL
            );
            CREATE TABLE "Usuario" (
                "ID" integer PRIMARY KEY,
                "nombre" varchar(50) NOT NULL,
                "mail" varchar(320) NOT NULL,
                "contrasena" varchar(255),
                "nombreCompleto" varchar(100),
                "numeroContacto" varchar(50),
                "isAdmin" boolean,
                "esPremium" boolean,
                "idiomaPreferido" varchar(10),
                "paisActual" integer,
                "fotoPerfil" text
            );
            CREATE TABLE "Categoria" ("ID" integer PRIMARY KEY, "nombre" varchar(100));
            CREATE TABLE "Evento" (
                "ID" integer PRIMARY KEY,
                "IDPais" integer,
                "IDCategoria" integer,
                "nombre" varchar(50),
                "descripcion" text,
                "fechaInicio" timestamptz,
                "fechaFin" timestamptz,
                "ubicacion" varchar(255),
                "imagen" text,
                "activo" boolean DEFAULT true
            );
            CREATE TABLE "EventoFavorito" (
                "ID" serial PRIMARY KEY,
                "IDUsuario" integer NOT NULL,
                "IDEvento" integer NOT NULL,
                "fechaAgregado" timestamptz DEFAULT now()
            );
            CREATE TABLE "AgendaUsuario" (
                "ID" serial PRIMARY KEY,
                "IDUsuario" integer,
                "IDEvento" integer,
                "interes" varchar(30),
                "recordatorio" timestamptz
            );
        `);

        await client.query(`
            INSERT INTO "Pais" ("ID", "nombre", "descripcion", "imagen", "codigo")
            VALUES (1, 'Argentina', 'País de prueba', 'https://example.test/ar.png', 'AR');
            INSERT INTO "PaisInfo" ("ID", "IDPais", "documentacion")
            VALUES (1, 1, 'Documento base');
            INSERT INTO "PaisDocumentacion"
                ("IDPais", "nombre", "codigo", "descripcion", "imagen", "documentacion", "reglas", "vidaDiaria")
            VALUES (1, 'Argentina', 'AR', 'Descripción histórica', 'https://example.test/old.png',
                'Visa migrada', 'Reglas migradas', 'Vida migrada');
            INSERT INTO "DocumentacionPais" ("IDPais", "documentacion")
            VALUES (1, 'Documento de respaldo');
            INSERT INTO "Usuario" ("ID", "nombre", "mail", "isAdmin", "paisActual", "idiomaPreferido")
            VALUES (1, 'Ada', 'ada@example.test', false, 1, '1');
            INSERT INTO "Categoria" ("ID", "nombre") VALUES (1, 'Cultura');
            INSERT INTO "Evento" ("ID", "IDPais", "IDCategoria", "nombre", "descripcion", "fechaInicio", "ubicacion")
            VALUES (1, 1, 1, 'Festival', 'Evento de prueba', '2026-12-25T12:00:00Z', 'Buenos Aires');
            INSERT INTO "EventoFavorito" ("IDUsuario", "IDEvento", "fechaAgregado")
            VALUES (1, 1, '2026-01-01'), (1, 1, '2026-01-02');
        `);

        const here = path.dirname(fileURLToPath(import.meta.url));
        const migration = await readFile(path.join(
            here,
            '../src/data/migrations/20261004_normalize_country_docs_and_favorite_unique.sql',
        ), 'utf8');
        await client.query(migration);

        const legacyTables = await client.query(`
            SELECT to_regclass('"PaisDocumentacion"') AS "paisDocumentacion",
                to_regclass('"DocumentacionPais"') AS "documentacionPais"
        `);
        assert.equal(legacyTables.rows[0].paisDocumentacion, null);
        assert.equal(legacyTables.rows[0].documentacionPais, null);

        const migrated = await client.query('SELECT "documentacion", "reglas", "vidaDiaria" FROM "PaisInfo" WHERE "IDPais" = 1');
        assert.match(migrated.rows[0].documentacion, /Documento base/);
        assert.match(migrated.rows[0].documentacion, /Visa migrada/);
        assert.match(migrated.rows[0].documentacion, /Documento de respaldo/);
        assert.equal(migrated.rows[0].reglas, 'Reglas migradas');
        assert.equal(migrated.rows[0].vidaDiaria, 'Vida migrada');

        const duplicateRejected = await client.query(
            'INSERT INTO "EventoFavorito" ("IDUsuario", "IDEvento") VALUES (1, 1)',
        ).then(() => false, error => error.code === '23505');
        assert.equal(duplicateRejected, true);

        const scopedDatabaseUrl = new URL(databaseUrl);
        scopedDatabaseUrl.searchParams.set('options', `-c search_path=${schema}`);
        process.env.DATABASE_URL = scopedDatabaseUrl.toString();
        process.env.PGOPTIONS = `-c search_path=${schema}`;
        process.env.JWT_SECRET = 'database-integration-secret';

        const [{ default: app }, { default: jwt }, poolModule] = await Promise.all([
            import('../src/app/app.js'),
            import('jsonwebtoken'),
            import('../src/configs/SPConfig.js'),
        ]);
        pool = poolModule.default;
        server = await new Promise(resolve => {
            const instance = app.listen(0, () => resolve(instance));
        });
        const baseUrl = `http://127.0.0.1:${server.address().port}`;
        const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET);
        const request = (url, options = {}) => fetch(`${baseUrl}${url}`, {
            ...options,
            headers: {
                Authorization: `Bearer ${token}`,
                ...(options.body ? { 'Content-Type': 'application/json' } : {}),
                ...(options.headers || {}),
            },
        });

        const docs = await request('/api/paisInfo/documentacion?paisId=1');
        assert.equal(docs.status, 200);
        assert.match((await docs.json()).data.documentacion, /Visa migrada/);

        const initialFavorites = await request('/api/eventoFavorito');
        const favoriteRows = await initialFavorites.json();
        assert.equal(favoriteRows.length, 1);
        assert.equal(favoriteRows[0].evento.nombre, 'Festival');

        const duplicateFavorite = await request('/api/eventoFavorito', {
            method: 'POST',
            body: JSON.stringify({ IDEvento: 1 }),
        });
        assert.equal(duplicateFavorite.status, 409);

        const favoriteId = favoriteRows[0].ID;
        const deletedFavorite = await request(`/api/eventoFavorito/${favoriteId}`, { method: 'DELETE' });
        assert.equal(deletedFavorite.status, 200);
        const createdFavorite = await request('/api/eventoFavorito', {
            method: 'POST',
            body: JSON.stringify({ IDEvento: 1 }),
        });
        assert.equal(createdFavorite.status, 201);

        const createdAgenda = await request('/api/agendaUsuario', {
            method: 'POST',
            body: JSON.stringify({ IDEvento: 1, interes: 'quiero ir' }),
        });
        assert.equal(createdAgenda.status, 201);
        const listedAgenda = await request('/api/agendaUsuario');
        const agendaRows = await listedAgenda.json();
        assert.equal(agendaRows.length, 1);
        assert.equal(agendaRows[0].eventoNombre, 'Festival');
        const agendaId = agendaRows[0].ID;
        const deletedAgenda = await request(`/api/agendaUsuario/${agendaId}`, { method: 'DELETE' });
        assert.equal(deletedAgenda.status, 200);

        const invalidHolidayCountry = await request('/api/agendaUsuario/feriados/ZZ/2026');
        assert.equal(invalidHolidayCountry.status, 400);
    } finally {
        if (server) await new Promise(resolve => server.close(resolve));
        if (pool) await pool.end();
        if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
        else process.env.DATABASE_URL = previousDatabaseUrl;
        if (previousPgOptions === undefined) delete process.env.PGOPTIONS;
        else process.env.PGOPTIONS = previousPgOptions;
        if (previousJwtSecret === undefined) delete process.env.JWT_SECRET;
        else process.env.JWT_SECRET = previousJwtSecret;
        if (connected) {
            await client.query('RESET search_path').catch(() => {});
            await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`).catch(() => {});
            await client.end();
        }
    }
});
