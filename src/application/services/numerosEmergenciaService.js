import axios from 'axios';
import https from 'https';

const DEFAULT_BASE = process.env.REMOTE_EM_API_URL || 'https://gleeful-halva-f173ab.netlify.app/emergency-numbers.json';
const TIMEOUT_MS = 5000;
const CACHE_TTL = 24 * 60 * 60 * 1000;

export default class NumerosEmergenciaService {
    constructor() {
        this.baseRemota = (process.env.URL_API_REMOTA || process.env.REMOTE_EM_API_URL || DEFAULT_BASE).replace(/\/$/, '');
        this.cliente = axios.create({
            baseURL: this.baseRemota,
            timeout: TIMEOUT_MS,
            httpsAgent: new https.Agent({ rejectUnauthorized: process.env.NODE_ENV === 'production' })
        });
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

    async _obtenerRemotoTodo() {
        // Si la base es un .json, descargarla. Si es API, probar endpoints simples y al final DEFAULT_BASE.
        if (this.baseRemota.endsWith('.json')) {
            const { data } = await axios.get(this.baseRemota, { timeout: TIMEOUT_MS, httpsAgent: new https.Agent({ rejectUnauthorized: process.env.NODE_ENV === 'production' }) });
            return this._extraerPaises(data);
        }

        try {
            const resp = await this.cliente.get('/countries').catch(() => this.cliente.get('/'));
            return this._extraerPaises(resp.data);
        } catch (e) {
            // último intento: DEFAULT_BASE
            try {
                const { data } = await axios.get(DEFAULT_BASE, { timeout: TIMEOUT_MS, httpsAgent: new https.Agent({ rejectUnauthorized: process.env.NODE_ENV === 'production' }) });
                return this._extraerPaises(data);
            } catch (e2) {
                throw new Error('No se pudo obtener lista remota de la API');
            }
        }
    }

    async getAll() {
        const clave = 'all';
        const cache = this._getCache(clave);
        if (cache) return cache;
        const remoto = await this._obtenerRemotoTodo();
        this._setCache(clave, remoto, CACHE_TTL);
        return remoto;
    }

    async getCountry(codigo) {
        if (!codigo) return null;
        const normalizado = String(codigo).toUpperCase();
        const clave = `country:${normalizado}`;
        const cache = this._getCache(clave);
        if (cache) return cache;

        let remotoIntentado = false;
        let remotoFallido = false;

        // Si la base es un JSON, buscar en la lista completa
        if (this.baseRemota.endsWith('.json')) {
            remotoIntentado = true;
            try {
                const lista = await this.getAll();
                const encontrado = this._buscarEnLista(lista, normalizado, codigo);
                this._setCache(clave, encontrado || null, CACHE_TTL);
                if (encontrado) return encontrado;
            } catch (e) { remotoFallido = true; }
        } else {
            // probar endpoints simples
            try {
                remotoIntentado = true;
                const r1 = await this.cliente.get(`/country/${normalizado}`).catch(() => null);
                if (r1 && r1.data) {
                    const maybe = Array.isArray(r1.data) ? r1.data[0] : r1.data;
                    if (this._coincidePais(maybe, normalizado, codigo)) { this._setCache(clave, maybe, CACHE_TTL); return maybe; }
                }
                const r2 = await this.cliente.get(`/${normalizado}`).catch(() => null);
                if (r2 && r2.data) {
                    const maybe = Array.isArray(r2.data) ? r2.data[0] : r2.data;
                    if (this._coincidePais(maybe, normalizado, codigo)) { this._setCache(clave, maybe, CACHE_TTL); return maybe; }
                }
            } catch (e) { remotoFallido = true; }

            // intentar descargar lista completa desde remoto
            try {
                remotoIntentado = true;
                const lista = await this._obtenerRemotoTodo();
                const encontrado = this._buscarEnLista(lista, normalizado, codigo);
                this._setCache(clave, encontrado || null, CACHE_TTL);
                if (encontrado) return encontrado;
            } catch (e) { remotoFallido = true; }
        }

        if (remotoIntentado && remotoFallido) {
            const err = new Error('No se pudo contactar la API remota de números de emergencia');
            err.code = 'REMOTE_UNAVAILABLE';
            throw err;
        }

        return null;
    }

    _extraerPaises(body) {
        if (!body) return [];
        if (Array.isArray(body)) return body;
        if (body.countries && Array.isArray(body.countries)) return body.countries;
        if (body.data && Array.isArray(body.data)) return body.data;
        // objeto con claves por código
        if (typeof body === 'object') {
            const vals = Object.values(body).filter(v => v && (v.Country || v.country || v.ISOCode || v.cca2));
            if (vals.length) return vals;
        }
        return [];
    }

    _coincidePais(entry, normalizado, original) {
        if (!entry) return false;
        const e = entry.Country || entry;
        const iso = (e.ISOCode || e.iso || e.cca2 || e.code || e.alpha2 || e.iso2 || e.id || '').toString().toUpperCase();
        const isn = (e.ISONumeric || e.isNumeric || e.numeric || e.numericCode || '').toString();
        const nombre = (e.name && (e.name.common || e.name)) || e.country || e.pais || '';
        if (iso && iso === normalizado) return true;
        if (isn && isn === String(original)) return true;
        if (nombre && nombre.toString().toUpperCase() === normalizado) return true;
        return false;
    }

    _buscarEnLista(list, normalizado, original) {
        if (!Array.isArray(list)) return null;
        for (const c of list) {
            if (this._coincidePais(c, normalizado, original)) return c;
        }
        return null;
    }
}

