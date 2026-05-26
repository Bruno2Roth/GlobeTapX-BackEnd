import usuariosRepository from './../../data/repositories/usuariosRepository.js';

export default class usuariosService {
    constructor() {
        console.log('Estoy en: usuariosService.constructor()');
        this.usuariosRepository = new usuariosRepository();
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

        if (!entity.apellido || !entity.apellido.toString().trim()) {
            throw this.createValidationError('El apellido del usuario es obligatorio');
        }

        if (!entity.email || !entity.email.toString().trim()) {
            throw this.createValidationError('El email del usuario es obligatorio');
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
        const rowsAffected = await this.usuariosRepository.deleteByIdAsync(id);
        return rowsAffected;
    }
}