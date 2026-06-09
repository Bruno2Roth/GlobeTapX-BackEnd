// Servicio unificado `numerosEmergenciaService`
// - Intenta obtener datos desde una URL remota JSON (por defecto la provista por el usuario).
// - Si la remota falla o no tiene datos, usa una copia local `src/data/emergencyNumbers.json`.
// - Provee `getAll()` y `getCountry(code)` con cache en memoria.
import axios from 'axios';
import https from 'https';
import { promises as fs } from 'fs';
import path from 'path';

// URL por defecto (archivo JSON público). Se puede sobreescribir con `REMOTE_EM_API_URL`.
const DEFAULT_BASE = process.env.REMOTE_EM_API_URL || 'https://gleeful-halva-f173ab.netlify.app/emergency-numbers.json';
const TIMEOUT_MS = 5000;

export default class numerosEmergenciaService {
    constructor() {
        // base: puede ser una URL que termine en .json (archivo único) o una API base
        // Permitir variable en español `URL_API_REMOTA` o la existente `REMOTE_EM_API_URL`
        this.baseRemota = (process.env.URL_API_REMOTA || process.env.REMOTE_EM_API_URL || DEFAULT_BASE).replace(/\/$/, '');
        this.cliente = axios.create({
            baseURL: this.baseRemota,
            timeout: TIMEOUT_MS,
            httpsAgent: new https.Agent({ rejectUnauthorized: process.env.NODE_ENV === 'production' })
        });
        this.cache = new Map(); // key -> { value, expires }
        this._datosLocales = null; // caché local de fallback
    }

    // Devuelve valor cacheado o null
    _getCached(key) {
        const entry = this.cache.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expires) {
            this.cache.delete(key);
            return null;
        }
        return entry.value;
    }

    // Guarda en cache con TTL (ms)
    _setCached(key, value, ttlMs) {
        this.cache.set(key, { value, expires: Date.now() + ttlMs });
    }

    // Carga archivo local de fallback cuando la remota falla
    async _loadLocal() {
        if (this._datosLocales) return this._datosLocales;
        const candidates = [
            path.resolve(process.cwd(), 'src', 'data', 'emergencyNumbers.json'),
            path.resolve(process.cwd(), 'data', 'emergencyNumbers.json')
        ];
        for (const p of candidates) {
            try {
                const raw = await fs.readFile(p, 'utf8');
                const parsed = JSON.parse(raw);
                // el archivo puede tener { countries: [...] } o ser directamente un array
                this._datosLocales = parsed.countries || parsed || [];
                return this._datosLocales;
            } catch (e) {
                // si falla, probar la siguiente ruta candidata
            }
        }
        this._datosLocales = [];
        return this._datosLocales;
    }

    // Obtiene todos los países desde la remota o (si la URL es un .json) descarga el archivo
    async _fetchRemoteAll() {
        const tryPaths = [];
        if (this.baseRemota.endsWith('.json')) {
            // base es un .json estático
            tryPaths.push(this.baseRemota);
        } else {
            // posibles endpoints comunes para listar todos
            tryPaths.push('/data/all', '/data', '/countries', '/countries/all', '/all', '/');
        }

        for (const p of tryPaths) {
            try {
                const url = p.startsWith('http') ? p : p;
                const resp = p.startsWith('http') ? await axios.get(url, { timeout: TIMEOUT_MS, httpsAgent: new https.Agent({ rejectUnauthorized: process.env.NODE_ENV === 'production' }) }) : await this.cliente.get(p);
                const d = resp && resp.data ? resp.data : resp;
                const candidates = this._extractCountries(d);
                if (Array.isArray(candidates) && candidates.length) return candidates;
                // if resp is object with countries key
                if (d && d.countries && Array.isArray(d.countries) && d.countries.length) return d.countries;
            } catch (e) {
                console.warn(`numerosEmergenciaService._fetchRemoteAll: ${p} failed:`, e.message || e);
                // probar siguiente ruta
            }
        }
        // último intento: cargar DEFAULT_BASE directamente si no es el que ya intentamos
        if (this.baseRemota !== DEFAULT_BASE) {
            try {
                console.warn('numerosEmergenciaService._fetchRemoteAll: intentando DEFAULT_BASE como último recurso');
                const resp = await axios.get(DEFAULT_BASE, { timeout: TIMEOUT_MS, httpsAgent: new https.Agent({ rejectUnauthorized: process.env.NODE_ENV === 'production' }) });
                const d = resp && resp.data ? resp.data : resp;
                const candidates = this._extractCountries(d);
                if (Array.isArray(candidates) && candidates.length) return candidates;
                if (d && d.countries && Array.isArray(d.countries) && d.countries.length) return d.countries;
            } catch (e2) {
                console.warn('numerosEmergenciaService._fetchRemoteAll: DEFAULT_BASE también falló:', e2.message || e2);
            }
        }
        throw new Error('No se pudo obtener lista remota de la API');
    }

    // Devuelve todos los registros (cacha por 7 días)
    async getAll() {
        const key = 'all';
        const cached = this._getCached(key);
        if (cached) return cached;
        try {
            const remote = await this._fetchRemoteAll();
            if (remote && remote.length) {
                this._setCached(key, remote, 7 * 24 * 3600 * 1000);
                return remote;
            }
        } catch (e) {
            // ignorar errores remotos y usar fallback local
        }
        const local = await this._loadLocal();
        this._setCached(key, local, 7 * 24 * 3600 * 1000);
        return local;
    }

    // Busca un país por código ISO alpha-2 o por código numérico
    async getCountry(code) {
        if (!code) return null;
        const normalized = String(code).toUpperCase();
        const key = `country:${normalized}`;
        const cached = this._getCached(key);
        if (cached) return cached;

        // Intentar primero un endpoint específico del remoto (si la base es una API)
        const tryPaths = [];
        if (this.baseRemota.endsWith('.json')) {
            // si la base es un .json estático no intentar paths individuales
        } else {
            tryPaths.push(`/country/${normalized}`);
            tryPaths.push(`/data/${normalized}`);
            tryPaths.push(`/${normalized}`);
            tryPaths.push(`/country?code=${normalized}`);
            tryPaths.push(`/country?country=${normalized}`);
            tryPaths.push(`/data?code=${normalized}`);
        }

        let remoteIntentado = false;
        let remoteFallido = false;

        for (const p of tryPaths) {
            try {
                remoteIntentado = true;
                const resp = await this.cliente.get(p);
                const body = resp && resp.data ? resp.data : resp;
                const candidates = this._extractCountries(body);
                const found = this._findMatchingCountry(candidates, normalized, code);
                if (found) {
                    this._setCached(key, found, 24 * 3600 * 1000);
                    return found;
                }
                if (body && typeof body === 'object') {
                    const maybe = body.Country || body.country || body;
                    if (this._isMatchingCountry(maybe, normalized, code)) {
                        this._setCached(key, maybe, 24 * 3600 * 1000);
                        return maybe;
                    }
                }
            } catch (e) {
                remoteIntentado = true;
                remoteFallido = true;
                console.warn(`numerosEmergenciaService.getCountry: tryPath ${p} failed:`, e.message || e);
            }
        }

        // Si no respondio el endpoint directo, intentar descargar /data/all (o el .json)
        try {
            remoteIntentado = true;
            const all = await this._fetchRemoteAll();
            const found = this._findMatchingCountry(all, normalized, code);
            this._setCached(key, found || null, 24 * 3600 * 1000);
            if (found) return found;
            } catch (e) {
            remoteFallido = true;
            console.warn('numerosEmergenciaService.getCountry: _fetchRemoteAll failed:', e.message || e);
            // si falla, caer al local
        }

        // Fallback local explícito
        const local = await this._loadLocal();
        const found = this._findMatchingCountry(local, normalized, code);
        this._setCached(key, found || null, 24 * 3600 * 1000);
        if (found) return found;

        // Si la API remota fue intentada y falló, lanzar error para que el controlador devuelva 502
        if (typeof remoteIntentado !== 'undefined' && remoteIntentado && remoteFallido) {
            const err = new Error('No se pudo contactar la API remota de números de emergencia');
            err.code = 'REMOTE_UNAVAILABLE';
            throw err;
        }

        // No se encontró el país en remoto ni en local
        return null;
    }

    // Extrae un array de entradas tipo país desde diferentes formas de respuesta remota
    _extractCountries(body) {
        if (!body) return [];
        if (Array.isArray(body)) return body;
        if (body.countries && Array.isArray(body.countries)) return body.countries;
        if (body.data && Array.isArray(body.data)) return body.data;
        if (body.data && body.data.countries && Array.isArray(body.data.countries)) return body.data.countries;
        if (body.Country || body.country) return [body.Country || body.country];
        // Si es un objeto con claves por código, devolver sus valores filtrados
        if (typeof body === 'object') {
            const vals = Object.values(body).filter(v => v && (v.Country || v.country || v.ISOCode || v.ISONumeric));
            if (vals.length) return vals;
        }
        return [];
    }

    _isMatchingCountry(entry, normalized, originalCode) {
        if (!entry) return false;
        const c = entry.Country || entry;
        const iso = c.ISOCode || c.iso || c.cca2 || c.code || c.alpha2 || c.alpha_2 || c.iso2 || c.ISO || c.id;
        const isn = c.ISONumeric || c.isNumeric || c.numeric || c.ISO_Number || c.numericCode;
        const name = (c.name && (c.name.common || c.name)) || c.countryName || c.CountryName || c.pais || c.Pais || c.country;
        if (iso && String(iso).toUpperCase() === normalized) return true;
        if (isn && String(isn) === String(originalCode)) return true;
        if (name && String(name).toUpperCase() === normalized) return true;
        return false;
    }

    _findMatchingCountry(list, normalized, originalCode) {
        if (!Array.isArray(list)) return null;
        for (const c of list) {
            if (this._isMatchingCountry(c, normalized, originalCode)) return c;
            // c puede tener estructura plana
            if (c.ISOCode && String(c.ISOCode).toUpperCase() === normalized) return c;
            if (c.ISONumeric && String(c.ISONumeric) === String(originalCode)) return c;
            if (c.Country && c.Country.ISOCode && String(c.Country.ISOCode).toUpperCase() === normalized) return c;
        }
        return null;
    }
}

