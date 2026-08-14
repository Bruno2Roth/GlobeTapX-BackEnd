import storageConfig from '../../configs/storageConfig.js';

/**
 * Repositorio de infraestructura para Supabase Storage.
 *
 * A diferencia de un repositorio PostgreSQL, aquí no se construye SQL: se
 * encapsulan las operaciones del proveedor externo y sus errores técnicos.
 */
export default class storageRepository {
    constructor(config = storageConfig) {
        console.log('storageRepository.constructor()');
        this.client = config.client;
        this.bucket = config.bucket;
        this.config = config;
    }

    getStatus() {
        return {
            configured: this.config.configured,
            bucket: this.bucket || null,
            supabaseUrl: this.config.supabaseUrl || null,
            public: this.config.isPublic,
            tlsVerification: this.config.rejectUnauthorized,
            missing: this.config.missing,
        };
    }

    ensureConfigured() {
        if (!this.config.configured || !this.client) {
            const missing = this.config.missing.length
                ? this.config.missing.join(', ')
                : 'cliente de Storage';
            throw new Error(`Supabase Storage no configurado. Faltan: ${missing}`);
        }
    }

    async uploadAsync(objectPath, buffer, options = {}) {
        this.ensureConfigured();

        const { error } = await this.client.storage
            .from(this.bucket)
            .upload(objectPath, buffer, options);

        if (error) {
            throw new Error(`No se pudo subir el archivo a Supabase Storage: ${error.message}`);
        }

        return objectPath;
    }

    async getUrlAsync(objectPath) {
        this.ensureConfigured();

        if (this.config.isPublic) {
            const { data } = this.client.storage
                .from(this.bucket)
                .getPublicUrl(objectPath);
            return data.publicUrl;
        }

        const { data, error } = await this.client.storage
            .from(this.bucket)
            .createSignedUrl(objectPath, 60 * 60);

        if (error) {
            throw new Error(`No se pudo generar la URL del archivo: ${error.message}`);
        }

        return data.signedUrl;
    }

    async deleteAsync(objectPath) {
        this.ensureConfigured();

        const { error } = await this.client.storage
            .from(this.bucket)
            .remove([objectPath]);

        if (error) {
            throw new Error(`No se pudo eliminar el archivo de Storage: ${error.message}`);
        }

        return true;
    }

    async listAsync(prefix = '') {
        this.ensureConfigured();

        const { data, error } = await this.client.storage
            .from(this.bucket)
            .list(prefix, { limit: 100, sortBy: { column: 'name', order: 'asc' } });

        if (error) {
            throw new Error(`No se pudo listar Storage: ${error.message}`);
        }

        return data || [];
    }

    async getBucketAsync() {
        this.ensureConfigured();

        const { data, error } = await this.client.storage.getBucket(this.bucket);
        if (error) {
            throw new Error(`No se pudo consultar el bucket: ${error.message}`);
        }

        return data;
    }
}
