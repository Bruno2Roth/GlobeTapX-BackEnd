import pool from '../../configs/SPConfig.js'

export default class contenidoPaisRepository {
    constructor() {
        console.log('Estoy en: contenidoPaisRepository.constructor()');
        this.pool = pool;
    }

    getAllAsync = async () => {
        console.log(`contenidoPaisRepository.getAllAsync()`);

        const sql = `SELECT * FROM ContenidoPais`;

        return await this.pool.queryAll(sql);
    }

    getByIdAsync = async (id) => {
        console.log(`contenidoPaisRepository.getByIdAsync(${id})`);

        const sql = `
            SELECT * 
            FROM ContenidoPais
            WHERE ID = $1
        `;

        return await this.pool.queryOne(sql, [id]);
    }

    getByPaisAsync = async (IDPais) => {
        console.log(`contenidoPaisRepository.getByPaisAsync(${IDPais})`);

        const sql = `
            SELECT * 
            FROM ContenidoPais
            WHERE IDPais = $1
        `;

        return await this.pool.queryAll(sql, [IDPais]);
    }

    getByCategoriaAsync = async (IDCategoria) => {
        console.log(`contenidoPaisRepository.getByCategoriaAsync(${IDCategoria})`);

        const sql = `
            SELECT * 
            FROM ContenidoPais
            WHERE IDCategoria = $1
        `;

        return await this.pool.queryAll(sql, [IDCategoria]);
    }

    createAsync = async (entity) => {
        console.log(`contenidoPaisRepository.createAsync(${JSON.stringify(entity)})`);

        const sql = `
            INSERT INTO ContenidoPais
            (
                IDPais,
                IDCategoria,
                nombre,
                descripcion
            )
            VALUES ($1, $2, $3, $4)
            RETURNING ID
        `;

        const values = [
            entity.IDPais,
            entity.IDCategoria,
            entity.nombre,
            entity.descripcion
        ];

        return await this.pool.queryReturnId(sql, values);
    }

    updateAsync = async (entity) => {
        console.log(`contenidoPaisRepository.updateAsync(${JSON.stringify(entity)})`);

        const sql = `
            UPDATE ContenidoPais
            SET
                IDPais = $2,
                IDCategoria = $3,
                nombre = $4,
                descripcion = $5
            WHERE ID = $1
        `;

        const values = [
            entity.ID,
            entity.IDPais,
            entity.IDCategoria,
            entity.nombre,
            entity.descripcion
        ];

        return await this.pool.queryRowCount(sql, values);
    }

    deleteByIdAsync = async (id) => {
        console.log(`contenidoPaisRepository.deleteByIdAsync(${id})`);

        const sql = `
            DELETE FROM ContenidoPais
            WHERE ID = $1
        `;

        return await this.pool.queryRowCount(sql, [id]);
    }
}