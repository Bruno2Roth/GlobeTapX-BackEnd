import usuariosRepository from './../../data/repositories/usuariosRepository.js';

export default class usuariosService {
    constructor() {
        console.log('Estoy en: usuariosService');
        this.usuariosRepository = new usuariosRepository();
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
        const rowsAffected = await this.usuariosRepository.createAsync(entity);
        return rowsAffected;
    }

    updateAsync = async (entity) => {
        console.log(`usuariosService.updateAsync(${JSON.stringify(entity)})`);
        const rowsAffected = await this.usuariosRepository.updateAsync(entity);
        return rowsAffected;
    }

    deleteByIdAsync = async (id) => {
        console.log(`usuariosService.deleteByIdAsync(${id})`);
        const rowsAffected = await this.usuariosRepository.deleteByIdAsync(id);
        return rowsAffected;
    }
}