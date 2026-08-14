import { randomUUID } from 'node:crypto';
import storageRepository from '../../data/repositories/storageRepository.js';
import storageFile from '../entities/storageFile.js';

const MAX_PROFILE_PHOTO_BYTES = 5 * 1024 * 1024;

const MIME_EXTENSIONS = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/avif': 'avif',
};

/**
 * Servicio de aplicación para archivos de Storage.
 *
 * Aquí viven las reglas del negocio: formatos permitidos, tamaño máximo,
 * nombres de objetos y compatibilidad con fotos antiguas. La comunicación
 * con Supabase queda encapsulada en storageRepository.
 */
export default class storageService {
    constructor(repository = new storageRepository()) {
        console.log('storageService.constructor()');
        this.storageRepository = repository;
    }

    /** Devuelve un estado seguro para diagnósticos, sin revelar secretos. */
    getStatus() {
        return this.storageRepository.getStatus();
    }

    /** Consulta el bucket para health checks sin exponer la clave privada. */
    async getBucketInfo() {
        return this.storageRepository.getBucketAsync();
    }

    validateUsuarioId(usuarioId) {
        const id = Number(usuarioId);
        if (!Number.isInteger(id) || id <= 0) {
            throw new Error('ID de usuario inválido');
        }
        return id;
    }

    validatePhoto(file) {
        if (!file?.buffer || !file.mimetype) {
            throw new Error('Debe enviarse una imagen en el campo fotoPerfil');
        }

        if (!MIME_EXTENSIONS[file.mimetype]) {
            throw new Error('Formato de foto no válido. Use JPG, PNG, WEBP, GIF o AVIF');
        }

        if (file.size > MAX_PROFILE_PHOTO_BYTES) {
            throw new Error('La foto no puede superar los 5 MB');
        }
    }

    /**
     * Sube una foto de perfil y devuelve la metadata que se guarda en Usuario.
     * La base de datos guarda el path; la URL se genera dinámicamente porque
     * el bucket es privado y las URLs firmadas expiran.
     */
    async uploadProfilePhoto(usuarioId, file) {
        const id = this.validateUsuarioId(usuarioId);
        this.validatePhoto(file);

        const extension = MIME_EXTENSIONS[file.mimetype];
        const objectPath = `profiles/${id}/${randomUUID()}.${extension}`;

        await this.storageRepository.uploadAsync(objectPath, file.buffer, {
            contentType: file.mimetype,
            cacheControl: '3600',
            upsert: false,
        });

        const url = await this.getPhotoUrl(objectPath);

        return new storageFile({
            bucket: this.storageRepository.bucket,
            path: objectPath,
            url,
            originalName: file.originalname || null,
            mimeType: file.mimetype,
            size: file.size || file.buffer.length,
            usuarioId: id,
        });
    }

    /**
     * Resuelve una foto guardada como path, URL completa o data URL antigua.
     */
    async getPhotoUrl(storedPhoto) {
        if (!storedPhoto) return null;

        if (/^data:/i.test(String(storedPhoto)) || /^https?:\/\//i.test(String(storedPhoto))) {
            return storedPhoto;
        }

        return this.storageRepository.getUrlAsync(storedPhoto);
    }

    /** Elimina un objeto del bucket; las data URLs antiguas no son objetos. */
    async deletePhoto(storedPhoto) {
        if (!storedPhoto || /^data:/i.test(String(storedPhoto)) || /^https?:\/\//i.test(String(storedPhoto))) {
            return false;
        }

        await this.storageRepository.deleteAsync(storedPhoto);
        return true;
    }

    /** Lista objetos de un usuario, útil para limpieza y diagnóstico. */
    async listUserPhotos(usuarioId) {
        const id = this.validateUsuarioId(usuarioId);
        return this.storageRepository.listAsync(`profiles/${id}`);
    }
}
