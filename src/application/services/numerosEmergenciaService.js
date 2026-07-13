import numerosEmergenciaDbRepository from '../../data/repositories/numerosEmergenciaDbRepository.js';

const CACHE_TTL = 24 * 60 * 60 * 1000;

export default class NumerosEmergenciaService {
    constructor() {
        this.repo = new numerosEmergenciaDbRepository();
        this.baseRemota = 'db';
        this.cache = new Map();
    }

    _getCache(clave) {
        const e = this.cache.get(clave);
        if (!e) return null;
        if (Date.now() > e.expira) { this.cache.delete(clave); return null; }
        return e.valor;
    }

    _setCache(clave, valor, ttlMs) {
        this.cache.set(clave, { valor, expira: Date.now() + ttlMs });
    }

    async getAll() {
        const clave = 'all';
        const cache = this._getCache(clave);
        if (cache) return cache;
        const rows = await this.repo.getAllAsync();
        this._setCache(clave, rows, CACHE_TTL);
        return rows;
    }

    async getCountry(codigo) {
        if (!codigo) return null;
        const normalizado = String(codigo).toUpperCase();
        const clave = `country:${normalizado}`;
        const cache = this._getCache(clave);
        if (cache) return cache;

        const found = await this.repo.getByCodeAsync(normalizado);
        this._setCache(clave, found || null, CACHE_TTL);
        return found;
    }
}

