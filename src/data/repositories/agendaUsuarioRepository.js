import pool from '../../configs/SPConfig.js'

export default class agendaUsuarioRepository {
    constructor() {
        console.log('Estoy en: agendaUsuarioRepository.constructor()')
        this.pool = pool
    }

    getAllAsync = async () => {
        console.log(`agendaUsuarioRepository.getAllAsync()`)

        const sql = `SELECT * FROM AgendaUsuario`

        return await this.pool.queryAll(sql)
    }

    getByIdAsync = async (id) => {
        console.log(`agendaUsuarioRepository.getByIdAsync(${id})`)

        const sql = `SELECT * FROM AgendaUsuario WHERE ID = $1`

        return await this.pool.queryOne(sql, [id]);
    }

    getByUsuarioAsync = async (IDUsuario) => {
        console.log(`agendaUsuarioRepository.getByUsuarioAsync(${IDUsuario})`)

        const sql = `
            SELECT * 
            FROM AgendaUsuario
            WHERE IDUsuario = $1
        `

        return await this.pool.queryAll(sql, [IDUsuario])
    }

    getByEventoAsync = async (IDEvento) => {
        console.log(`agendaUsuarioRepository.getByEventoAsync(${IDEvento})`);

        const sql = `
            SELECT * 
            FROM AgendaUsuario
            WHERE IDEvento = $1
        `

        return await this.pool.queryAll(sql, [IDEvento]);
    }

    createAsync = async (entity) => {
        console.log(`agendaUsuarioRepository.createAsync(${JSON.stringify(entity)})`);

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
        console.log(`agendaUsuarioRepository.updateAsync(${JSON.stringify(entity)})`)

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
        console.log(`agendaUsuarioRepository.deleteByIdAsync(${id})`);

        const sql = `
            DELETE FROM AgendaUsuario
            WHERE ID = $1
        `;

        return await this.pool.queryRowCount(sql, [id]);
    }
}