// Servicio unificado `numerosEmergenciaService`
// - Intenta obtener datos desde una URL remota JSON (por defecto la provista por el usuario).
// - Si la remota falla o no tiene datos, usa una copia local `src/data/emergencyNumbers.json`.
// - Provee `getAll()` y `getCountry(code)` con cache en memoria.
import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';

// URL por defecto (archivo JSON público). Se puede sobreescribir con `REMOTE_EM_API_URL`.
const DEFAULT_BASE = process.env.REMOTE_EM_API_URL || 'https://gleeful-halva-f173ab.netlify.app/emergency-numbers.json';
const TIMEOUT_MS = 5000;

export default class numerosEmergenciaService {
    constructor() {
        // base: puede ser una URL que termine en .json (archivo único) o una API base
        this.base = DEFAULT_BASE.replace(/\/$/, '');
        this.client = axios.create({ baseURL: this.base, timeout: TIMEOUT_MS });
        this.cache = new Map(); // key -> { value, expires }
        this._localData = null; // caché local de fallback
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
        if (this._localData) return this._localData;
        const candidates = [
            path.resolve(process.cwd(), 'src', 'data', 'emergencyNumbers.json'),
            path.resolve(process.cwd(), 'data', 'emergencyNumbers.json')
        ];
        for (const p of candidates) {
            try {
                const raw = await fs.readFile(p, 'utf8');
                const parsed = JSON.parse(raw);
                // el archivo puede tener { countries: [...] } o ser directamente un array
                this._localData = parsed.countries || parsed || [];
                return this._localData;
            } catch (e) {
                // si falla, probar la siguiente ruta candidata
            }
        }
        this._localData = [];
        return this._localData;
    }

    // Obtiene todos los países desde la remota o (si la URL es un .json) descarga el archivo
    async _fetchRemoteAll() {
        if (this.base.endsWith('.json')) {
            const resp = await axios.get(this.base, { timeout: TIMEOUT_MS });
            const d = resp.data;
            return d && d.countries ? d.countries : Array.isArray(d) ? d : [];
        }
        // si la base no es un archivo .json, intentamos el endpoint /data/all
        const data = await this.client.get('/data/all');
        return data && data.data && data.data.countries ? data.data.countries : (data && data.data) || [];
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

        // Primero intentar buscar en la lista remota (si se pudo descargar)
        try {
            const all = await this.getAll();
            const found = all.find(c => c.Country && (String(c.Country.ISOCode).toUpperCase() === normalized || String(c.Country.ISONumeric) === String(code)));
            this._setCached(key, found || null, 24 * 3600 * 1000);
            return found || null;
        } catch (e) {
            // si falla, caer al local
        }

        // Fallback local explícito
        const local = await this._loadLocal();
        const found = local.find(c => c.Country && (String(c.Country.ISOCode).toUpperCase() === normalized || String(c.Country.ISONumeric) === String(code)));
        this._setCached(key, found || null, 24 * 3600 * 1000);
        return found || null;
    }
}

