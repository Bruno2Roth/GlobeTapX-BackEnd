import pool from '../../configs/SPConfig.js';

const COLUMN_MAP = {
    nombre: ['nombre', 'name'],
    mail: ['mail', 'email'],
    contrasena: ['contrasena', 'password'],
    nombreCompleto: ['nombreCompleto', 'fullName'],
    numeroContacto: ['numeroContacto', 'phone'],
    idiomaPreferido: ['idiomaPreferido', 'idioma', 'language', 'preferredLanguage'],
    paisActual: ['paisActual', 'paisactual', 'countryId'],
    fotoPerfil: ['fotoPerfil', 'foto', 'photo', 'image', 'profileImage'],
    isAdmin: ['isAdmin'],
    esPremium: ['esPremium'],
};

const hasEntityValue = (entity, fieldKeys) => {
    const keys = typeof fieldKeys === 'string' ? [fieldKeys] : fieldKeys;
    return keys.some(key => Object.prototype.hasOwnProperty.call(entity, key));
};

const entityValue = (entity, fieldKeys) => {
    const keys = typeof fieldKeys === 'string' ? [fieldKeys] : fieldKeys;
    for (const key of keys) {
        if (Object.prototype.hasOwnProperty.call(entity, key) && entity[key] !== undefined) {
            return entity[key] ?? null;
        }
    }
    return null;
};

export default class usuariosRepository {
    constructor() {
        this.pool = pool;
        this._columns = null;
    }

    async _getTableColumns() {
        if (this._columns) return this._columns;

        const sql = `
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'Usuario'
        `;
        const res = await this.pool.query(sql);
        this._columns = res.rows.map(row => row.column_name);
        return this._columns;
    }

    _buildInsert(entity, dbColumns) {
        const columns = [];
        const values = [];

        for (const [columnName, entityKeys] of Object.entries(COLUMN_MAP)) {
            if (!dbColumns.includes(columnName)) continue;
            columns.push(`"${columnName}"`);
            values.push(entityValue(entity, entityKeys));
        }

        if (!columns.length) throw new Error('No valid user columns for insert');

        return {
            sql: `INSERT INTO "Usuario" (${columns.join(', ')}) VALUES (${columns.map((_, index) => `$${index + 1}`).join(', ')}) RETURNING "ID"`,
            values,
        };
    }

    _buildUpdate(entity, dbColumns) {
        const userId = entity.ID || entity.id;
        if (!userId) throw new Error('User ID is required for update');

        const sets = [];
        const values = [userId];
        for (const [columnName, entityKeys] of Object.entries(COLUMN_MAP)) {
            if (!dbColumns.includes(columnName) || !hasEntityValue(entity, entityKeys)) continue;
            sets.push(`"${columnName}" = $${sets.length + 2}`);
            values.push(entityValue(entity, entityKeys));
        }

        if (!sets.length) throw new Error('No valid user columns for update');
        return {
            sql: `UPDATE "Usuario" SET ${sets.join(', ')} WHERE "ID" = $1`,
            values,
        };
    }

    getAllAsync = async () => {
        const res = await this.pool.query('SELECT * FROM "Usuario"');
        return res.rows;
    };

    getByIdAsync = async (id) => {
        const res = await this.pool.query('SELECT * FROM "Usuario" WHERE "ID" = $1', [id]);
        return res.rows?.[0] || null;
    };

    /** Una sola consulta y solo las columnas necesarias para /auth/me. */
    getProfileByIdAsync = async (id) => {
        const sql = `
            SELECT
                "ID" AS "id",
                COALESCE(NULLIF("nombreCompleto", ''), NULLIF("nombre", ''), '') AS "nombreCompleto",
                "mail",
                "paisActual" AS "paisActual",
                "idiomaPreferido" AS "idiomaPreferido",
                "fotoPerfil" AS "fotoPath"
            FROM "Usuario"
            WHERE "ID" = $1
            LIMIT 1
        `;
        const res = await this.pool.query(sql, [id]);
        return res.rows?.[0] || null;
    };

    getProfilePhotoByIdAsync = async (id) => {
        const sql = `
            SELECT "ID" AS "id", "fotoPerfil" AS "fotoPath"
            FROM "Usuario"
            WHERE "ID" = $1
            LIMIT 1
        `;
        const res = await this.pool.query(sql, [id]);
        return res.rows?.[0] || null;
    };

    getBymailAsync = async (mail) => {
        const sql = 'SELECT * FROM "Usuario" WHERE LOWER(TRIM("mail")) = LOWER(TRIM($1))';
        const res = await this.pool.query(sql, [mail]);
        return res.rows?.[0] || null;
    };

    getByNombreAsync = async (nombre) => {
        const sql = `
            SELECT *
            FROM "Usuario"
            WHERE "nombre" ILIKE '%' || $1 || '%'
        `;
        const res = await this.pool.query(sql, [nombre]);
        return res.rows;
    };

    createAsync = async (entity) => {
        const dbColumns = await this._getTableColumns();
        const { sql, values } = this._buildInsert(entity, dbColumns);
        const res = await this.pool.query(sql, values);
        return res.rows?.[0] ? (res.rows[0].ID || res.rows[0].id) : null;
    };

    updateAsync = async (entity) => {
        const dbColumns = await this._getTableColumns();
        const { sql, values } = this._buildUpdate(entity, dbColumns);
        const res = await this.pool.query(sql, values);
        return res.rowCount;
    };

    deleteByIdAsync = async (id) => {
        const res = await this.pool.query('DELETE FROM "Usuario" WHERE "ID" = $1', [id]);
        return res.rowCount;
    };

    getIdiomaPreferidoAsync = async (usuarioId) => this.getPreferredLanguageCodeAsync(usuarioId);

    getPreferredLanguageCodeAsync = async (usuarioId) => {
        const sql = `
            SELECT "ID" AS "id", "idiomaPreferido" AS "codigoIdioma"
            FROM "Usuario"
            WHERE "ID" = $1
            LIMIT 1
        `;
        const res = await this.pool.query(sql, [usuarioId]);
        return res.rows?.[0]?.codigoIdioma || null;
    };

    getPreferredLanguageRecordAsync = async (usuarioId) => {
        const sql = `
            SELECT "ID" AS "id", "idiomaPreferido" AS "codigoIdioma"
            FROM "Usuario"
            WHERE "ID" = $1
            LIMIT 1
        `;
        const res = await this.pool.query(sql, [usuarioId]);
        return res.rows?.[0] || null;
    };

    updateIdiomaPreferidoAsync = async (usuarioId, codigoIdioma) => {
        const sql = `
            UPDATE "Usuario"
            SET "idiomaPreferido" = $2
            WHERE "ID" = $1
            RETURNING "ID"
        `;
        const res = await this.pool.query(sql, [usuarioId, codigoIdioma]);
        return res.rowCount;
    };

    updateFotoPerfilAsync = async (usuarioId, fotoPerfil) => {
        const sql = `
            UPDATE "Usuario"
            SET "fotoPerfil" = $2
            WHERE "ID" = $1
        `;
        const res = await this.pool.query(sql, [usuarioId, fotoPerfil]);
        return res.rowCount;
    };

    updatePaisActualAsync = async (usuarioId, paisactual) => {
        const sql = `
            UPDATE "Usuario"
            SET "paisActual" = $2
            WHERE "ID" = $1
        `;
        const res = await this.pool.query(sql, [usuarioId, paisactual]);
        return res.rowCount;
    };
}
