import pool from '../../configs/SPConfig.js';

export default class paisInfoRepository {
    constructor() {
        console.log('Estoy en: paisInfoRepository.constructor()');
        this.pool = pool;
    }

    // Repositorio de PaisInfo: consulta directamente la tabla "PaisInfo".
    getAllAsync = async () => {
        console.log('paisInfoRepository.getAllAsync()');

        const sql = `
            SELECT pi.*, p."nombre" AS "paisNombre"
            FROM "PaisInfo" pi
            LEFT JOIN "Pais" p ON p."ID" = pi."IDPais"
        `;

        const res = await this.pool.query(sql);
        return res.rows;
    }

    // Busca un registro de PaisInfo por el ID interno de la tabla PaisInfo.
    getByIdAsync = async (id) => {
        console.log(`paisInfoRepository.getByIdAsync(${id})`);

        const sql = `
            SELECT pi.*, p."nombre" AS "paisNombre"
            FROM "PaisInfo" pi
            LEFT JOIN "Pais" p ON p."ID" = pi."IDPais"
            WHERE pi."ID" = $1
        `;

        const res = await this.pool.query(sql, [id]);
        return res.rows && res.rows[0] ? res.rows[0] : null;
    }

    // Busca los registros de PaisInfo asociados a un país determinado.
    getByPaisIdAsync = async (IDPais) => {
        console.log(`paisInfoRepository.getByPaisIdAsync(${IDPais})`);

        const sql = `
            SELECT pi.*, p."nombre" AS "paisNombre"
            FROM "PaisInfo" pi
            LEFT JOIN "Pais" p ON p."ID" = pi."IDPais"
            WHERE pi."IDPais" = $1
        `;

        const res = await this.pool.query(sql, [IDPais]);
        return res.rows;
    }

    // Busca PaisInfo usando el nombre del país (búsqueda parcial y no sensible a mayúsculas).
    getByPaisNameAsync = async (name) => {
        console.log(`paisInfoRepository.getByPaisNameAsync(${name})`);

        const sql = `
            SELECT pi.*, p."nombre" AS "paisNombre"
            FROM "PaisInfo" pi
            LEFT JOIN "Pais" p ON p."ID" = pi."IDPais"
            WHERE p."nombre" ILIKE '%' || $1 || '%'
        `;

        const res = await this.pool.query(sql, [name]);
        return res.rows;
    }

    getDocumentationByPaisIdAsync = async (paisId) => {
        const sql = `
            SELECT p."ID" AS "paisId", p."nombre" AS "paisNombre",
                p."imagen" AS "imagen",
                pi."documentacion" AS "documentacion"
            FROM "Pais" p
            LEFT JOIN "PaisInfo" pi ON pi."IDPais" = p."ID"
            WHERE p."ID" = $1
        `;
        const res = await this.pool.query(sql, [paisId]);
        return res.rows?.[0] || null;
    }

    getDocumentationByPaisNameAsync = async (nombre) => {
        const sql = `
            SELECT p."ID" AS "paisId", p."nombre" AS "paisNombre",
                COALESCE(p."imagen", pi."imagen") AS "imagen",
                pi."documentacion" AS "documentacion"
            FROM "Pais" p
            LEFT JOIN "PaisInfo" pi ON pi."IDPais" = p."ID"
            WHERE p."nombre" ILIKE '%' || $1 || '%'
            ORDER BY p."nombre"
            LIMIT 1
        `;
        const res = await this.pool.query(sql, [nombre]);
        return res.rows?.[0] || null;
    }

    getAllDocumentationAsync = async () => {
        const sql = `
            SELECT p."ID" AS "paisId", p."nombre" AS "paisNombre",
                COALESCE(p."imagen", pi."imagen") AS "imagen",
                pi."documentacion" AS "documentacion"
            FROM "Pais" p
            LEFT JOIN "PaisInfo" pi ON pi."IDPais" = p."ID"
            ORDER BY p."nombre"
        `;
        const res = await this.pool.query(sql);
        return res.rows;
    }

}
