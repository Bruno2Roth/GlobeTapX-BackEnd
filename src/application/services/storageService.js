import storageRepository from '../../data/repositories/storageRepository.js';
import storageFile from '../entities/storageFile.js';
import { BadRequestError } from '../../api/errors.js';

export const MAX_PROFILE_PHOTO_BYTES = 5 * 1024 * 1024;

export const MIME_EXTENSIONS = Object.freeze({
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/avif': 'avif',
});

export default class storageService {
    constructor(repository = new storageRepository()) {
        this.storageRepository = repository;
    }

    getStatus() {
        return this.storageRepository.getStatus();
    }

    async getBucketInfo() {
        return this.storageRepository.getBucketAsync();
    }

    validateUsuarioId(usuarioId) {
        const id = Number(usuarioId);
        if (!Number.isInteger(id) || id <= 0) {
            throw new BadRequestError('Solicitud no válida');
        }
        return id;
    }

    validatePhoto(file) {
        if (!file?.buffer || !file.mimetype || file.fieldname !== 'fotoPerfil') {
            throw new BadRequestError('Solicitud no válida');
        }

        if (!Object.prototype.hasOwnProperty.call(MIME_EXTENSIONS, file.mimetype)) {
            throw new BadRequestError('Formato de foto no válido');
        }

        const size = Number(file.size || file.buffer.length);
        if (size > MAX_PROFILE_PHOTO_BYTES) {
            throw new BadRequestError('La foto no puede superar los 5 MB');
        }
    }

    /**
     * El path es estable y permanente. Se persiste solo este valor en Usuario;
     * la URL firmada se calcula al leerlo.
     */
    async uploadProfilePhoto(usuarioId, file) {
        const id = this.validateUsuarioId(usuarioId);
        this.validatePhoto(file);

        const extension = MIME_EXTENSIONS[file.mimetype];
        const objectPath = `usuarios/${id}/foto.${extension}`;

        await this.storageRepository.uploadAsync(objectPath, file.buffer, {
            contentType: file.mimetype,
            cacheControl: '900',
            upsert: true,
        });

        return new storageFile({
            bucket: this.storageRepository.bucket,
            path: objectPath,
            url: null,
            originalName: file.originalname || null,
            mimeType: file.mimetype,
            size: file.size || file.buffer.length,
            usuarioId: id,
        });
    }

    async getPhotoUrl(storedPhoto) {
        if (!storedPhoto || /^data:/i.test(String(storedPhoto))) return null;

        // Compatibilidad con registros antiguos. Las nuevas escrituras nunca
        // almacenan URLs, solo paths como usuarios/123/foto.webp.
        if (/^https?:\/\//i.test(String(storedPhoto))) return storedPhoto;

        return this.storageRepository.getUrlAsync(storedPhoto);
    }

    async deletePhoto(storedPhoto) {
        if (!storedPhoto || /^data:/i.test(String(storedPhoto)) || /^https?:\/\//i.test(String(storedPhoto))) {
            return false;
        }

        await this.storageRepository.deleteAsync(storedPhoto);
        return true;
    }

    async listUserPhotos(usuarioId) {
        const id = this.validateUsuarioId(usuarioId);
        return this.storageRepository.listAsync(`usuarios/${id}`);
    }
}
