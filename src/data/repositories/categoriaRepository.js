import pool from '../../configs/SPConfig.js'

export default class categoriaRepository {
    constructor() {
        console.log('Estoy en: categoriaRepository.constructor()');
        this.pool = pool;
    }

    getAllAsync = async () => {
        console.log(`categoriaRepository.getAllAsync()`);

        const sql = `SELECT * FROM "Categoria"`;

        const res = await this.pool.query(sql);
        return res.rows;
    }

    getByNameAsync = async (name) => {
        console.log(`categoriaRepository.getByNameAsync(${name})`);

        const sql = `
            SELECT * 
            FROM "Categoria" 
            WHERE "nombre" ILIKE '%' || $1 || '%'
        `;

        const res = await this.pool.query(sql, [name]);
        return res.rows && res.rows[0] ? res.rows[0] : null;
    }
    }