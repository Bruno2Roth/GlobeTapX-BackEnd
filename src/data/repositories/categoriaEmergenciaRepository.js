import pool from '../../configs/SPConfig.js'

export default class categoriasEmergenciaRepository {
    constructor() {
        console.log('Estoy en: categoriasEmergenciaRepository.constructor()');
        this.pool = pool;
    }

    getAllAsync = async () => {
        console.log(`categoriasEmergenciaRepository.getAllAsync()`);

        const sql = `SELECT * FROM "CategoriasEmergencia"`;

        const res = await this.pool.query(sql);
        return res.rows;
    }
    GetByPaisAsync = async (IDPais) => {
        console.log(`categoriasEmergenciaRepository.getByPaisAsync(${IDPais})`);

        const sql = `
            SELECT * 
            FROM "CategoriasEmergencia" 
            WHERE "IDPais" = $1
        `;

        const res = await this.pool.query(sql, [IDPais]);
        return res.rows;
    }
}