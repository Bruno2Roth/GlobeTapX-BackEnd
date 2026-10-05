import usuariosRepository from '../../data/repositories/usuariosRepository.js';
import paisRepository from '../../data/repositories/paisRepository.js';
import storageService from './storageService.js';
import { BadRequestError } from '../../api/errors.js';

export default class usuarioProfileService {
    constructor({
        repository = new usuariosRepository(),
        countries = new paisRepository(),
        storage = new storageService(),
    } = {}) {
        this.usuariosRepository = repository;
        this.paisRepository = countries;
        this.storageService = storage;
    }

    updateFotoPerfilAsync = async (usuarioId, file) => {
        const id = Number(usuarioId);
        if (!Number.isInteger(id) || id <= 0) throw new BadRequestError('Solicitud no válida');

        const usuario = await this.usuariosRepository.getByIdAsync(id);
        if (!usuario) throw new Error('Usuario no encontrado');

        const uploaded = await this.storageService.uploadProfilePhoto(id, file);
        let rowsAffected;
        try {
            rowsAffected = await this.usuariosRepository.updateFotoPerfilAsync(id, uploaded.path);
        } catch (error) {
            await this.storageService.deletePhoto(uploaded.path).catch(() => {});
            throw error;
        }

        if (rowsAffected < 1) {
            await this.storageService.deletePhoto(uploaded.path).catch(() => {});
            throw new Error('Usuario no encontrado');
        }

        const previousPhoto = usuario.fotoPerfil;
        if (previousPhoto && previousPhoto !== uploaded.path) {
            void this.storageService.deletePhoto(previousPhoto).catch(error => {
                console.warn('[profile-photo-old-file-cleanup]', error?.message || 'cleanup error');
            });
        }

        return {
            success: true,
            fotoPerfil: await this.storageService.getPhotoUrl(uploaded.path),
            fotoPath: uploaded.path,
        };
    };

    getFotoPerfilUrlAsync = (storedPhoto) => this.storageService.getPhotoUrl(storedPhoto);

    getFotoPerfilAsync = async (usuarioId) => {
        const id = Number(usuarioId);
        if (!Number.isInteger(id) || id <= 0) throw new BadRequestError('Solicitud no válida');

        const record = await this.usuariosRepository.getProfilePhotoByIdAsync(id);
        const fotoPath = record?.fotoPath && !/^data:/i.test(String(record.fotoPath))
            ? record.fotoPath
            : null;
        const fotoPerfil = fotoPath ? await this.getFotoPerfilUrlAsync(fotoPath) : null;
        return { fotoPerfil, fotoPath };
    };

    deleteFotoPerfilAsync = async (usuarioId) => {
        const id = Number(usuarioId);
        if (!Number.isInteger(id) || id <= 0) throw new BadRequestError('Solicitud no válida');

        const usuario = await this.usuariosRepository.getByIdAsync(id);
        if (!usuario) throw new Error('Usuario no encontrado');

        const previousPhoto = usuario.fotoPerfil || null;
        const rowsAffected = await this.usuariosRepository.updateFotoPerfilAsync(id, null);

        if (previousPhoto) {
            try {
                await this.storageService.deletePhoto(previousPhoto);
            } catch (error) {
                console.error('[profile-photo-cleanup]', error?.message || 'cleanup error');
            }
        }

        return { success: rowsAffected > 0, usuarioId: id };
    };

    listFotosPerfilAsync = (usuarioId) => this.storageService.listUserPhotos(usuarioId);

    updatePaisActualAsync = async (usuarioId, paisactual) => {
        const id = Number(usuarioId);
        const paisId = Number(paisactual);
        if (!Number.isInteger(id) || id <= 0 || !Number.isInteger(paisId) || paisId < 1) {
            throw new BadRequestError('Solicitud no válida');
        }

        const usuario = await this.usuariosRepository.getByIdAsync(id);
        if (!usuario) throw new Error('Usuario no encontrado');

        const paisValido = await this.paisRepository.getByIdAsync(paisId);
        if (!paisValido) throw new BadRequestError('Solicitud no válida');

        const rowsAffected = await this.usuariosRepository.updatePaisActualAsync(id, paisId);
        return { success: rowsAffected > 0, usuarioId: id, paisactual: paisId };
    };
}
