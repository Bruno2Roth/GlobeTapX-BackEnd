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

    // Devuelve solo el campo de reglas para todos los países.
    getAllRulesAsync = async () => {
        console.log('paisInfoRepository.getAllRulesAsync()');

        const sql = `
            SELECT pi."ID", pi."IDPais", pi."reglas", p."nombre" AS "paisNombre"
            FROM "PaisInfo" pi
            LEFT JOIN "Pais" p ON p."ID" = pi."IDPais"
        `;

        const res = await this.pool.query(sql);
        return res.rows;
    }

    // Devuelve solo el campo de reglas para un país en particular.
    getRulesByPaisIdAsync = async (IDPais) => {
        console.log(`paisInfoRepository.getRulesByPaisIdAsync(${IDPais})`);

        const sql = `
            SELECT pi."ID", pi."IDPais", pi."reglas", p."nombre" AS "paisNombre"
            FROM "PaisInfo" pi
            LEFT JOIN "Pais" p ON p."ID" = pi."IDPais"
            WHERE pi."IDPais" = $1
        `;

        const res = await this.pool.query(sql, [IDPais]);
        return res.rows;
    }

    // Devuelve solo el campo de reglas a partir del nombre del país.
    getRulesByPaisNameAsync = async (name) => {
        console.log(`paisInfoRepository.getRulesByPaisNameAsync(${name})`);

        const sql = `
            SELECT pi."ID", pi."IDPais", pi."reglas", p."nombre" AS "paisNombre"
            FROM "PaisInfo" pi
            LEFT JOIN "Pais" p ON p."ID" = pi."IDPais"
            WHERE p."nombre" ILIKE '%' || $1 || '%'
        `;

        const res = await this.pool.query(sql, [name]);
        return res.rows;
    }
}
