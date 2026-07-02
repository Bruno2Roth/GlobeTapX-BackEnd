import pool from '../../configs/SPConfig.js'

const COLUMN_MAP = {
    nombre: ['nombre'],
    mail: ['mail', 'email'],
    contrasena: ['contrasena', 'password'],
    nombreCompleto: ['nombreCompleto', 'nombrecompleto'],
    numeroContacto: ['numeroContacto', 'numerocontacto'],
    idiomaPreferido: ['idiomaPreferido', 'idioma', 'idiomapreferido'],
    paisActual: ['paisActual', 'paisactual'],
    fotoPerfil: ['fotoPerfil', 'fotoperfil'],
    IsAdmin: ['IsAdmin', 'isadmin', 'is_admin', 'IDTipoAdmin'],
    ESPremium: ['ESPremium', 'espremium', 'es_premium'],
};

function _entityValue(entity, fieldKeys) {
    for (const key of fieldKeys) {
        if (entity[key] !== undefined && entity[key] !== null) return entity[key];
    }
    return null;
}

export default class usuariosRepository {
    constructor() {
        console.log('Estoy en: usuariosRepository.constructor()');
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
        this._columns = res.rows.map(r => r.column_name);
        return this._columns;
    }

    _buildInsert(entity, dbColumns) {
        const cols = [];
        const vals = [];
        for (const [colName, entityKeys] of Object.entries(COLUMN_MAP)) {
            if (!dbColumns.includes(colName)) continue;
            cols.push(`"${colName}"`);
            vals.push(_entityValue(entity, entityKeys));
        }
        if (!cols.length) throw new Error('No hay columnas válidas para insert');
        const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
        return {
            sql: `INSERT INTO "Usuario" (${cols.join(', ')}) VALUES (${placeholders}) RETURNING "ID"`,
            values: vals,
        };
    }

    _buildUpdate(entity, dbColumns) {
        const userId = entity.ID || entity.id;
        if (!userId) throw new Error('ID es requerido para update');
        const sets = [];
        const vals = [userId];
        for (const [colName, entityKeys] of Object.entries(COLUMN_MAP)) {
            if (!dbColumns.includes(colName)) continue;
            sets.push(`"${colName}" = $${sets.length + 2}`);
            vals.push(_entityValue(entity, entityKeys));
        }
        if (!sets.length) throw new Error('No hay columnas válidas para update');
        return {
            sql: `UPDATE "Usuario" SET ${sets.join(', ')} WHERE "ID" = $1`,
            values: vals,
        };
    }

    getAllAsync = async () => {
        console.log(`usuariosRepository.getAllAsync()`);

        const sql = `SELECT * FROM "Usuario"`;

        const res = await this.pool.query(sql);
        return res.rows;
    }

    getByIdAsync = async (id) => {
        console.log(`usuariosRepository.getByIdAsync(${id})`);

        const sql = `SELECT * FROM "Usuario" WHERE "ID" = $1`;
        const res = await this.pool.query(sql, [id]);
        return res.rows && res.rows[0] ? res.rows[0] : null;
    }

    getByEmailAsync = async (email) => {
        console.log(`usuariosRepository.getByEmailAsync(${email})`);

        const sql = `SELECT * FROM "Usuario" WHERE "mail" = $1`;
        const res = await this.pool.query(sql, [email]);
        return res.rows && res.rows[0] ? res.rows[0] : null;
    }

    getByNombreAsync = async (nombre) => {
        console.log(`usuariosRepository.getByNombreAsync(${nombre})`);

        const sql = `
            SELECT * 
            FROM "Usuario" 
            WHERE "nombre" ILIKE '%' || $1 || '%'
        `;

        const res = await this.pool.query(sql, [nombre]);
        return res.rows;
    }

    createAsync = async (entity) => {
        console.log(`usuariosRepository.createAsync(${JSON.stringify(entity)})`);

        const dbColumns = await this._getTableColumns();
        const { sql, values } = this._buildInsert(entity, dbColumns);

        const res = await this.pool.query(sql, values);
        return res.rows && res.rows[0] ? (res.rows[0].ID || res.rows[0].id) : null;
    }

    updateAsync = async (entity) => {
        console.log(`usuariosRepository.updateAsync(${JSON.stringify(entity)})`);

        const dbColumns = await this._getTableColumns();
        const { sql, values } = this._buildUpdate(entity, dbColumns);

        const res = await this.pool.query(sql, values);
        return res.rowCount;
    }

    deleteByIdAsync = async (id) => {
        console.log(`usuariosRepository.deleteByIdAsync(${id})`);

        const sql = `DELETE FROM "Usuario" WHERE "ID" = $1`;
        const res = await this.pool.query(sql, [id]);
        return res.rowCount;
    }

    getIdiomaPreferidoAsync = async (usuarioId) => {
        console.log(`usuariosRepository.getIdiomaPreferidoAsync(${usuarioId})`);

        const sql = `
            SELECT *
            FROM "Usuario"
            WHERE "ID" = $1
        `;

        const res = await this.pool.query(sql, [usuarioId]);
        if (!res.rows || !res.rows[0]) {
            return null;
        }

        const user = res.rows[0];
        return user.idiomapreferido || user.idioma || null;
    }

    updateIdiomaPreferidoAsync = async (usuarioId, codigoIdioma) => {
        console.log(`usuariosRepository.updateIdiomaPreferidoAsync(${usuarioId}, ${codigoIdioma})`);

        const sql = `
            UPDATE "Usuario"
            SET "idiomapreferido" = $2
            WHERE "ID" = $1
        `;

        const res = await this.pool.query(sql, [usuarioId, codigoIdioma]);
        return res.rowCount;
    }

    updatePaisActualAsync = async (usuarioId, paisactual) => {
        console.log(`usuariosRepository.updatePaisActualAsync(${usuarioId}, ${paisactual})`);

        const sql = `
            UPDATE "Usuario"
            SET "paisActual" = $2
            WHERE "ID" = $1
        `;

        const res = await this.pool.query(sql, [usuarioId, paisactual]);
        return res.rowCount;
    }
}
