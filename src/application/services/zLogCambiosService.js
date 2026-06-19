import zLogCambiosRepository from '../../data/repositories/zLogCambiosRepository.js';

export default class zLogCambiosService {
    constructor() {
        console.log('Estoy en: zLogCambiosService.constructor()');
        this.zLogCambiosRepository = new zLogCambiosRepository();
    }

    getAllAsync = async () => {
        console.log(`zLogCambiosService.getAllAsync()`);
        return await this.zLogCambiosRepository.getAllAsync();
    }

    getByIdAsync = async (id) => {
        console.log(`zLogCambiosService.getByIdAsync(${id})`);
        return await this.zLogCambiosRepository.getByIdAsync(id);
    }

    getByUsuarioAsync = async (IDUsuario) => {
        console.log(`zLogCambiosService.getByUsuarioAsync(${IDUsuario})`);
        return await this.zLogCambiosRepository.getByUsuarioAsync(IDUsuario);
    }

    createAsync = async (entity) => {
        console.log(`zLogCambiosService.createAsync(${JSON.stringify(entity)})`);
        if (!entity.IDUsuario || !entity.accion) {
            const error = new Error('IDUsuario y accion son requeridos');
            error.name = 'ValidationError';
            throw error;
        }
        if (!entity.fechaCreacion) {
            entity.fechaCreacion = new Date().toISOString();
        }
        return await this.zLogCambiosRepository.createAsync(entity);
    }
}