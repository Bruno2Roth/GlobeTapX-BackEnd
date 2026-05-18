import supabase from '../infraestructure/connection.js'

export default class categoriaRepository {
    constructor() {
        console.log('Estoy en: categoriaRepository.constructor()');
        this.db = new Db();
    }

    getAllAsync = async () => {
        console.log(`categoriaRepository.getAllAsync()`);

        const sql = `SELECT * FROM Categoria`;

        return await this.db.queryAll(sql);
    }

    getByNameAsync = async (name) => {
        console.log(`categoriaRepository.getByNameAsync(${name})`);

        const sql = `
            SELECT * 
            FROM Categoria 
            WHERE nombre ILIKE '%' || $1 || '%'
        `;

        return await this.db.queryOne(sql, [name]);
    }
    }