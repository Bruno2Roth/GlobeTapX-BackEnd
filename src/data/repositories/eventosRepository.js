import supabase from '../connection.js'

export default class EventosRepository {
    constructor() {
        console.log('Estoy en: EventosRepository.constructor()');
        this.db = new Db();
    }

    getAllAsync = async () => {
        console.log(`EventosRepository.getAllAsync()`);

        const sql = `SELECT * FROM Evento`;

        return await this.db.queryAll(sql);
    }

    getByIdAsync = async (id) => {
        console.log(`EventosRepository.getByIdAsync(${id})`);

        const sql = `SELECT * FROM Evento WHERE ID = $1`;

        return await this.db.queryOne(sql, [id]);
    }

    getByPaisAsync = async (IDPais) => {
        console.log(`EventosRepository.getByPaisAsync(${IDPais})`);

        const sql = `SELECT * FROM Evento WHERE IDPais = $1`;

        return await this.db.queryAll(sql, [IDPais]);
    }

    getByCategoriaAsync = async (IDCategoria) => {
        console.log(`EventosRepository.getByCategoriaAsync(${IDCategoria})`);

        const sql = `SELECT * FROM Evento WHERE IDCategoria = $1`;

        return await this.db.queryAll(sql, [IDCategoria]);
    }

    getCercanosAsync = async (ubicacion) => {
        console.log(`EventosRepository.getCercanosAsync(${ubicacion})`);

        const sql = `
            SELECT * 
            FROM Evento 
            WHERE ubicacion ILIKE '%' || $1 || '%'
        `;

        return await this.db.queryAll(sql, [ubicacion]);
    }

    createAsync = async (entity) => {
        console.log(`EventosRepository.createAsync(${JSON.stringify(entity)})`);

        const sql = `
            INSERT INTO Evento
            (
                IDPais,
                IDCategoria,
                nombre,
                descripcion,
                fechaInicio,
                fechaFin,
                ubicacion
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING ID
        `;

        const values = [
            entity.IDPais,
            entity.IDCategoria,
            entity.nombre,
            entity.descripcion,
            entity.fechaInicio,
            entity.fechaFin,
            entity.ubicacion
        ];

        return await this.db.queryReturnId(sql, values);
    }

    updateAsync = async (entity) => {
        console.log(`EventosRepository.updateAsync(${JSON.stringify(entity)})`);

        const sql = `
            UPDATE Evento
            SET
                IDPais = $2,
                IDCategoria = $3,
                nombre = $4,
                descripcion = $5,
                fechaInicio = $6,
                fechaFin = $7,
                ubicacion = $8
            WHERE ID = $1
        `;

        const values = [
            entity.ID,
            entity.IDPais,
            entity.IDCategoria,
            entity.nombre,
            entity.descripcion,
            entity.fechaInicio,
            entity.fechaFin,
            entity.ubicacion
        ];

        return await this.db.queryRowCount(sql, values);
    }

    deleteByIdAsync = async (id) => {
        console.log(`EventosRepository.deleteByIdAsync(${id})`);

        const sql = `DELETE FROM Evento WHERE ID = $1`;

        return await this.db.queryRowCount(sql, [id]);
    }
}