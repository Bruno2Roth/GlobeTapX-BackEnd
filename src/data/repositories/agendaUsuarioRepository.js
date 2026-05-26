import pool from '../../configs/SPConfig.js'

export default class AgendaUsuarioRepository {
    constructor() {
        console.log('Estoy en: AgendaUsuarioRepository.constructor()')
        this.pool = pool
    }

    getAllAsync = async () => {
        console.log(`AgendaUsuarioRepository.getAllAsync()`)

        const sql = `SELECT * FROM "AgendaUsuario"`

        const result = await this.pool.query(sql);
        return result.rows;
    }

    getByIdAsync = async (id) => {
        console.log(`AgendaUsuarioRepository.getByIdAsync(${id})`)

        const sql = `SELECT * FROM AgendaUsuario WHERE ID = $1`

        return await this.pool.queryOne(sql, [id]);
    }

    getByUsuarioAsync = async (IDUsuario) => {
        console.log(`AgendaUsuarioRepository.getByUsuarioAsync(${IDUsuario})`)

        const sql = `
            SELECT * 
            FROM AgendaUsuario
            WHERE IDUsuario = $1
        `

        return await this.pool.queryAll(sql, [IDUsuario])
    }

    getByEventoAsync = async (IDEvento) => {
        console.log(`AgendaUsuarioRepository.getByEventoAsync(${IDEvento})`);

        const sql = `
            SELECT * 
            FROM AgendaUsuario
            WHERE IDEvento = $1
        `

        return await this.pool.queryAll(sql, [IDEvento]);
    }

    createAsync = async (entity) => {
        console.log(`AgendaUsuarioRepository.createAsync(${JSON.stringify(entity)})`);

        const sql = `
            INSERT INTO AgendaUsuario
            (
                IDUsuario,
                IDEvento
            )
            VALUES ($1, $2)
            RETURNING ID
        `

        const values = [
            entity.IDUsuario,
            entity.IDEvento
        ]

        return await this.pool.queryReturnId(sql, values)
    }

    updateAsync = async (entity) => {
        console.log(`AgendaUsuarioRepository.updateAsync(${JSON.stringify(entity)})`)

        const sql = `
            UPDATE AgendaUsuario
            SET
                IDUsuario = $2,
                IDEvento = $3
            WHERE ID = $1`

        const values = [
            entity.ID,
            entity.IDUsuario,
            entity.IDEvento
        ]

        return await this.pool.queryRowCount(sql, values)
    }

    deleteByIdAsync = async (id) => {
        console.log(`AgendaUsuarioRepository.deleteByIdAsync(${id})`);

        const sql = `
            DELETE FROM AgendaUsuario
            WHERE ID = $1
        `;

        return await this.pool.queryRowCount(sql, [id]);
    }
}