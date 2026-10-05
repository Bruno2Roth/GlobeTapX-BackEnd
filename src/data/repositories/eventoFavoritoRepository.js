import pool from '../../configs/SPConfig.js'

export default class eventoFavoritoRepository {
    constructor() {
        console.log('Estoy en: eventoFavoritoRepository.constructor()');
        this.pool = pool;
    }

    getAllAsync = async () => {
        console.log(`eventoFavoritoRepository.getAllAsync()`);

        const sql = `SELECT * FROM "EventoFavorito"`;

        const res = await this.pool.query(sql);
        return res.rows;
    }

    getByUsuarioConEventoAsync = async (IDUsuario) => {
        const sql = `
            SELECT f.*,
                CASE WHEN e."ID" IS NULL THEN NULL ELSE
                    to_jsonb(e) || jsonb_build_object(
                        'categoria', c."nombre",
                        'paisNombre', p."nombre"
                    )
                END AS "evento"
            FROM "EventoFavorito" f
            LEFT JOIN "Evento" e ON e."ID" = f."IDEvento"
            LEFT JOIN "Categoria" c ON c."ID" = e."IDCategoria"
            LEFT JOIN "Pais" p ON p."ID" = e."IDPais"
            WHERE f."IDUsuario" = $1
            ORDER BY f."fechaAgregado" DESC NULLS LAST, f."ID" DESC
        `;
        const res = await this.pool.query(sql, [IDUsuario]);
        return res.rows;
    }

    getAllConEventoAsync = async () => {
        const sql = `
            SELECT f.*,
                CASE WHEN e."ID" IS NULL THEN NULL ELSE
                    to_jsonb(e) || jsonb_build_object(
                        'categoria', c."nombre",
                        'paisNombre', p."nombre"
                    )
                END AS "evento"
            FROM "EventoFavorito" f
            LEFT JOIN "Evento" e ON e."ID" = f."IDEvento"
            LEFT JOIN "Categoria" c ON c."ID" = e."IDCategoria"
            LEFT JOIN "Pais" p ON p."ID" = e."IDPais"
            ORDER BY f."fechaAgregado" DESC NULLS LAST, f."ID" DESC
        `;
        const res = await this.pool.query(sql);
        return res.rows;
    }

    getByUsuarioAsync = async (IDUsuario) => {
        console.log(`eventoFavoritoRepository.getByUsuarioAsync(${IDUsuario})`);

        const sql = `
            SELECT * 
            FROM "EventoFavorito"
            WHERE "IDUsuario" = $1
        `;

        const res = await this.pool.query(sql, [IDUsuario]);
        return res.rows;
    }

    getByIdAsync = async (id) => {
        console.log(`eventoFavoritoRepository.getByIdAsync(${id})`);

        const sql = `SELECT * FROM "EventoFavorito" WHERE "ID" = $1`;
        const res = await this.pool.query(sql, [id]);
        return res.rows && res.rows[0] ? res.rows[0] : null;
    }

    createAsync = async (entity) => {
        console.log(`eventoFavoritoRepository.createAsync(${JSON.stringify(entity)})`);

        const sql = `
            INSERT INTO "EventoFavorito"
            (
                "IDUsuario",
                "IDEvento"
            )
            VALUES ($1, $2)
            RETURNING "ID"
        `;

        const values = [
            entity.IDUsuario,
            entity.IDEvento
        ];

        const res = await this.pool.query(sql, values);
        return res.rows && res.rows[0] ? (res.rows[0].ID || res.rows[0].id) : null;
    }

    deleteByIdAsync = async (id) => {
        console.log(`eventoFavoritoRepository.deleteByIdAsync(${id})`);

        const sql = `
            DELETE FROM "EventoFavorito"
            WHERE "ID" = $1
        `;

        const res = await this.pool.query(sql, [id]);
        return res.rowCount;
    }
}