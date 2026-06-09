import pool from '../../configs/SPConfig.js'

export default class estadisticasRepository {
    constructor() {
        console.log('Estoy en: estadisticasRepository.constructor()');
        this.pool = pool;
    }

    getAllAsync = async () => {
        console.log(`estadisticasRepository.getAllAsync()`);

        const sql = `SELECT * FROM "Estadisticas"`;

        const res = await this.pool.query(sql);
        return res.rows;
    }

    getByIdAsync = async (id) => {
        console.log(`estadisticasRepository.getByIdAsync(${id})`);

        const sql = `
            SELECT * 
            FROM "Estadisticas" 
            WHERE "ID" = $1
        `;

        const res = await this.pool.query(sql, [id]);
        return res.rows && res.rows[0] ? res.rows[0] : null;
    }

    getByUsuarioAsync = async (usuarioId) => {
        console.log(`estadisticasRepository.getByUsuarioAsync(${usuarioId})`);

        const sql = `
            SELECT * 
            FROM "Estadisticas" 
            WHERE "IDUsuario" = $1
        `;

        const res = await this.pool.query(sql, [usuarioId]);
        return res.rows && res.rows[0] ? res.rows[0] : null;
    }

    updateAsync = async (entity) => {
        console.log(`estadisticasRepository.updateAsync(${JSON.stringify(entity)})`);

        const id = entity.ID;
        if (!id) throw new Error('ID es requerido en la entidad para actualizar');

        // Obtener la fila actual para descubrir los nombres reales de columnas
        const current = await this.getByIdAsync(id);
        if (!current) {
            return 0; // nothing to update
        }

        const rowCols = Object.keys(current); // nombres tal como devuelve pg

        // Normalizador simple: lower alfanum
        const normalize = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');

        // Campos enviados por body (excluir ID)
        const incomingRaw = Object.keys(entity).filter(k => k !== 'ID');

        // Normalizar y filtrar campos que ya no existen o que no queremos permitir actualizar
        const bannedNormalized = new Set([]);

        const incoming = incomingRaw.filter(k => {
            const nk = normalize(k);
            return !bannedNormalized.has(nk);
        });

        const sets = [];
        const values = [id];
        let idx = 2;

        for (const inKey of incoming) {
            const normIn = normalize(inKey);
            // buscar columna que coincida con la normalización
            const match = rowCols.find(c => {
                const nc = normalize(c);
                // coincidencia exacta
                if (nc === normIn) return true;
                // evitar emparejar columnas muy cortas (ej. 'id') mediante includes
                if (nc.length >= 3 && normIn.length >= 3) {
                    if (nc.includes(normIn) || normIn.includes(nc)) return true;
                }
                return false;
            });
            if (match) {
                sets.push({ col: match, param: `$${idx}` });
                values.push(entity[inKey]);
                idx++;
            }
        }

        if (sets.length === 0) {
            const available = rowCols.join(', ');
            throw new Error(`No se encontraron columnas válidas para actualizar. Columnas disponibles: ${available}`);
        }

        const setSql = sets.map(s => `"${s.col}" = ${s.param}`).join(', ');
        const sql = `UPDATE "Estadisticas" SET ${setSql} WHERE "ID" = $1`;
        console.log('estadisticasRepository.updateAsync: SQL ->', sql, 'VALUES ->', values);

        try {
            const res = await this.pool.query(sql, values);
            return res.rowCount;
        } catch (e) {
            console.error('estadisticasRepository.updateAsync: error ejecutando update:', e.message);
            throw e;
        }
    }

    deleteByUsuarioAsync = async (usuarioId) => {
        console.log(`estadisticasRepository.deleteByUsuarioAsync(${usuarioId})`);

        const sql = `
            DELETE FROM "Estadisticas"
            WHERE "IDUsuario" = $1
        `;

        const res = await this.pool.query(sql, [usuarioId]);
        return res.rowCount;
    }
}