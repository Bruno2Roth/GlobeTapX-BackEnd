import pool from '../../configs/SPConfig.js'

export default class usuariosRepository {
    constructor() {
        console.log('Estoy en: usuariosRepository.constructor()');
        this.pool = pool;
    }

    getAllAsync = async () => {
        console.log(`usuariosRepository.getAllAsync()`);

        const sql = `SELECT * FROM "Usuario"`;

        const res = await this.pool.query(sql);
        return res.rows;
    }

    getByIdAsync = async (id) => {
        console.log(`usuariosRepository.getByIdAsync(${id})`);

        const sql = `SELECT * FROM "Usuario" WHERE "ID" = $1`;
        const res = await this.pool.query(sql, [id]);
        return res.rows && res.rows[0] ? res.rows[0] : null;
    }

    getByEmailAsync = async (email) => {
        console.log(`usuariosRepository.getByEmailAsync(${email})`);

        const sql = `SELECT * FROM "Usuario" WHERE "mail" = $1`;
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
                "mail",
                "contrasena",
                "nombreCompleto",
                "numeroContacto",
                "idiomapreferido",
                "paisActual"
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING "ID"
        `;

        const values = [
            entity.nombre,
            entity.email,
            entity.password,
            entity.nombreCompleto || null,
            entity.numeroContacto || null,
            entity.idiomaPreferido || entity.idioma || 'es',
            entity.paisactual || null
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
                "mail" = $3,
                "contrasena" = $4,
                "nombreCompleto" = $5,
                "numeroContacto" = $6,
                "idiomapreferido" = $7,
                "paisActual" = $8
            WHERE "ID" = $1
        `;

        const values = [
            entity.ID,
            entity.nombre,
            entity.email,
            entity.password,
            entity.nombreCompleto || null,
            entity.numeroContacto || null,
            entity.idiomaPreferido || entity.idioma || null,
            entity.paisactual || null
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

    getIdiomaPreferidoAsync = async (usuarioId) => {
        console.log(`usuariosRepository.getIdiomaPreferidoAsync(${usuarioId})`);

        const sql = `
            SELECT *
            FROM "Usuario"
            WHERE "ID" = $1
        `;

        const res = await this.pool.query(sql, [usuarioId]);
        if (!res.rows || !res.rows[0]) {
            return null;
        }

        const user = res.rows[0];
        return user.idiomapreferido || user.idioma || null;
    }

    updateIdiomaPreferidoAsync = async (usuarioId, codigoIdioma) => {
        console.log(`usuariosRepository.updateIdiomaPreferidoAsync(${usuarioId}, ${codigoIdioma})`);

        const sql = `
            UPDATE "Usuario"
            SET "idiomapreferido" = $2
            WHERE "ID" = $1
        `;

        const res = await this.pool.query(sql, [usuarioId, codigoIdioma]);
        return res.rowCount;
    }

    updatePaisActualAsync = async (usuarioId, paisactual) => {
        console.log(`usuariosRepository.updatePaisActualAsync(${usuarioId}, ${paisactual})`);

        const sql = `
            UPDATE "Usuario"
            SET "paisActual" = $2
            WHERE "ID" = $1
        `;

        const res = await this.pool.query(sql, [usuarioId, paisactual]);
        return res.rowCount;
    }
}