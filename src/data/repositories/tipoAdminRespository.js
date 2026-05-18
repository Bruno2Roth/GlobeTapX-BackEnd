export default class tipoAdminRepository {
    constructor() {
        console.log('Estoy en: tipoAdminRepository.constructor()');
        this.db = new Db();
    }

    getAllAsync = async () => {
        console.log(`tipoAdminRepository.getAllAsync()`);

        const sql = `SELECT * FROM TipoAdmin`;

        return await this.db.queryAll(sql);
    }

    getByIdAsync = async (id) => {
        console.log(`tipoAdminRepository.getByIdAsync(${id})`);

        const sql = `
            SELECT * 
            FROM TipoAdmin
            WHERE ID = $1
        `;

        return await this.db.queryOne(sql, [id]);
    }

    createAsync = async (entity) => {
        console.log(`tipoAdminRepository.createAsync(${JSON.stringify(entity)})`);

        const sql = `
            INSERT INTO TipoAdmin
            (
                nombre,
                descripcion
            )
            VALUES ($1, $2)
            RETURNING ID
        `;

        const values = [
            entity.nombre,
            entity.descripcion
        ];

        return await this.db.queryReturnId(sql, values);
    }

    updateAsync = async (entity) => {
        console.log(`tipoAdminRepository.updateAsync(${JSON.stringify(entity)})`);

        const sql = `
            UPDATE TipoAdmin
            SET
                nombre = $2,
                descripcion = $3
            WHERE ID = $1
        `;

        const values = [
            entity.ID,
            entity.nombre,
            entity.descripcion
        ];

        return await this.db.queryRowCount(sql, values);
    }

    deleteByIdAsync = async (id) => {
        console.log(`tipoAdminRepository.deleteByIdAsync(${id})`);

        const sql = `
            DELETE FROM TipoAdmin
            WHERE ID = $1
        `;

        return await this.db.queryRowCount(sql, [id]);
    }
}