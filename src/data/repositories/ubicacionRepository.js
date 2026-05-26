import pool from '../../configs/SPConfig.js'

export default class ubicacionRepository {
    constructor() {
        console.log('Estoy en: ubicacionRepository.constructor()');
        this.pool = pool;
    }

    getAllAsync = async () => {
        console.log(`ubicacionRepository.getAllAsync()`);

        const sql = `SELECT * FROM "Ubicacion"`;

        const res = await this.pool.query(sql);
        return res.rows;
    }

    getByIdAsync = async (id) => {
        console.log(`ubicacionRepository.getByIdAsync(${id})`);

        const sql = `
            SELECT * 
            FROM "Ubicacion"
            WHERE "ID" = $1
        `;

        const res = await this.pool.query(sql, [id]);
        return res.rows && res.rows[0] ? res.rows[0] : null;
    }

    getByUsuarioAsync = async (IDUsuario) => {
        console.log(`ubicacionRepository.getByUsuarioAsync(${IDUsuario})`);

        const sql = `
            SELECT * 
            FROM "Ubicacion"
            WHERE "IDUsuario" = $1
        `;

        const res = await this.pool.query(sql, [IDUsuario]);
        return res.rows;
    }

    createAsync = async (entity) => {
        console.log(`ubicacionRepository.createAsync(${JSON.stringify(entity)})`);

        const sql = `
            INSERT INTO "Ubicacion"
            (
                "IDUsuario",
                "posicion",
                "ultimaActualizacion"
            )
            VALUES ($1, $2, $3)
            RETURNING "ID"
        `;

        const values = [
            entity.IDUsuario,
            entity.posicion,
            entity.ultimaActualizacion
        ];

        const res = await this.pool.query(sql, values);
        return res.rows && res.rows[0] ? (res.rows[0].ID || res.rows[0].id) : null;
    }

    updateAsync = async (entity) => {
        console.log(`ubicacionRepository.updateAsync(${JSON.stringify(entity)})`);

        const sql = `
            UPDATE "Ubicacion"
            SET
                "IDUsuario" = $2,
                "posicion" = $3,
                "ultimaActualizacion" = $4
            WHERE "ID" = $1
        `;

        const values = [
            entity.ID,
            entity.IDUsuario,
            entity.posicion,
            entity.ultimaActualizacion
        ];

        const res = await this.pool.query(sql, values);
        return res.rowCount;
    }

    deleteByIdAsync = async (id) => {
        console.log(`ubicacionRepository.deleteByIdAsync(${id})`);

        const sql = `
            DELETE FROM "Ubicacion"
            WHERE "ID" = $1
        `;

        const res = await this.pool.query(sql, [id]);
        return res.rowCount;
    }
}