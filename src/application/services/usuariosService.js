import usuariosRepository from '../../data/repositories/usuariosRepository.js';
import agendaUsuarioRepository from '../../data/repositories/agendaUsuarioRepository.js';
import estadisticasRepository from '../../data/repositories/estadisticasRepository.js';
import registroEstadisticasRepository from '../../data/repositories/registroEstadisticasRepository.js';
import paisRepository from '../../data/repositories/paisRepository.js';
import contenidoCategoriaRepository from '../../data/repositories/contenidoCategoriaRepository.js';
import zLogCambiosService from './zLogCambiosService.js';
import { BadRequestError } from '../../api/errors.js';
import { resolveLanguageForWrite } from '../../idiomas/index.js';
import usuarioLanguageService from './usuarioLanguageService.js';
import usuarioProfileService from './usuarioProfileService.js';
import { normalizeEmail } from '../dtos/userProfile.js';

export default class usuariosService {
    constructor() {
        this.usuariosRepository = new usuariosRepository();
        this.agendaUsuarioRepository = new agendaUsuarioRepository();
        this.estadisticasRepository = new estadisticasRepository();
        this.registroEstadisticasRepository = new registroEstadisticasRepository();
        this.contenidoCategoriaRepository = new contenidoCategoriaRepository();
        this.logService = new zLogCambiosService();
        this.languageService = new usuarioLanguageService({ repository: this.usuariosRepository });
        this.profileService = new usuarioProfileService({
            repository: this.usuariosRepository,
            countries: new paisRepository(),
        });
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

        const normalizedMail = normalizeEmail(entity.mail);
        if (!normalizedMail) {
            throw this.createValidationError('El mail del usuario no es válido');
        }
        entity.mail = normalizedMail;

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

    createAsync = async (entity) => {
        const normalizedEntity = { ...(entity || {}) };
        const languageInput = normalizedEntity.idiomaPreferido
            ?? normalizedEntity.codigoIdioma
            ?? normalizedEntity.language;

        if (languageInput !== undefined && languageInput !== null && String(languageInput).trim() !== '') {
            const language = resolveLanguageForWrite(languageInput);
            if (!language) throw new BadRequestError('Solicitud no válida');
            // La columna actual es varchar: se guarda el ID estable y se
            // siguen aceptando códigos antiguos al leer.
            normalizedEntity.idiomaPreferido = String(language.id);
        }

        this.validateUsuarioEntity(normalizedEntity);

        const existingUser = await this.usuariosRepository.getBymailAsync(normalizedEntity.mail);
        if (existingUser) throw this.createDuplicateError('Ya existe un usuario con ese mail');

        const result = await this.usuariosRepository.createAsync(normalizedEntity);
        const newId = result?.ID || result;

        try {
            await this.logService.createAsync({
                IDUsuario: newId,
                accion: 'CREATE',
                tipoEntidad: 'Usuario',
                IDEntidad: newId,
                diferencia: JSON.stringify({ nombre: normalizedEntity.nombre, mail: normalizedEntity.mail }),
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

    getPreferredLanguageCodeAsync = (...args) => this.languageService.getPreferredLanguageCodeAsync(...args);
    getIdiomaPreferidoConFallbackAsync = (...args) => this.languageService.getIdiomaPreferidoConFallbackAsync(...args);
    cambiarIdiomaAsync = (...args) => this.languageService.cambiarIdiomaAsync(...args);

    updateFotoPerfilAsync = (...args) => this.profileService.updateFotoPerfilAsync(...args);
    getFotoPerfilUrlAsync = (...args) => this.profileService.getFotoPerfilUrlAsync(...args);
    getFotoPerfilAsync = (...args) => this.profileService.getFotoPerfilAsync(...args);
    deleteFotoPerfilAsync = (...args) => this.profileService.deleteFotoPerfilAsync(...args);
    listFotosPerfilAsync = (...args) => this.profileService.listFotosPerfilAsync(...args);
    updatePaisActualAsync = (...args) => this.profileService.updatePaisActualAsync(...args);

}
