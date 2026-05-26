import pool from '../../configs/SPConfig.js';

export default class EventosRepository {

    constructor() {
        console.log('Estoy en: EventosRepository.constructor()');
        this.pool = pool;
    }

    getAllAsync = async () => {

        console.log('EventosRepository.getAllAsync()');

        const sql = `SELECT * FROM "Evento"`;

        const result = await this.pool.query(sql);

        return result.rows;
    }

    getByIdAsync = async (id) => {

        console.log(`EventosRepository.getByIdAsync(${id})`);

        const sql = `
            SELECT * 
            FROM "Evento"
            WHERE "ID" = $1
        `;

        const result = await this.pool.query(sql, [id]);

        return result.rows[0];
    }

    getByPaisAsync = async (IDPais) => {

        console.log(`EventosRepository.getByPaisAsync(${IDPais})`);

        const sql = `
            SELECT *
            FROM "Evento"
            WHERE "IDPais" = $1
        `;

        const result = await this.pool.query(sql, [IDPais]);

        return result.rows;
    }

    getByCategoriaAsync = async (IDCategoria) => {

        console.log(`EventosRepository.getByCategoriaAsync(${IDCategoria})`);

        const sql = `
            SELECT *
            FROM "Evento"
            WHERE "IDCategoria" = $1
        `;

        const result = await this.pool.query(sql, [IDCategoria]);

        return result.rows;
    }

    getCercanosAsync = async (ubicacion) => {

        console.log(`EventosRepository.getCercanosAsync(${ubicacion})`);

        const sql = `
            SELECT *
            FROM "Evento"
            WHERE "ubicacion" ILIKE '%' || $1 || '%'
        `;

        const result = await this.pool.query(sql, [ubicacion]);

        return result.rows;
    }

    createAsync = async (entity) => {

        console.log(`EventosRepository.createAsync(${JSON.stringify(entity)})`);

        const sql = `
            INSERT INTO "Evento"
            (
                "IDPais",
                "IDCategoria",
                "nombre",
                "descripcion",
                "fechaInicio",
                "fechaFin",
                "ubicacion"
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING "ID"
        `;

        const values = [
            entity.IDPais,
            entity.IDCategoria,
            entity.nombre,
            entity.descripcion,
            entity.fechaInicio,
            entity.fechaFin,
            entity.ubicacion
        ];

        const result = await this.pool.query(sql, values);

        return result.rows[0];
    }

    updateAsync = async (entity) => {

        console.log(`EventosRepository.updateAsync(${JSON.stringify(entity)})`);

        const sql = `
            UPDATE "Evento"
            SET
                "IDPais" = $2,
                "IDCategoria" = $3,
                "nombre" = $4,
                "descripcion" = $5,
                "fechaInicio" = $6,
                "fechaFin" = $7,
                "ubicacion" = $8
            WHERE "ID" = $1
        `;

        const values = [
            entity.ID,
            entity.IDPais,
            entity.IDCategoria,
            entity.nombre,
            entity.descripcion,
            entity.fechaInicio,
            entity.fechaFin,
            entity.ubicacion
        ];

        const result = await this.pool.query(sql, values);

        return result.rowCount;
    }

    deleteByIdAsync = async (id) => {

        console.log(`EventosRepository.deleteByIdAsync(${id})`);

        const sql = `
            DELETE FROM "Evento"
            WHERE "ID" = $1
        `;

        const result = await this.pool.query(sql, [id]);

        return result.rowCount;
    }
}