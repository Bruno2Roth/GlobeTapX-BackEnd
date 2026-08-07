import pool from '../../configs/SPConfig.js';

export default class idiomaRepository {
    constructor() {
        this.pool = pool;
    }

    getIdiomasSoportadosAsync = async () => {
        const sql = `
            SELECT DISTINCT "idiomaPreferido" AS "codigo"
            FROM "Usuario"
            WHERE "idiomaPreferido" IS NOT NULL
            ORDER BY "codigo"
        `;

        const res = await this.pool.query(sql);
        return res.rows;
    };
}
