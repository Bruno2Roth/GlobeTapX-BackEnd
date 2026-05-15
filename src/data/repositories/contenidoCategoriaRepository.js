import supabase from '../connection.js'

export default class contenidoCategoriaRepository {
    constructor() {
        console.log('Estoy en: contenidoCategoriaRepository.constructor()');
        this.db = new Db();
    }

    getAllAsync = async () => {
        console.log(`contenidoCategoriaRepository.getAllAsync()`);
        const sql = `SELECT * FROM ContenidoCategoria`;
        return await this.db.queryAll(sql);
    }

    getByIdAsync = async (id) => {
        console.log(`contenidoCategoriaRepository.getByIdAsync(${id})`);
        const sql = `SELECT * FROM ContenidoCategoria WHERE ID = $1`;
        return await this.db.queryOne(sql, [id]);
    }

    getByContenidoAsync = async (IDContenido) => {
        console.log(`contenidoCategoriaRepository.getByContenidoAsync(${IDContenido})`);
        const sql = `SELECT * FROM ContenidoCategoria WHERE IDContenido = $1`;
        return await this.db.queryAll(sql, [IDContenido]);
    }

    getByCategoriaAsync = async (IDCategoria) => {
        console.log(`contenidoCategoriaRepository.getByCategoriaAsync(${IDCategoria})`);
        const sql = `SELECT * FROM ContenidoCategoria WHERE IDCategoria = $1`;
        return await this.db.queryAll(sql, [IDCategoria]);
    }
}
