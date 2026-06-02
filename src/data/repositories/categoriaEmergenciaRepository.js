import pool from '../../configs/SPConfig.js'

export default class categoriasEmergenciaRepository {
    constructor() {
        console.log('Estoy en: categoriasEmergenciaRepository.constructor()');
        this.pool = pool;
    }

    getAllAsync = async () => {
        console.log(`categoriasEmergenciaRepository.getAllAsync()`);

        const sql = `SELECT * FROM "CategoriaEmergencia"`;

        const res = await this.pool.query(sql);
        return res.rows;
    }

    getByPaisAsync = async (IDPais) => {
        console.log(`categoriasEmergenciaRepository.getByPaisAsync(${IDPais})`);

        const sql = `
            SELECT * 
            FROM "CategoriaEmergencia" 
            WHERE "IDPais" = $1
        `;

        const res = await this.pool.query(sql, [IDPais]);
        return res.rows;
    }
}