import usuariosRepository from './../../data/repositories/usuariosRepository.js';
import agendaUsuarioRepository from '../../data/repositories/agendaUsuarioRepository.js';
import estadisticasRepository from '../../data/repositories/estadisticasRepository.js';
import registroEstadisticasRepository from '../../data/repositories/registroEstadisticasRepository.js';
import contenidoCategoriaRepository from '../../data/repositories/contenidoCategoriaRepository.js';
import paisRepository from '../../data/repositories/paisRepository.js';
import zLogCambiosService from './zLogCambiosService.js';
import mymemoryTranslationHelper from '../../helpers/mymemoryTranslationHelper.js';

export default class usuariosService {
    constructor() {
        console.log('Estoy en: usuariosService.constructor()');
        this.usuariosRepository = new usuariosRepository();
        this.agendaUsuarioRepository = new agendaUsuarioRepository();
        this.estadisticasRepository = new estadisticasRepository();
        this.registroEstadisticasRepository = new registroEstadisticasRepository();
        this.paisRepository = new paisRepository();
        this.contenidoCategoriaRepository = new contenidoCategoriaRepository();
        this.logService = new zLogCambiosService();
        this.translator = new mymemoryTranslationHelper();
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

        if (!entity.nombre && entity.nombreCompleto) {
            entity.nombre = entity.nombreCompleto;
        }

        if (!entity.nombre || !entity.nombre.toString().trim()) {
            throw this.createValidationError('El nombre del usuario es obligatorio');
        }

        if (!entity.mail && entity.mail) {
            entity.mail = entity.mail;
        }

        if (!entity.contrasena && entity.contrasena) {
            entity.contrasena = entity.contrasena;
        }

        const nombre = entity.nombre.toString().trim();
        const apellido = entity.apellido && entity.apellido.toString().trim() ? entity.apellido.toString().trim() : '';

        if (!entity.mail || !entity.mail.toString().trim()) {
            throw this.createValidationError('El mail del usuario es obligatorio');
        }

        if (!entity.nombreCompleto || !entity.nombreCompleto.toString().trim()) {
            entity.nombreCompleto = apellido ? `${nombre} ${apellido}` : nombre;
        }

        const mail = entity.mail.toString().trim();
        const mailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/; 
        if (!mailRegex.test(mail)) {
            throw this.createValidationError('El mail del usuario no es válido');
        }

        if (!requireId && (!entity.contrasena || !entity.contrasena.toString().trim())) {
            throw this.createValidationError('La contraseña del usuario es obligatoria');
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

    getBymailAsync = async (mail) => {
        console.log(`usuariosService.getBymailAsync(${mail})`);
        const returnEntity = await this.usuariosRepository.getBymailAsync(mail);
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

        const existingUser = await this.usuariosRepository.getBymailAsync(entity.mail);
        if (existingUser) {
            throw this.createDuplicateError(`Ya existe un usuario con mail ${entity.mail}`);
        }

        const rowsAffected = await this.usuariosRepository.createAsync(entity);
        
        const nuevoId = rowsAffected?.ID || rowsAffected;
        
        // Registrar estadística de creación
        await this._registrarEstadistica('usuario_creado', entity.mail, { nombre: entity.nombre });
        
        // Log automático
        try {
            const { contrasena, ...safeEntity } = entity;
            await this.logService.createAsync({
                IDUsuario: nuevoId,
                accion: 'CREATE',
                tipoEntidad: 'Usuario',
                IDEntidad: nuevoId,
                diferencia: JSON.stringify(safeEntity)
            });
        } catch (logErr) {
            console.error('Error al guardar log de creación:', logErr);
        }
        
        return rowsAffected;
    }

    updateAsync = async (entity) => {
        console.log(`usuariosService.updateAsync(${JSON.stringify(entity)})`);

        const userId = entity.ID || entity.id;
        if (!userId) {
            throw this.createValidationError('El ID del usuario es obligatorio');
        }

        const currentUser = await this.usuariosRepository.getByIdAsync(userId);
        if (!currentUser) {
            throw new Error('Usuario no encontrado');
        }

        if (!entity.mail) {
            entity.mail = currentUser?.mail || currentUser?.mail;
        }

        if (!entity.nombre) {
            entity.nombre = currentUser?.nombre;
        }

        if (!entity.contrasena) {
            entity.contrasena = currentUser?.contrasena || currentUser?.contrasena;
        }

        this.validateUsuarioEntity(entity, true);

        const existingUser = await this.usuariosRepository.getBymailAsync(entity.mail);
        if (existingUser && Number(existingUser.ID) !== Number(userId)) {
            throw this.createDuplicateError(`Ya existe otro usuario con mail ${entity.mail}`);
        }

        const rowsAffected = await this.usuariosRepository.updateAsync(entity);
        
        // Registrar estadística de actualización
        await this._registrarEstadistica('usuario_actualizado', entity.ID, { nombre: entity.nombre, mail: entity.mail });
        
        // Log automático
        try {
            const { contrasena, ...safeEntity } = entity;
            await this.logService.createAsync({
                IDUsuario: entity.ID,
                accion: 'UPDATE',
                tipoEntidad: 'Usuario',
                IDEntidad: entity.ID,
                diferencia: JSON.stringify(safeEntity)
            });
        } catch (logErr) {
            console.error('Error al guardar log de actualización:', logErr);
        }
        
        return rowsAffected;
    }

    deleteByIdAsync = async (id) => {
        console.log(`usuariosService.deleteByIdAsync(${id})`);

        // Eliminar todas las referencias para evitar violaciones de clave foránea.
        await this.agendaUsuarioRepository.deleteByUsuarioAsync(id);
        await this.estadisticasRepository.deleteByUsuarioAsync(id);
        await this.registroEstadisticasRepository.deleteByUsuarioAsync(id);
        await this.contenidoCategoriaRepository.deleteByUsuarioAsync(id);

        const rowsAffected = await this.usuariosRepository.deleteByIdAsync(id);
        
        // Registrar estadística de eliminación
        await this._registrarEstadistica('usuario_eliminado', id, null);
        
        return rowsAffected;
    }

    async _registrarEstadistica(tipo, usuarioId, datos) {
        console.log(`usuariosService._registrarEstadistica(${tipo}, ${usuarioId})`);
        try {
            // Log en consola (puedes agregar DB más tarde)
            const timestamp = new Date().toISOString();
            console.log(`[ESTADISTICA] ${timestamp} | Tipo: ${tipo} | Usuario: ${usuarioId} | Datos: ${JSON.stringify(datos)}`);
        } catch (error) {
            console.error('Error registrando estadística:', error);
        }
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

        const preferido = usuario.idiomaPreferido || usuario.idioma || null;

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

    async updatePaisActualAsync(usuarioId, paisactual) {
        console.log(`usuariosService.updatePaisActualAsync(${usuarioId}, ${paisactual})`);

        if (!usuarioId) {
            throw new Error('ID de usuario es requerido');
        }

        const usuario = await this.usuariosRepository.getByIdAsync(usuarioId);
        if (!usuario) {
            throw new Error('Usuario no encontrado');
        }

        const paisId = Number(paisactual);
        if (!Number.isInteger(paisId) || paisId < 1) {
            throw new Error('ID de país inválido');
        }
        const paisValido = await this.paisRepository.getByIdAsync(paisId);
        if (!paisValido) {
            throw new Error(`País con ID ${paisId} no encontrado`);
        }

        const rowsAffected = await this.usuariosRepository.updatePaisActualAsync(usuarioId, paisId);

        // Log automático
        try {
            await this.logService.createAsync({
                IDUsuario: usuarioId,
                accion: 'UPDATE',
                tipoEntidad: 'Usuario',
                IDEntidad: usuarioId,
                diferencia: JSON.stringify({ paisactual: paisId })
            });
        } catch (logErr) {
            console.error('Error al guardar log de paisactual:', logErr);
        }

        return {
            success: true,
            message: 'País actual actualizado exitosamente',
            updated: rowsAffected > 0,
            usuarioId,
            paisactual: paisId
        };
    }
}