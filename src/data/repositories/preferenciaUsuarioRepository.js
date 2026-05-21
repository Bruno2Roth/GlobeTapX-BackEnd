import pool from '../../configs/SPConfig.js'

export default class preferenciaUsuarioRepository {
    constructor() {
        console.log('Estoy en: preferenciaUsuarioRepository.constructor()');
        this.pool = new pool();
    }

    getAllAsync = async () => {
        console.log(`preferenciaUsuarioRepository.getAllAsync()`);

        const sql = `SELECT * FROM PreferenciaUsuario`;

        return await this.pool.queryAll(sql);
    }

    getByIdAsync = async (id) => {
        console.log(`preferenciaUsuarioRepository.getByIdAsync(${id})`);

        const sql = `
            SELECT * 
            FROM PreferenciaUsuario
            WHERE ID = $1
        `;

        return await this.pool.queryOne(sql, [id]);
    }

    getByUsuarioAsync = async (IDUsuario) => {
        console.log(`preferenciaUsuarioRepository.getByUsuarioAsync(${IDUsuario})`);

        const sql = `
            SELECT * 
            FROM PreferenciaUsuario
            WHERE IDUsuario = $1
        `;

        return await this.pool.queryAll(sql, [IDUsuario]);
    }

    createAsync = async (entity) => {
        console.log(`preferenciaUsuarioRepository.createAsync(${JSON.stringify(entity)})`);

        const sql = `
            INSERT INTO PreferenciaUsuario
            (
                IDUsuario,
                preferencia
            )
            VALUES ($1, $2)
            RETURNING ID
        `;

        const values = [
            entity.IDUsuario,
            entity.preferencia
        ];

        return await this.pool.queryReturnId(sql, values);
    }

    updateAsync = async (entity) => {
        console.log(`preferenciaUsuarioRepository.updateAsync(${JSON.stringify(entity)})`);

        const sql = `
            UPDATE PreferenciaUsuario
            SET
                IDUsuario = $2,
                preferencia = $3
            WHERE ID = $1
        `;

        const values = [
            entity.ID,
            entity.IDUsuario,
            entity.preferencia
        ];

        return await this.pool.queryRowCount(sql, values);
    }

    deleteByIdAsync = async (id) => {
        console.log(`preferenciaUsuarioRepository.deleteByIdAsync(${id})`);

        const sql = `
            DELETE FROM PreferenciaUsuario
            WHERE ID = $1
        `;

        return await this.pool.queryRowCount(sql, [id]);
    }
}