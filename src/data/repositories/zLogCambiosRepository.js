import pool from '../../configs/SPConfig.js'

export default class zlogCambiosRepository {
    constructor() {
        console.log('Estoy en: zlogCambiosRepository.constructor()');
        this.pool = pool;
    }

    getAllAsync = async () => {
        console.log(`zlogCambiosRepository.getAllAsync()`);

        const sql = `SELECT * FROM "zLogCambios"`;

        return await this.pool.queryAll(sql);
    }

    getByIdAsync = async (id) => {
        console.log(`zlogCambiosRepository.getByIdAsync(${id})`);

        const sql = `
            SELECT * 
            FROM "zLogCambios"
            WHERE "ID" = $1
        `;

        return await this.pool.queryOne(sql, [id]);
    }

    getByUsuarioAsync = async (IDUsuario) => {
        console.log(`zlogCambiosRepository.getByUsuarioAsync(${IDUsuario})`);

        const sql = `
            SELECT * 
            FROM "zLogCambios"
            WHERE "IDUsuario" = $1
        `;

        return await this.pool.queryAll(sql, [IDUsuario]);
    }

    createAsync = async (entity) => {
        console.log(`zlogCambiosRepository.createAsync(${JSON.stringify(entity)})`);

        const sql = `
            INSERT INTO "zLogCambios"
            (
                "IDUsuario",
                "accion",
                "tipoEntidad",
                "IDEntidad",
                "diferencia",
                "fechaCreacion"
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING "ID"
        `;

        const values = [
            entity.IDUsuario,
            entity.accion,
            entity.tipoEntidad,
            entity.IDEntidad,
            entity.diferencia,
            entity.fechaCreacion
        ];

        return await this.pool.queryReturnId(sql, values);
    }

    updateAsync = async (entity) => {
        console.log(`zlogCambiosRepository.updateAsync(${JSON.stringify(entity)})`);

        const sql = `
            UPDATE "zLogCambios"
            SET
                "IDUsuario" = $2,
                "accion" = $3,
                "tipoEntidad" = $4,
                "IDEntidad" = $5,
                "diferencia" = $6,
                "fechaCreacion" = $7
            WHERE "ID" = $1
        `;

        const values = [
            entity.ID,
            entity.IDUsuario,
            entity.accion,
            entity.tipoEntidad,
            entity.IDEntidad,
            entity.diferencia,
            entity.fechaCreacion
        ];

        return await this.pool.queryRowCount(sql, values);
    }

    deleteByIdAsync = async (id) => {
        console.log(`zlogCambiosRepository.deleteByIdAsync(${id})`);

        const sql = `
            DELETE FROM "zLogCambios"
            WHERE "ID" = $1
        `;

        return await this.pool.queryRowCount(sql, [id]);
    }
}