import pool from '../../configs/SPConfig.js'

export default class contenidoCategoriaRepository {
    constructor() {
        console.log('Estoy en: contenidoCategoriaRepository.constructor()');
        this.pool = pool;
    }

    // Repositorio para la tabla "ContenidoCategoria".

    // Obtiene todos los registros de contenido por categoría.
    getAllAsync = async () => {
        console.log(`contenidoCategoriaRepository.getAllAsync()`);
        const sql = `SELECT * FROM "ContenidoCategoria"`;
        const res = await this.pool.query(sql);
        return res.rows;
    }

    getByIdAsync = async (id) => {
        console.log(`contenidoCategoriaRepository.getByIdAsync(${id})`);
        const sql = `SELECT * FROM "ContenidoCategoria" WHERE "ID" = $1`;
        const res = await this.pool.query(sql, [id]);
        return res.rows && res.rows[0] ? res.rows[0] : null;
    }

    getByContenidoAsync = async (IDContenido) => {
        console.log(`contenidoCategoriaRepository.getByContenidoAsync(${IDContenido})`);
        const sql = `SELECT * FROM "ContenidoCategoria" WHERE "IDContenido" = $1`;
        const res = await this.pool.query(sql, [IDContenido]);
        return res.rows;
    }

    getByCategoriaAsync = async (IDCategoria) => {
        console.log(`contenidoCategoriaRepository.getByCategoriaAsync(${IDCategoria})`);
        const sql = `SELECT * FROM "ContenidoCategoria" WHERE "IDCategoria" = $1`;
        const res = await this.pool.query(sql, [IDCategoria]);
        return res.rows;
    }
}
