import usuariosRepository from './../../data/repositories/usuariosRepository.js';
import agendaUsuarioRepository from '../../data/repositories/agendaUsuarioRepository.js';
import translationHelper from '../../helpers/translationHelper.js';

export default class usuariosService {
    constructor() {
        console.log('Estoy en: usuariosService.constructor()');
        this.usuariosRepository = new usuariosRepository();
        this.agendaUsuarioRepository = new agendaUsuarioRepository();
        this.translator = new translationHelper();
    }

    createValidationError(message) {
        const error = new Error(message);
        error.name = 'ValidationError';
        return error;
    }

    createDuplicateError(message) {
        const error = new Error(message);
        error.name = 'DuplicateError';
        error.code = 'DUPLICATE_USER';
        return error;
    }

    validateUsuarioEntity(entity, requireId = false) {
        if (!entity || typeof entity !== 'object') {
            throw this.createValidationError('Los datos del usuario son necesarios');
        }

        if (requireId && !entity.ID) {
            throw this.createValidationError('El ID del usuario es obligatorio para actualizar');
        }

        if (!entity.nombre || !entity.nombre.toString().trim()) {
            throw this.createValidationError('El nombre del usuario es obligatorio');
        }

        if (!entity.email && entity.mail) {
            entity.email = entity.mail;
        }

        if (!entity.password && entity.contrasena) {
            entity.password = entity.contrasena;
        }

        const nombre = entity.nombre.toString().trim();
        const apellido = entity.apellido && entity.apellido.toString().trim() ? entity.apellido.toString().trim() : '';

        if (!entity.email || !entity.email.toString().trim()) {
            throw this.createValidationError('El email del usuario es obligatorio');
        }

        if (!entity.nombreCompleto || !entity.nombreCompleto.toString().trim()) {
            entity.nombreCompleto = apellido ? `${nombre} ${apellido}` : nombre;
        }

        const email = entity.email.toString().trim();
        const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
        if (!emailRegex.test(email)) {
            throw this.createValidationError('El email del usuario no es válido');
        }

        if (!entity.password || !entity.password.toString().trim()) {
            throw this.createValidationError('La contraseña del usuario es obligatoria');
        }

        if (!entity.fechaNacimiento || !entity.fechaNacimiento.toString().trim()) {
            throw this.createValidationError('La fecha de nacimiento del usuario es obligatoria');
        }

        const fecha = new Date(entity.fechaNacimiento);
        if (Number.isNaN(fecha.getTime())) {
            throw this.createValidationError('La fecha de nacimiento no es una fecha válida');
        }
    }

    getAllAsync = async () => {
        console.log(`usuariosService.getAllAsync()`);
        const returnArray = await this.usuariosRepository.getAllAsync();
        return returnArray;
    }

    getByIdAsync = async (id) => {
        console.log(`usuariosService.getByIdAsync(${id})`);
        const returnEntity = await this.usuariosRepository.getByIdAsync(id);
        return returnEntity;
    }

    getByEmailAsync = async (email) => {
        console.log(`usuariosService.getByEmailAsync(${email})`);
        const returnEntity = await this.usuariosRepository.getByEmailAsync(email);
        return returnEntity;
    }

    getByNombreAsync = async (nombre) => {
        console.log(`usuariosService.getByNombreAsync(${nombre})`);
        const returnArray = await this.usuariosRepository.getByNombreAsync(nombre);
        return returnArray;
    }

    createAsync = async (entity) => {
        console.log(`usuariosService.createAsync(${JSON.stringify(entity)})`);
        this.validateUsuarioEntity(entity);

        const existingUser = await this.usuariosRepository.getByEmailAsync(entity.email);
        if (existingUser) {
            throw this.createDuplicateError(`Ya existe un usuario con email ${entity.email}`);
        }

        const rowsAffected = await this.usuariosRepository.createAsync(entity);
        return rowsAffected;
    }

    updateAsync = async (entity) => {
        console.log(`usuariosService.updateAsync(${JSON.stringify(entity)})`);
        this.validateUsuarioEntity(entity, true);

        const existingUser = await this.usuariosRepository.getByEmailAsync(entity.email);
        if (existingUser && Number(existingUser.ID) !== Number(entity.ID)) {
            throw this.createDuplicateError(`Ya existe otro usuario con email ${entity.email}`);
        }

        const rowsAffected = await this.usuariosRepository.updateAsync(entity);
        return rowsAffected;
    }

    deleteByIdAsync = async (id) => {
        console.log(`usuariosService.deleteByIdAsync(${id})`);

        // Eliminar primero las referencias en AgendaUsuario para evitar violaciones de clave foránea.
        await this.agendaUsuarioRepository.deleteByUsuarioAsync(id);

        const rowsAffected = await this.usuariosRepository.deleteByIdAsync(id);
        return rowsAffected;
    }

    async getIdiomaPreferidoAsync(usuarioId) {
        console.log(`usuariosService.getIdiomaPreferidoAsync(${usuarioId})`);

        if (!usuarioId) {
            throw new Error('ID de usuario es requerido');
        }

        const idioma = await this.usuariosRepository.getIdiomaPreferidoAsync(usuarioId);
        return idioma || null;
    }

    async getIdiomaPreferidoConFallbackAsync(usuarioId, detectedLanguage = null) {
        console.log(`usuariosService.getIdiomaPreferidoConFallbackAsync(${usuarioId}, ${detectedLanguage})`);
        if (!usuarioId) {
            throw new Error('ID de usuario es requerido');
        }

        // Verificar existencia del usuario en la BD
        const usuario = await this.usuariosRepository.getByIdAsync(usuarioId);
        if (!usuario) {
            // No inventamos nada: si el usuario no existe devolvemos un error
            throw new Error('Usuario no encontrado');
        }

        const preferido = usuario.idiomapreferido || usuario.idioma || null;

        if (preferido) {
            return {
                usuarioId,
                codigoIdioma: preferido,
                nombreIdioma: this.translator.getSupportedLanguages()[preferido]?.name || 'Español',
                origen: 'guardado'
            };
        }

        // El usuario existe pero no tiene idioma preferido guardado.
        if (!detectedLanguage) {
            return {
                usuarioId,
                codigoIdioma: null,
                nombreIdioma: null,
                origen: 'no-detectado',
                message: 'No hay idioma preferido ni lenguaje detectado para este usuario'
            };
        }

        const normalizedLanguage = this.translator.normalizeLanguageCode(detectedLanguage);

        return {
            usuarioId,
            codigoIdioma: normalizedLanguage,
            nombreIdioma: this.translator.getSupportedLanguages()[normalizedLanguage]?.name || 'Español',
            origen: 'detectado'
        };
    }

    async cambiarIdiomaAsync(usuarioId, codigoIdioma) {
        console.log(`usuariosService.cambiarIdiomaAsync(${usuarioId}, ${codigoIdioma})`);

        if (!usuarioId || !codigoIdioma) {
            throw new Error('Usuario ID e idioma son requeridos');
        }

        const normalizedLanguage = this.translator.normalizeLanguageCode(codigoIdioma);
        if (!this.translator.isValidLanguageCode(normalizedLanguage)) {
            throw new Error('Código de idioma no válido. Idiomas soportados: es, en, fr, it, pt, ko, zh, he');
        }

        const usuario = await this.usuariosRepository.getByIdAsync(usuarioId);
        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }

        const rowsAffected = await this.usuariosRepository.updateIdiomaPreferidoAsync(usuarioId, normalizedLanguage);
        return {
            success: true,
            message: 'Idioma actualizado exitosamente',
            updated: rowsAffected > 0,
            usuarioId,
            codigoIdioma: normalizedLanguage,
            nombreIdioma: this.translator.getSupportedLanguages()[normalizedLanguage]?.name || 'Desconocido'
        };
    }

    getIdiomasSoportados() {
        return this.translator.getSupportedLanguages();
    }
}