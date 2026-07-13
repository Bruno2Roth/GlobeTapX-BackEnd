import pool from '../../configs/SPConfig.js'

export default class numerosEmergenciaDbRepository {
    constructor() {
        console.log('numerosEmergenciaDbRepository.constructor()');
        this.pool = pool;
    }

    normalizeRow = (row) => {
        if (!row) return null;
        return {
            ...row,
            ambulance: row.ambulance ?? row.Ambulance ?? null,
            fire: row.fire ?? row.firedepartment ?? row.fireDepartment ?? row.FireDepartment ?? null,
            police: row.police ?? row.Police ?? null,
            dispatch: row.dispatch ?? row.emergencydispatch ?? row.emergencyDispatch ?? row.emergency_dispatch ?? row.Dispatch ?? null,
            country: row.country ?? row.pais ?? row.Country ?? null,
            countrycode: row.countrycode ?? row.countryCode ?? row.code ?? row.ISOCode ?? null,
        };
    }

    getAllAsync = async () => {
        console.log(`numerosEmergenciaDbRepository.getAllAsync()`);
        const sql = `SELECT * FROM "NumerosEmergenciaa"`;
        const res = await this.pool.query(sql);
        return res.rows.map(this.normalizeRow);
    }

    getByCodeAsync = async (code) => {
        console.log(`numerosEmergenciaDbRepository.getByCodeAsync(${code})`);
        if (!code) return null;
        const norm = String(code).toUpperCase();

        console.log('numerosEmergenciaDbRepository: normalized search token ->', norm);

        // 1) Try exact matches on common text fields (case-insensitive)
        const sql = `
            SELECT * FROM "NumerosEmergenciaa"
            WHERE upper(COALESCE("ISOCode", '')) = $1
               OR upper(COALESCE("code", '')) = $1
               OR upper(COALESCE("countrycode", '')) = $1
               OR upper(COALESCE("pais", '')) = $1
               OR upper(COALESCE("country", '')) = $1
            LIMIT 1
        `;
        try {
            const res = await this.pool.query(sql, [norm]);
            if (res.rows && res.rows.length) {
                console.log('numerosEmergenciaDbRepository: found by exact text match');
                return this.normalizeRow(res.rows[0]);
            }
        } catch (e) {
            console.warn('numerosEmergenciaDbRepository: exact-text query error', e.message || e);
        }

        // 2) If token is numeric, try numeric columns
        if (/^\d+$/.test(code)) {
            try {
                const resn = await this.pool.query(`SELECT * FROM "NumerosEmergenciaa" WHERE COALESCE("ISONumeric", '') = $1 OR COALESCE("numericCode", '') = $1 LIMIT 1`, [String(code)]);
                if (resn.rows && resn.rows.length) {
                    console.log('numerosEmergenciaDbRepository: found by numeric match');
                    return this.normalizeRow(resn.rows[0]);
                }
            } catch (en) {
                console.warn('numerosEmergenciaDbRepository: numeric query error', en.message || en);
            }
        }

        // 3) Try ILIKE partial/name matches
        try {
            const likeParam = `%${String(code).replace(/%/g, '')}%`;
            const rlike = await this.pool.query(`
                SELECT * FROM "NumerosEmergenciaa"
                WHERE "pais" ILIKE $1 OR "country" ILIKE $1 OR "name" ILIKE $1
                LIMIT 1
            `, [likeParam]);
            if (rlike.rows && rlike.rows.length) {
                console.log('numerosEmergenciaDbRepository: found by ILIKE partial match');
                return this.normalizeRow(rlike.rows[0]);
            }
        } catch (elike) {
            console.warn('numerosEmergenciaDbRepository: ilike query error', elike.message || elike);
        }

        // 4) Fallback: load all and try JS matching (covers nested structures)
        try {
            const all = await this.getAllAsync();
            for (const r of all) {
                if (!r) continue;
                const cand = (r.countrycode || r.ISOCode || r.iso || r.cca2 || r.code || r.pais || r.country || r.name);
                if (cand && String(cand).toUpperCase() === norm) return r;
                if (r.country && typeof r.country === 'object') {
                    const iso = r.country.ISOCode || r.country.iso || r.country.cca2 || r.country.code;
                    if (iso && String(iso).toUpperCase() === norm) return r;
                }
            }
        } catch (efallback) {
            console.warn('numerosEmergenciaDbRepository: fallback scan error', efallback.message || efallback);
        }

        console.log('numerosEmergenciaDbRepository: no match found for', norm);
        return null;
    }
}
