import pool from '../../configs/SPConfig.js'

export default class idiomaRepository {
    constructor() {
        this.pool = pool;
    }

    getIdiomasSoportadosAsync = async () => {
        const sql = `SELECT DISTINCT "idiomaPreferido" AS "codigo" FROM "Usuario" WHERE "" IS NOT NULL`;
        const res = await this.pool.query(sql);
        return res.rows;
    }

    getTraduccionesPorIdiomaAsync = async (codigoIdioma) => {
        const sql = `
            SELECT "clave", "valor"
            FROM "Traduccion"
            WHERE "codigoIdioma" = $1
        `;
        const res = await this.pool.query(sql, [codigoIdioma]);
        return res.rows;
    }

    getTodasLasTraduccionesAsync = async () => {
        const sql = `SELECT * FROM "Traduccion" ORDER BY "codigoIdioma", "clave"`;
        const res = await this.pool.query(sql);
        return res.rows;
    }
}
