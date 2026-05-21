import pool from '../../configs/SPConfig.js'

export default class paisRepository {
    constructor() {
        console.log('Estoy en: paisRepository.constructor()');
        this.pool = new pool();
    }

    getAllAsync = async () => {
        console.log(`paisRepository.getAllAsync()`);

        const sql = `SELECT * FROM Pais`;

        return await this.pool.queryAll(sql);
    }

    getByIdAsync = async (id) => {
        console.log(`paisRepository.getByIdAsync(${id})`);

        const sql = `
            SELECT * 
            FROM Pais
            WHERE ID = $1
        `;

        return await this.pool.queryOne(sql, [id]);
    }
}