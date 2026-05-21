import pool from '../../configs/SPConfig.js'

export default class ubicacionRepository {
    constructor() {
        console.log('Estoy en: ubicacionRepository.constructor()');
        this.pool = new pool();
    }

    getAllAsync = async () => {
        console.log(`ubicacionRepository.getAllAsync()`);

        const sql = `SELECT * FROM Ubicacion`;

        return await this.pool.queryAll(sql);
    }

    getByIdAsync = async (id) => {
        console.log(`ubicacionRepository.getByIdAsync(${id})`);

        const sql = `
            SELECT * 
            FROM Ubicacion
            WHERE ID = $1
        `;

        return await this.pool.queryOne(sql, [id]);
    }

    getByUsuarioAsync = async (IDUsuario) => {
        console.log(`ubicacionRepository.getByUsuarioAsync(${IDUsuario})`);

        const sql = `
            SELECT * 
            FROM Ubicacion
            WHERE IDUsuario = $1
        `;

        return await this.pool.queryAll(sql, [IDUsuario]);
    }

    createAsync = async (entity) => {
        console.log(`ubicacionRepository.createAsync(${JSON.stringify(entity)})`);

        const sql = `
            INSERT INTO Ubicacion
            (
                IDUsuario,
                posicion,
                ultimaActualizacion
            )
            VALUES ($1, $2, $3)
            RETURNING ID
        `;

        const values = [
            entity.IDUsuario,
            entity.posicion,
            entity.ultimaActualizacion
        ];

        return await this.pool.queryReturnId(sql, values);
    }

    updateAsync = async (entity) => {
        console.log(`ubicacionRepository.updateAsync(${JSON.stringify(entity)})`);

        const sql = `
            UPDATE Ubicacion
            SET
                IDUsuario = $2,
                posicion = $3,
                ultimaActualizacion = $4
            WHERE ID = $1
        `;

        const values = [
            entity.ID,
            entity.IDUsuario,
            entity.posicion,
            entity.ultimaActualizacion
        ];

        return await this.pool.queryRowCount(sql, values);
    }

    deleteByIdAsync = async (id) => {
        console.log(`ubicacionRepository.deleteByIdAsync(${id})`);

        const sql = `
            DELETE FROM Ubicacion
            WHERE ID = $1
        `;

        return await this.pool.queryRowCount(sql, [id]);
    }
}