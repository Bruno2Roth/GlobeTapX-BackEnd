import preferenciaUsuarioRepository from '../../data/repositories/preferenciaUsuarioRepository.js';

export default class preferenciaUsuarioService {
    constructor() {
        console.log('Estoy en: preferenciaUsuarioService.constructor()');
        this.preferenciaUsuarioRepository = new preferenciaUsuarioRepository();
    }

    getAllAsync = async () => {
        console.log(`preferenciaUsuarioService.getAllAsync()`);
        const returnArray = await this.preferenciaUsuarioRepository.getAllAsync();
        return returnArray;
    }

    getByIdAsync = async (id) => {
        console.log(`preferenciaUsuarioService.getByIdAsync(${id})`);
        const returnEntity = await this.preferenciaUsuarioRepository.getByIdAsync(id);
        return returnEntity;
    }

    getByUsuarioAsync = async (IDUsuario) => {
        console.log(`preferenciaUsuarioService.getByUsuarioAsync(${IDUsuario})`);
        const returnArray = await this.preferenciaUsuarioRepository.getByUsuarioAsync(IDUsuario);
        return returnArray;
    }

    createAsync = async (entity) => {
        console.log(`preferenciaUsuarioService.createAsync(${JSON.stringify(entity)})`);
        const rowsAffected = await this.preferenciaUsuarioRepository.createAsync(entity);
        return rowsAffected;
    }

    updateAsync = async (entity) => {
        console.log(`preferenciaUsuarioService.updateAsync(${JSON.stringify(entity)})`);
        const rowsAffected = await this.preferenciaUsuarioRepository.updateAsync(entity);
        return rowsAffected;
    }

    deleteByIdAsync = async (id) => {
        console.log(`preferenciaUsuarioService.deleteByIdAsync(${id})`);
        const rowsAffected = await this.preferenciaUsuarioRepository.deleteByIdAsync(id);
        return rowsAffected;
    }
}