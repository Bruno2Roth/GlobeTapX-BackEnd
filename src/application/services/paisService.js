import paisRepository from '../../data/repositories/paisRepository.js';
import { getUtcOffset } from '../../helpers/timezoneMap.js';
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
        this.cachedCountries = [];
        this.cacheExpiresAt = 0;
        this.cacheSource = 'empty';
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

    async _ensureFreshCache() {
        if (this.cachedCountries.length === 0 || this.cacheExpiresAt <= Date.now()) {
            await this._refreshCache();
        }
    }

    getCacheStatus() {
        return {
            source: this.cacheSource,
            expiresAt: this.cacheExpiresAt,
            count: this.cachedCountries.length,
        };
    }

    getAllAsync = async () => {
        await this._ensureFreshCache();
        return this._cloneCountries();
    };

    getByIdAsync = async (id) => {
        await this._ensureFreshCache();
        const numericId = Number(id);
        const country = this.cachedCountries.find(item => Number(item.ID ?? item.id) === numericId);
        return this._attachLocalTime(country || null);
    };

    getByNameAsync = async (name) => {
        await this._ensureFreshCache();
        const query = String(name || '').trim().toLocaleLowerCase();
        const country = this.cachedCountries.find(item => String(item.nombre || '').toLocaleLowerCase().includes(query));
        return this._attachLocalTime(country || null);
    };
}
