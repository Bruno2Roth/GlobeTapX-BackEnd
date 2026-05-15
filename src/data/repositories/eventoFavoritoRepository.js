import supabase from '../connection.js'

export default class eventoFavoritoRepository {
    constructor() {
        console.log('Estoy en: eventoFavoritoRepository.constructor()');
        this.db = new Db();
    }

    getAllAsync = async () => {
        console.log(`eventoFavoritoRepository.getAllAsync()`);

        const sql = `SELECT * FROM EventoFavorito`;

        return await this.db.queryAll(sql);
    }

    getByUsuarioAsync = async (IDUsuario) => {
        console.log(`eventoFavoritoRepository.getByUsuarioAsync(${IDUsuario})`);

        const sql = `
            SELECT * 
            FROM EventoFavorito
            WHERE IDUsuario = $1
        `;

        return await this.db.queryAll(sql, [IDUsuario]);
    }

    createAsync = async (entity) => {
        console.log(`eventoFavoritoRepository.createAsync(${JSON.stringify(entity)})`);

        const sql = `
            INSERT INTO EventoFavorito
            (
                IDUsuario,
                IDEvento
            )
            VALUES ($1, $2)
            RETURNING ID
        `;

        const values = [
            entity.IDUsuario,
            entity.IDEvento
        ];

        return await this.db.queryReturnId(sql, values);
    }

    deleteByIdAsync = async (id) => {
        console.log(`eventoFavoritoRepository.deleteByIdAsync(${id})`);

        const sql = `
            DELETE FROM EventoFavorito
            WHERE ID = $1
        `;

        return await this.db.queryRowCount(sql, [id]);
    }
}