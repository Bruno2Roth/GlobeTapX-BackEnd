import usuariosRepository from '../../data/repositories/usuariosRepository.js';
import agendaUsuarioRepository from '../../data/repositories/agendaUsuarioRepository.js';
import estadisticasRepository from '../../data/repositories/estadisticasRepository.js';
import registroEstadisticasRepository from '../../data/repositories/registroEstadisticasRepository.js';
import contenidoCategoriaRepository from '../../data/repositories/contenidoCategoriaRepository.js';
import paisRepository from '../../data/repositories/paisRepository.js';
import zLogCambiosService from './zLogCambiosService.js';
import mymemoryTranslationHelper from '../../helpers/mymemoryTranslationHelper.js';
import storageService from './storageService.js';
import { BadRequestError } from '../../api/errors.js';
import { isSupportedLanguageCode, normalizeLanguageCode } from '../dtos/userProfile.js';

export default class usuariosService {
    constructor() {
        this.usuariosRepository = new usuariosRepository();
        this.agendaUsuarioRepository = new agendaUsuarioRepository();
        this.estadisticasRepository = new estadisticasRepository();
        this.registroEstadisticasRepository = new registroEstadisticasRepository();
        this.paisRepository = new paisRepository();
        this.contenidoCategoriaRepository = new contenidoCategoriaRepository();
        this.logService = new zLogCambiosService();
        this.translator = new mymemoryTranslationHelper();
        this.storageService = new storageService();
    }

    createValidationError(message) {
        const error = new Error(message);
        error.name = 'ValidationError';
        return error;
    }

    createDuplicateError(message) {
        const error = new Error(message);
        error.name = 'DuplicateError';
        error.code = 'UsuarioDuplicado';
        return error;
    }

    validateUsuarioEntity(entity, requireId = false) {
        if (!entity || typeof entity !== 'object') {
            throw this.createValidationError('Los datos del usuario son necesarios');
        }

        if (requireId && !entity.ID && !entity.id) {
            throw this.createValidationError('El ID del usuario es obligatorio');
        }

        if (!entity.nombre && entity.nombreCompleto) entity.nombre = entity.nombreCompleto;
        if (!entity.nombre || !String(entity.nombre).trim()) {
            throw this.createValidationError('El nombre del usuario es obligatorio');
        }
        if (!entity.mail || !String(entity.mail).trim()) {
            throw this.createValidationError('El mail del usuario es obligatorio');
        }

        const mailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
        if (!mailRegex.test(String(entity.mail).trim())) {
            throw this.createValidationError('El mail del usuario no es válido');
        }

        if (!entity.nombreCompleto || !String(entity.nombreCompleto).trim()) {
            entity.nombreCompleto = String(entity.nombre).trim();
        }

        if (!requireId && (!entity.contrasena || !String(entity.contrasena).trim())) {
            throw this.createValidationError('La contraseña del usuario es obligatoria');
        }
    }

    getAllAsync = async () => this.usuariosRepository.getAllAsync();
    getByIdAsync = async (id) => this.usuariosRepository.getByIdAsync(id);
    getProfileByIdAsync = async (id) => this.usuariosRepository.getProfileByIdAsync(id);
    getProfilePhotoByIdAsync = async (id) => this.usuariosRepository.getProfilePhotoByIdAsync(id);
    getBymailAsync = async (mail) => this.usuariosRepository.getBymailAsync(mail);
    getByNombreAsync = async (nombre) => this.usuariosRepository.getByNombreAsync(nombre);

    createAsync = async (entity) => {
        this.validateUsuarioEntity(entity);

        const existingUser = await this.usuariosRepository.getBymailAsync(entity.mail);
        if (existingUser) throw this.createDuplicateError('Ya existe un usuario con ese mail');

        const result = await this.usuariosRepository.createAsync(entity);
        const newId = result?.ID || result;

        try {
            await this.logService.createAsync({
                IDUsuario: newId,
                accion: 'CREATE',
                tipoEntidad: 'Usuario',
                IDEntidad: newId,
                diferencia: JSON.stringify({ nombre: entity.nombre, mail: entity.mail }),
            });
        } catch (error) {
            console.error('[user-create-log]', error?.message || 'log error');
        }

        return result;
    };

    updateAsync = async (entity) => {
        const userId = entity?.ID || entity?.id;
        if (!userId) throw this.createValidationError('El ID del usuario es obligatorio');

        const currentUser = await this.usuariosRepository.getByIdAsync(userId);
        if (!currentUser) throw new Error('Usuario no encontrado');

        entity.ID = userId;
        entity.mail ||= currentUser.mail || currentUser.email;
        entity.nombre ||= currentUser.nombre || currentUser.name;
        this.validateUsuarioEntity(entity, true);

        const existingUser = await this.usuariosRepository.getBymailAsync(entity.mail);
        if (existingUser && Number(existingUser.ID) !== Number(userId)) {
            throw this.createDuplicateError('Ya existe otro usuario con ese mail');
        }

        const rowsAffected = await this.usuariosRepository.updateAsync(entity);

        try {
            await this.logService.createAsync({
                IDUsuario: entity.ID,
                accion: 'UPDATE',
                tipoEntidad: 'Usuario',
                IDEntidad: entity.ID,
                diferencia: JSON.stringify({
                    nombre: entity.nombre,
                    mail: entity.mail,
                }),
            });
        } catch (error) {
            console.error('[user-update-log]', error?.message || 'log error');
        }

        return rowsAffected;
    };

    deleteByIdAsync = async (id) => {
        await this.agendaUsuarioRepository.deleteByUsuarioAsync(id);
        await this.estadisticasRepository.deleteByUsuarioAsync(id);
        await this.registroEstadisticasRepository.deleteByUsuarioAsync(id);
        await this.contenidoCategoriaRepository.deleteByUsuarioAsync(id);
        return this.usuariosRepository.deleteByIdAsync(id);
    };

    async getIdiomaPreferidoAsync(usuarioId) {
        const id = Number(usuarioId);
        if (!Number.isInteger(id) || id <= 0) throw new BadRequestError('Solicitud no válida');
        return normalizeLanguageCode(await this.usuariosRepository.getPreferredLanguageCodeAsync(id), 'es');
    }

    async getPreferredLanguageCodeAsync(usuarioId) {
        const id = Number(usuarioId);
        if (!Number.isInteger(id) || id <= 0) throw new BadRequestError('Solicitud no válida');

        const record = await this.usuariosRepository.getPreferredLanguageRecordAsync(id);
        if (!record) throw new BadRequestError('Solicitud no válida');
        return normalizeLanguageCode(record.codigoIdioma, 'es');
    }

    // Compatibilidad con clientes antiguos. La ruta nueva devuelve solo
    // codigoIdioma y no realiza traducciones ni llamadas externas.
    async getIdiomaPreferidoConFallbackAsync(usuarioId, detectedLanguage = null) {
        const id = Number(usuarioId);
        if (!Number.isInteger(id) || id <= 0) throw new BadRequestError('Solicitud no válida');

        const record = await this.usuariosRepository.getPreferredLanguageRecordAsync(id);
        if (!record) throw new Error('Usuario no encontrado');

        const code = record.codigoIdioma
            ? normalizeLanguageCode(record.codigoIdioma, 'es')
            : normalizeLanguageCode(detectedLanguage, 'es');
        return {
            usuarioId: id,
            codigoIdioma: code,
            nombreIdioma: this.translator.getSupportedLanguages()[code]?.name || code,
            origen: record.codigoIdioma ? 'guardado' : 'detectado',
        };
    }

    async cambiarIdiomaAsync(usuarioId, codigoIdioma) {
        const id = Number(usuarioId);
        const code = String(codigoIdioma || '').trim().toLowerCase();

        if (!Number.isInteger(id) || id <= 0 || !isSupportedLanguageCode(code)) {
            throw new BadRequestError('Solicitud no válida');
        }

        const rowsAffected = await this.usuariosRepository.updateIdiomaPreferidoAsync(id, code);
        if (rowsAffected < 1) throw new BadRequestError('Solicitud no válida');

        return {
            success: true,
            codigoIdioma: code,
        };
    }

    async updateFotoPerfilAsync(usuarioId, file) {
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
    }

    async getFotoPerfilUrlAsync(storedPhoto) {
        return this.storageService.getPhotoUrl(storedPhoto);
    }

    async deleteFotoPerfilAsync(usuarioId) {
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
    }

    async listFotosPerfilAsync(usuarioId) {
        return this.storageService.listUserPhotos(usuarioId);
    }

    getIdiomasSoportados() {
        return this.translator.getSupportedLanguages();
    }

    async updatePaisActualAsync(usuarioId, paisactual) {
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
        return {
            success: rowsAffected > 0,
            usuarioId: id,
            paisactual: paisId,
        };
    }
}
