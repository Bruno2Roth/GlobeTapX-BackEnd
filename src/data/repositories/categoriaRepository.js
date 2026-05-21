import pool from '../../configs/SPConfig.js'

export default class categoriaRepository {
    constructor() {
        console.log('Estoy en: categoriaRepository.constructor()');
        this.pool = pool;
    }

    getAllAsync = async () => {
        console.log(`categoriaRepository.getAllAsync()`);

        const sql = `SELECT * FROM Categoria`;

        return await this.pool.queryAll(sql);
    }

    getByNameAsync = async (name) => {
        console.log(`categoriaRepository.getByNameAsync(${name})`);

        const sql = `
            SELECT * 
            FROM Categoria 
            WHERE nombre ILIKE '%' || $1 || '%'
        `;

        return await this.pool.queryOne(sql, [name]);
    }
    }