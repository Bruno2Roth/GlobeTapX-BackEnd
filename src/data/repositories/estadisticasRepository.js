import pool from '../../configs/SPConfig.js'

export default class estadisticasRepository {
    constructor() {
        console.log('Estoy en: estadisticasRepository.constructor()');
        this.pool = pool;
    }

    getAllAsync = async () => {
        console.log(`estadisticasRepository.getAllAsync()`);

        const sql = `SELECT * FROM "Estadisticas"`;

        const res = await this.pool.query(sql);
        return res.rows;
    }

    getByIdAsync = async (id) => {
        console.log(`estadisticasRepository.getByIdAsync(${id})`);

        const sql = `
            SELECT * 
            FROM "Estadisticas" 
            WHERE "ID" = $1
        `;

        const res = await this.pool.query(sql, [id]);
        return res.rows && res.rows[0] ? res.rows[0] : null;
    }

    updateAsync = async (entity) => {
        console.log(`estadisticasRepository.updateAsync(${JSON.stringify(entity)})`);

        const sql = `
            UPDATE "Estadisticas"
            SET
                "cantidadUsuarios" = $2,
                "cantidadEventos" = $3,
                "cantidadFavoritos" = $4
            WHERE "ID" = $1
        `;

        const values = [
            entity.ID,
            entity.cantidadUsuarios,
            entity.cantidadEventos,
            entity.cantidadFavoritos
        ];

        const res = await this.pool.query(sql, values);
        return res.rowCount;
    }
}