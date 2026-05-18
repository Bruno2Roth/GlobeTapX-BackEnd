import supabase from '../infraestructure/connection.js'

export default class paisRepository {
    constructor() {
        console.log('Estoy en: paisRepository.constructor()');
        this.db = new Db();
    }

    getAllAsync = async () => {
        console.log(`paisRepository.getAllAsync()`);

        const sql = `SELECT * FROM Pais`;

        return await this.db.queryAll(sql);
    }

    getByIdAsync = async (id) => {
        console.log(`paisRepository.getByIdAsync(${id})`);

        const sql = `
            SELECT * 
            FROM Pais
            WHERE ID = $1
        `;

        return await this.db.queryOne(sql, [id]);
    }
}