import pool from '../../configs/SPConfig.js'

export default class preferenciaUsuarioRepository {
    constructor() {
        console.log('Estoy en: preferenciaUsuarioRepository.constructor()');
        this.pool = pool;
    }

    getAllAsync = async () => {
        console.log(`preferenciaUsuarioRepository.getAllAsync()`);

        const sql = `SELECT * FROM "PreferenciaUsuario"`;

        const res = await this.pool.query(sql);
        return res.rows;
    }

    getByIdAsync = async (id) => {
        console.log(`preferenciaUsuarioRepository.getByIdAsync(${id})`);

        const sql = `
            SELECT * 
            FROM "PreferenciaUsuario"
            WHERE "ID" = $1
        `;

        const res = await this.pool.query(sql, [id]);
        return res.rows && res.rows[0] ? res.rows[0] : null;
    }

    getByUsuarioAsync = async (IDUsuario) => {
        console.log(`preferenciaUsuarioRepository.getByUsuarioAsync(${IDUsuario})`);

        const sql = `
            SELECT * 
            FROM "PreferenciaUsuario"
            WHERE "IDUsuario" = $1
        `;

        const res = await this.pool.query(sql, [IDUsuario]);
        return res.rows;
    }

    createAsync = async (entity) => {
        console.log(`preferenciaUsuarioRepository.createAsync(${JSON.stringify(entity)})`);

        const sql = `
            INSERT INTO "PreferenciaUsuario"
            (
                "IDUsuario",
                "preferencia"
            )
            VALUES ($1, $2)
            RETURNING "ID"
        `;

        const values = [
            entity.IDUsuario,
            entity.preferencia
        ];

        const res = await this.pool.query(sql, values);
        return res.rows && res.rows[0] ? (res.rows[0].ID || res.rows[0].id) : null;
    }

    updateAsync = async (entity) => {
        console.log(`preferenciaUsuarioRepository.updateAsync(${JSON.stringify(entity)})`);

        const sql = `
            UPDATE "PreferenciaUsuario"
            SET
                "IDUsuario" = $2,
                "preferencia" = $3
            WHERE "ID" = $1
        `;

        const values = [
            entity.ID,
            entity.IDUsuario,
            entity.preferencia
        ];

        const res = await this.pool.query(sql, values);
        return res.rowCount;
    }

    deleteByIdAsync = async (id) => {
        console.log(`preferenciaUsuarioRepository.deleteByIdAsync(${id})`);

        const sql = `
            DELETE FROM "PreferenciaUsuario"
            WHERE "ID" = $1
        `;

        const res = await this.pool.query(sql, [id]);
        return res.rowCount;
    }
}