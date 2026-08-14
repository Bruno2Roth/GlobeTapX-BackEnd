import storageConfig from '../../configs/storageConfig.js';
import { ServiceUnavailableError } from '../../api/errors.js';

/** Infraestructura de Supabase Storage. Nunca devuelve errores del proveedor. */
export default class storageRepository {
    constructor(config = storageConfig) {
        this.client = config.client;
        this.bucket = config.bucket;
        this.config = config;
        this.timeoutMs = config.timeoutMs || 8000;
        this.signedUrlCache = new Map();
    }

    getStatus() {
        return {
            configured: Boolean(this.config.configured && this.client && this.bucket),
            bucket: this.bucket || null,
            public: Boolean(this.config.isPublic),
            tlsVerification: Boolean(this.config.rejectUnauthorized),
            timeoutMs: this.timeoutMs,
            signedUrlTtlSeconds: this.config.signedUrlTtlSeconds || 900,
        };
    }

    ensureConfigured() {
        if (!this.config.configured || !this.client || !this.bucket) {
            throw new ServiceUnavailableError('Servicio temporalmente no disponible', {
                code: 'STORAGE_UNAVAILABLE',
                internalMessage: 'Supabase Storage no está configurado',
            });
        }
    }

    async runWithTimeout(operation, operationName) {
        this.ensureConfigured();

        let timer;
        const timeout = new Promise((_, reject) => {
            timer = setTimeout(() => reject(Object.assign(
                new Error(`${operationName} timed out`),
                { code: 'ETIMEDOUT' },
            )), this.timeoutMs);
        });

        try {
            return await Promise.race([operation(), timeout]);
        } catch (error) {
            if (error instanceof ServiceUnavailableError) throw error;

            throw new ServiceUnavailableError('Servicio temporalmente no disponible', {
                code: 'STORAGE_UNAVAILABLE',
                internalMessage: `${operationName}: ${error?.message || 'storage error'}`,
                cause: error,
            });
        } finally {
            clearTimeout(timer);
        }
    }

    async uploadAsync(objectPath, buffer, options = {}) {
        return this.runWithTimeout(async () => {
            const { error } = await this.client.storage
                .from(this.bucket)
                .upload(objectPath, buffer, options);

            if (error) {
                throw new Error(error.message || 'upload failed');
            }

            this.signedUrlCache.delete(objectPath);
            return objectPath;
        }, 'storage upload');
    }

    async getUrlAsync(objectPath) {
        this.ensureConfigured();

        if (this.config.isPublic) {
            const { data } = this.client.storage
                .from(this.bucket)
                .getPublicUrl(objectPath);
            return data?.publicUrl || null;
        }

        const cached = this.signedUrlCache.get(objectPath);
        if (cached && cached.expiresAt > Date.now()) return cached.url;

        const signedUrl = await this.runWithTimeout(async () => {
            const { data, error } = await this.client.storage
                .from(this.bucket)
                .createSignedUrl(objectPath, this.config.signedUrlTtlSeconds || 900);

            if (error || !data?.signedUrl) {
                throw new Error(error?.message || 'signed URL could not be generated');
            }

            return data.signedUrl;
        }, 'storage signed URL');

        const ttlMs = (this.config.signedUrlTtlSeconds || 900) * 1000;
        this.signedUrlCache.set(objectPath, {
            url: signedUrl,
            expiresAt: Date.now() + Math.max(1000, ttlMs - 30_000),
        });
        return signedUrl;
    }

    async deleteAsync(objectPath) {
        return this.runWithTimeout(async () => {
            const { error } = await this.client.storage
                .from(this.bucket)
                .remove([objectPath]);

            if (error) throw new Error(error.message || 'delete failed');
            this.signedUrlCache.delete(objectPath);
            return true;
        }, 'storage delete');
    }

    async listAsync(prefix = '') {
        return this.runWithTimeout(async () => {
            const { data, error } = await this.client.storage
                .from(this.bucket)
                .list(prefix, { limit: 100, sortBy: { column: 'name', order: 'asc' } });

            if (error) throw new Error(error.message || 'list failed');
            return data || [];
        }, 'storage list');
    }

    async getBucketAsync() {
        return this.runWithTimeout(async () => {
            const { data, error } = await this.client.storage.getBucket(this.bucket);
            if (error) throw new Error(error.message || 'bucket lookup failed');
            return data;
        }, 'storage bucket lookup');
    }
}
