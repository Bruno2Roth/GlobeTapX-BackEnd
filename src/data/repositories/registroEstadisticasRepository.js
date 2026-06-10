import pool from '../../configs/SPConfig.js';

export default class registroEstadisticasRepository {
    constructor() {
        this.pool = pool;
    }

    getAllAsync = async () => {
        const sql = `SELECT * FROM "RegistroEstadisticas" ORDER BY "fecha" DESC`;
        const res = await this.pool.query(sql);
        return res.rows;
    }

    getByUsuarioAsync = async (usuarioId) => {
        const sql = `
            SELECT * FROM "RegistroEstadisticas"
            WHERE "IDUsuario" = $1
            ORDER BY "fecha" DESC
        `;
        const res = await this.pool.query(sql, [usuarioId]);
        return res.rows;
    }

    deleteByUsuarioAsync = async (usuarioId) => {
        const sql = `DELETE FROM "RegistroEstadisticas" WHERE "IDUsuario" = $1`;
        const res = await this.pool.query(sql, [usuarioId]);
        return res.rowCount;
    }

    createAsync = async (entity) => {
        const sql = `
            INSERT INTO "RegistroEstadisticas" ("IDUsuario", "tipoEvento", "detalle")
            VALUES ($1, $2, $3)
            RETURNING "ID"
        `;
        const values = [entity.IDUsuario, entity.tipoEvento, entity.detalle || null];
        const res = await this.pool.query(sql, values);
        return res.rows[0];
    }
}
