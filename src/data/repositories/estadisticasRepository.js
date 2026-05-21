import pool from '../../configs/SPConfig.js'

export default class estadisticasRepository {
    constructor() {
        console.log('Estoy en: estadisticasRepository.constructor()');
        this.pool = pool;
    }

    getAllAsync = async () => {
        console.log(`estadisticasRepository.getAllAsync()`);

        const sql = `SELECT * FROM Estadisticas`;

        return await this.pool.queryAll(sql);
    }

    getByIdAsync = async (id) => {
        console.log(`estadisticasRepository.getByIdAsync(${id})`);

        const sql = `
            SELECT * 
            FROM Estadisticas 
            WHERE ID = $1
        `;

        return await this.pool.queryOne(sql, [id]);
    }

    updateAsync = async (entity) => {
        console.log(`estadisticasRepository.updateAsync(${JSON.stringify(entity)})`);

        const sql = `
            UPDATE Estadisticas
            SET
                cantidadUsuarios = $2,
                cantidadEventos = $3,
                cantidadFavoritos = $4
            WHERE ID = $1
        `;

        const values = [
            entity.ID,
            entity.cantidadUsuarios,
            entity.cantidadEventos,
            entity.cantidadFavoritos
        ];

        return await this.pool.queryRowCount(sql, values);
    }
}