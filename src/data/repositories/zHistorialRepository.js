import pool from '../../configs/SPConfig.js'

export default class zHistorialRepository {
    constructor() {
        console.log('Estoy en: zHistorialRepository.constructor()');
        this.pool = pool;
    }

    getAllAsync = async () => {
        console.log(`zHistorialRepository.getAllAsync()`);
        const sql = `SELECT * FROM "Historial"`;
        const res = await this.pool.query(sql);
        return res.rows;
    }

    getByIdAsync = async (id) => {
        console.log(`zHistorialRepository.getByIdAsync(${id})`);
        const sql = `SELECT * FROM "Historial" WHERE "ID" = $1`;
        const res = await this.pool.query(sql, [id]);
        return res.rows && res.rows[0] ? res.rows[0] : null;
    }

    getByUsuarioAsync = async (IDUsuario) => {
        console.log(`zHistorialRepository.getByUsuarioAsync(${IDUsuario})`);
        const sql = `SELECT * FROM "Historial" WHERE "IDUsuario" = $1`;
        const res = await this.pool.query(sql, [IDUsuario]);
        return res.rows;
    }

    createAsync = async (entity) => {
        console.log(`zHistorialRepository.createAsync(${JSON.stringify(entity)})`);
        const sql = `
            INSERT INTO "Historial" ("IDUsuario", "query", "dispositivo", "fecha")
            VALUES ($1, $2, $3, $4)
            RETURNING "ID"
        `;
        const values = [entity.IDUsuario, entity.query, entity.dispositivo, entity.fecha];
        const res = await this.pool.query(sql, values);
        return res.rows[0];
    }

    updateAsync = async (entity) => {
        console.log(`zHistorialRepository.updateAsync(${JSON.stringify(entity)})`);
        const sql = `
            UPDATE "Historial"
            SET "IDUsuario" = $2, "query" = $3, "dispositivo" = $4, "fecha" = $5
            WHERE "ID" = $1
        `;
        const values = [entity.ID, entity.IDUsuario, entity.query, entity.dispositivo, entity.fecha];
        const res = await this.pool.query(sql, values);
        return res.rowCount;
    }

    deleteByIdAsync = async (id) => {
        console.log(`zHistorialRepository.deleteByIdAsync(${id})`);
        const sql = `DELETE FROM "Historial" WHERE "ID" = $1`;
        const res = await this.pool.query(sql, [id]);
        return res.rowCount;
    }
}
