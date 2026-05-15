import supabase from '../connection.js'

export default class categoriasEmergenciaRepository {
    constructor() {
        console.log('Estoy en: categoriasEmergenciaRepository.constructor()');
        this.db = new Db();
    }

    getAllAsync = async () => {
        console.log(`categoriasEmergenciaRepository.getAllAsync()`);

        const sql = `SELECT * FROM CategoriasEmergencia`;

        return await this.db.queryAll(sql);
    }
    GetByPaisAsync = async (IDPais) => {
        console.log(`categoriasEmergenciaRepository.getByPaisAsync(${IDPais})`);

        const sql = `
            SELECT * 
            FROM CategoriasEmergencia 
            WHERE IDPais = $1
        `;

        return await this.db.queryAll(sql, [IDPais]);
    }
}