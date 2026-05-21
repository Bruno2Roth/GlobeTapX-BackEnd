import pool from '../../configs/SPConfig.js'

export default class usuariosRepository {
    constructor() {
        console.log('Estoy en: usuariosRepository.constructor()');
        this.pool = new pool();
    }

    getAllAsync = async () => {
        console.log(`usuariosRepository.getAllAsync()`);

        const sql = `SELECT * FROM Usuario`;

        return await this.pool.queryAll(sql);
    }

    getByIdAsync = async (id) => {
        console.log(`usuariosRepository.getByIdAsync(${id})`);

        const sql = `SELECT * FROM Usuario WHERE ID = $1`;

        return await this.pool.queryOne(sql, [id]);
    }

    getByEmailAsync = async (email) => {
        console.log(`usuariosRepository.getByEmailAsync(${email})`);

        const sql = `SELECT * FROM Usuario WHERE email = $1`;

        return await this.pool.queryOne(sql, [email]);
    }

    getByNombreAsync = async (nombre) => {
        console.log(`usuariosRepository.getByNombreAsync(${nombre})`);

        const sql = `
            SELECT * 
            FROM Usuario 
            WHERE nombre ILIKE '%' || $1 || '%'
        `;

        return await this.pool.queryAll(sql, [nombre]);
    }

    createAsync = async (entity) => {
        console.log(`usuariosRepository.createAsync(${JSON.stringify(entity)})`);

        const sql = `
            INSERT INTO Usuario
            (
                nombre,
                apellido,
                email,
                password,
                fechaNacimiento
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING ID
        `;

        const values = [
            entity.nombre,
            entity.apellido,
            entity.email,
            entity.password,
            entity.fechaNacimiento
        ];

        return await this.pool.queryReturnId(sql, values);
    }

    updateAsync = async (entity) => {
        console.log(`usuariosRepository.updateAsync(${JSON.stringify(entity)})`);

        const sql = `
            UPDATE Usuario
            SET
                nombre = $2,
                apellido = $3,
                email = $4,
                password = $5,
                fechaNacimiento = $6
            WHERE ID = $1
        `;

        const values = [
            entity.ID,
            entity.nombre,
            entity.apellido,
            entity.email,
            entity.password,
            entity.fechaNacimiento
        ];

        return await this.pool.queryRowCount(sql, values);
    }

    deleteByIdAsync = async (id) => {
        console.log(`usuariosRepository.deleteByIdAsync(${id})`);

        const sql = `DELETE FROM Usuario WHERE ID = $1`;

        return await this.pool.queryRowCount(sql, [id]);
    }
}