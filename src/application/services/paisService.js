import paisRepository from '../../data/repositories/paisRepository.js';
import { getUtcOffset } from '../../helpers/timezoneMap.js';
import PAISES_BACKUP from '../../data/static/paisesBackup.js';
import { withTimeout } from '../../shared/withTimeout.js';

const positiveInteger = (value, fallback) => {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

export default class paisService {
    constructor(repository = new paisRepository()) {
        this.paisRepository = repository;
        this.cacheTtlMs = positiveInteger(process.env.COUNTRIES_CACHE_TTL_MS, 10 * 60 * 1000);
        this.databaseTimeoutMs = positiveInteger(process.env.COUNTRIES_DB_TIMEOUT_MS, 750);
        this.cachedCountries = PAISES_BACKUP.map(country => ({ ...country }));
        this.cacheExpiresAt = 0;
        this.cacheSource = 'backup';
        this.refreshInFlight = null;
    }

    _attachLocalTime(entity) {
        if (!entity) return null;
        const offset = getUtcOffset(entity.codigo);
        return {
            ...entity,
            utc_offset_seconds: offset,
            local_time: new Date(Date.now() + offset * 1000)
                .toISOString()
                .replace('Z', ''),
        };
    }

    _cloneCountries() {
        return this.cachedCountries.map(country => this._attachLocalTime(country));
    }

    async _refreshCache() {
        if (this.refreshInFlight) return this.refreshInFlight;

        this.refreshInFlight = withTimeout(
            () => this.paisRepository.getAllAsync(),
            this.databaseTimeoutMs,
        )
            .then(rows => {
                if (Array.isArray(rows)) {
                    this.cachedCountries = rows.map(row => ({ ...row }));
                    this.cacheExpiresAt = Date.now() + this.cacheTtlMs;
                    this.cacheSource = 'database';
                }
            })
            .catch(error => {
                // El request ya tiene una respuesta de memoria/backup; solo se
                // registra la causa internamente para observabilidad.
                console.warn('[countries-cache-refresh]', {
                    code: error?.code || null,
                    message: error?.message || 'database unavailable',
                });
            })
            .finally(() => {
                this.refreshInFlight = null;
            });

        return this.refreshInFlight;
    }

    _refreshInBackground() {
        void this._refreshCache();
    }

    getCacheStatus() {
        return {
            source: this.cacheSource,
            expiresAt: this.cacheExpiresAt,
            count: this.cachedCountries.length,
        };
    }

    getAllAsync = async () => {
        if (this.cacheExpiresAt <= Date.now()) this._refreshInBackground();
        return this._cloneCountries();
    };

    getByIdAsync = async (id) => {
        if (this.cacheExpiresAt <= Date.now()) this._refreshInBackground();
        const numericId = Number(id);
        const country = this.cachedCountries.find(item => Number(item.ID ?? item.id) === numericId);
        return this._attachLocalTime(country || null);
    };

    getByNameAsync = async (name) => {
        if (this.cacheExpiresAt <= Date.now()) this._refreshInBackground();
        const query = String(name || '').trim().toLocaleLowerCase();
        const country = this.cachedCountries.find(item => String(item.nombre || '').toLocaleLowerCase().includes(query));
        return this._attachLocalTime(country || null);
    };
}
