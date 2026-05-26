import pool from '../../configs/SPConfig.js'

export default class paisRepository {
    constructor() {
        console.log('Estoy en: paisRepository.constructor()');
        this.pool = pool;
    }

    getAllAsync = async () => {
        console.log(`paisRepository.getAllAsync()`);

        const sql = `SELECT * FROM "Pais"`;

        const res = await this.pool.query(sql);
        return res.rows;
    }

    getByIdAsync = async (id) => {
        console.log(`paisRepository.getByIdAsync(${id})`);

        const sql = `
            SELECT * 
            FROM "Pais"
            WHERE "ID" = $1
        `;

        const res = await this.pool.query(sql, [id]);
        return res.rows && res.rows[0] ? res.rows[0] : null;
    }
}