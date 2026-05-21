import pool from '../../configs/SPConfig.js'

export default class zHistorialRepository {
    constructor() {
        console.log('Estoy en: zHistorialRepository.constructor()');
        this.pool = new pool();
    }

    getAllAsync = async () => {
        console.log(`zHistorialRepository.getAllAsync()`);

        const sql = `SELECT * FROM Historial`;

        return await this.pool.queryAll(sql);
    }

    getByIdAsync = async (id) => {
        console.log(`zHistorialRepository.getByIdAsync(${id})`);

        const sql = `
            SELECT * 
            FROM Historial
            WHERE ID = $1
        `;

        return await this.pool.queryOne(sql, [id]);
    }

    getByUsuarioAsync = async (IDUsuario) => {
        console.log(`zHistorialRepository.getByUsuarioAsync(${IDUsuario})`);

        const sql = `
            SELECT * 
            FROM Historial
            WHERE IDUsuario = $1
        `;

        return await this.pool.queryAll(sql, [IDUsuario]);
    }

    createAsync = async (entity) => {
        console.log(`zHistorialRepository.createAsync(${JSON.stringify(entity)})`);

        const sql = `
            INSERT INTO Historial
            (
                IDUsuario,
                query,
                dispositivo,
                fecha
            )
            VALUES ($1, $2, $3, $4)
            RETURNING ID
        `;

        const values = [
            entity.IDUsuario,
            entity.query,
            entity.dispositivo,
            entity.fecha
        ];

        return await this.pool.queryReturnId(sql, values);
    }

    updateAsync = async (entity) => {
        console.log(`zHistorialRepository.updateAsync(${JSON.stringify(entity)})`);

        const sql = `
            UPDATE Historial
            SET
                IDUsuario = $2,
                query = $3,
                dispositivo = $4,
                fecha = $5
            WHERE ID = $1
        `;

        const values = [
            entity.ID,
            entity.IDUsuario,
            entity.query,
            entity.dispositivo,
            entity.fecha
        ];

        return await this.pool.queryRowCount(sql, values);
    }

    deleteByIdAsync = async (id) => {
        console.log(`zHistorialRepository.deleteByIdAsync(${id})`);

        const sql = `
            DELETE FROM Historial
            WHERE ID = $1
        `;

        return await this.pool.queryRowCount(sql, [id]);
    }
}