import pool from '../../configs/SPConfig.js'

export default class paisRepository {
    constructor() {
        console.log('Estoy en: paisRepository.constructor()');
        this.pool = pool;
    }

    // Repositorio de país. Se conecta a la tabla "Pais" y devuelve información del país.

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

    getByNameAsync = async (name) => {
        console.log(`paisRepository.getByNameAsync(${name})`);

        const sql = `
            SELECT * 
            FROM "Pais" 
            WHERE "nombre" ILIKE '%' || $1 || '%' 
            LIMIT 1
        `;

        const res = await this.pool.query(sql, [name]);
        return res.rows && res.rows[0] ? res.rows[0] : null;
    }
}
