import pool from '../../configs/SPConfig.js';

export default class AgendaUsuarioRepository {

    constructor() {
        console.log('Estoy en: AgendaUsuarioRepository.constructor()');
        this.pool = pool;
    }

    getAllAsync = async () => {

        console.log('AgendaUsuarioRepository.getAllAsync()');

        const sql = `
            SELECT *
            FROM "AgendaUsuario"
        `;

        const result = await this.pool.query(sql);

        return result.rows;
    }

    getByIdAsync = async (id) => {

        console.log(`AgendaUsuarioRepository.getByIdAsync(${id})`);

        const sql = `
            SELECT *
            FROM "AgendaUsuario"
            WHERE "ID" = $1
        `;

        const result = await this.pool.query(sql, [id]);

        return result.rows[0];
    }

    getByUsuarioAsync = async (IDUsuario) => {

        console.log(`AgendaUsuarioRepository.getByUsuarioAsync(${IDUsuario})`);

        const sql = `
            SELECT *
            FROM "AgendaUsuario"
            WHERE "IDUsuario" = $1
        `;

        const result = await this.pool.query(sql, [IDUsuario]);

        return result.rows;
    }

    getByEventoAsync = async (IDEvento) => {

        console.log(`AgendaUsuarioRepository.getByEventoAsync(${IDEvento})`);

        const sql = `
            SELECT *
            FROM "AgendaUsuario"
            WHERE "IDEvento" = $1
        `;

        const result = await this.pool.query(sql, [IDEvento]);

        return result.rows;
    }

    createAsync = async (entity) => {

        console.log(`AgendaUsuarioRepository.createAsync(${JSON.stringify(entity)})`);

        const sql = `
            INSERT INTO "AgendaUsuario"
            (
                "IDUsuario",
                "IDEvento",
                "interes",
                "recordatorio"
            )
            VALUES ($1, $2, $3, $4)
            RETURNING "ID"
        `;

        const values = [
            entity.IDUsuario,
            entity.IDEvento,
            entity.interes,
            entity.recordatorio
        ];

        const result = await this.pool.query(sql, values);

        return result.rows[0];
    }

    updateAsync = async (entity) => {

        console.log(`AgendaUsuarioRepository.updateAsync(${JSON.stringify(entity)})`);

        const sql = `
            UPDATE "AgendaUsuario"
            SET
                "IDUsuario" = $2,
                "IDEvento" = $3,
                "interes" = $4,
                "recordatorio" = $5
            WHERE "ID" = $1
        `;

        const values = [
            entity.ID,
            entity.IDUsuario,
            entity.IDEvento,
            entity.interes,
            entity.recordatorio
        ];

        const result = await this.pool.query(sql, values);

        return result.rowCount;
    }

    deleteByIdAsync = async (id) => {

        console.log(`AgendaUsuarioRepository.deleteByIdAsync(${id})`);

        const sql = `
            DELETE FROM "AgendaUsuario"
            WHERE "ID" = $1
        `;

        const result = await this.pool.query(sql, [id]);

        return result.rowCount;
    }

    deleteByUsuarioAsync = async (IDUsuario) => {

        console.log(`AgendaUsuarioRepository.deleteByUsuarioAsync(${IDUsuario})`);

        const sql = `
            DELETE FROM "AgendaUsuario"
            WHERE "IDUsuario" = $1
        `;

        const result = await this.pool.query(sql, [IDUsuario]);

        return result.rowCount;
    }
}