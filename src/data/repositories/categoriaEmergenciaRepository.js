import pool from '../../configs/SPConfig.js'

export default class categoriasEmergenciaRepository {
    constructor() {
        console.log('Estoy en: categoriasEmergenciaRepository.constructor()');
        this.pool = new pool();
    }

    getAllAsync = async () => {
        console.log(`categoriasEmergenciaRepository.getAllAsync()`);

        const sql = `SELECT * FROM CategoriasEmergencia`;

        return await this.pool.queryAll(sql);
    }
    GetByPaisAsync = async (IDPais) => {
        console.log(`categoriasEmergenciaRepository.getByPaisAsync(${IDPais})`);

        const sql = `
            SELECT * 
            FROM CategoriasEmergencia 
            WHERE IDPais = $1
        `;

        return await this.pool.queryAll(sql, [IDPais]);
    }
}