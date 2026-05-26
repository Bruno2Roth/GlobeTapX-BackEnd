import pool from '../../configs/SPConfig.js'

export default class usuariosRepository {
    constructor() {
        console.log('Estoy en: usuariosRepository.constructor()');
        this.pool = pool;
    }

    getAllAsync = async () => {
        console.log(`usuariosRepository.getAllAsync()`);

        const res = await this.pool.query(sql);
        return res.rows;
    }

    getByIdAsync = async (id) => {
        console.log(`usuariosRepository.getByIdAsync(${id})`);

        const res = await this.pool.query(sql, [id]);
        return res.rows && res.rows[0] ? res.rows[0] : null;
    }

    getByEmailAsync = async (email) => {
        console.log(`usuariosRepository.getByEmailAsync(${email})`);

        const res = await this.pool.query(sql, [email]);
        return res.rows && res.rows[0] ? res.rows[0] : null;
    }

    getByNombreAsync = async (nombre) => {
        console.log(`usuariosRepository.getByNombreAsync(${nombre})`);

        const sql = `
            SELECT * 
            FROM "Usuario" 
            WHERE "nombre" ILIKE '%' || $1 || '%'
        `;

        const res = await this.pool.query(sql, [nombre]);
        return res.rows;
    }

    createAsync = async (entity) => {
        console.log(`usuariosRepository.createAsync(${JSON.stringify(entity)})`);

        const sql = `
            INSERT INTO "Usuario"
            (
                "nombre",
                "apellido",
                "email",
                "password",
                "fechaNacimiento"
            )
            VALUES ($1, $2, $3, $4, $5)
            RETURNING "ID"
        `;

        const values = [
            entity.nombre,
            entity.apellido,
            entity.email,
            entity.password,
            entity.fechaNacimiento
        ];

        const res = await this.pool.query(sql, values);
        return res.rows && res.rows[0] ? (res.rows[0].ID || res.rows[0].id) : null;
    }

    updateAsync = async (entity) => {
        console.log(`usuariosRepository.updateAsync(${JSON.stringify(entity)})`);

        const sql = `
            UPDATE "Usuario"
            SET
                "nombre" = $2,
                "apellido" = $3,
                "email" = $4,
                "password" = $5,
                "fechaNacimiento" = $6
            WHERE "ID" = $1
        `;

        const values = [
            entity.ID,
            entity.nombre,
            entity.apellido,
            entity.email,
            entity.password,
            entity.fechaNacimiento
        ];

        const res = await this.pool.query(sql, values);
        return res.rowCount;
    }

    deleteByIdAsync = async (id) => {
        console.log(`usuariosRepository.deleteByIdAsync(${id})`);

        const sql = `DELETE FROM "Usuario" WHERE "ID" = $1`;
        const res = await this.pool.query(sql, [id]);
        return res.rowCount;
    }
}