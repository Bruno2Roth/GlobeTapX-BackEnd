import ubicacionRepository from '../../data/repositories/ubicacionRepository.js';

export default class ubicacionService {
    constructor() {
        console.log('Estoy en: ubicacionService.constructor()');
        this.ubicacionRepository = new ubicacionRepository();
    }

    getAllAsync = async () => {
        console.log(`ubicacionService.getAllAsync()`);
        const returnArray = await this.ubicacionRepository.getAllAsync();
        return returnArray;
    }

    getByIdAsync = async (id) => {
        console.log(`ubicacionService.getByIdAsync(${id})`);
        const returnEntity = await this.ubicacionRepository.getByIdAsync(id);
        return returnEntity;
    }

    createAsync = async (entity) => {
        console.log(`ubicacionService.createAsync(${JSON.stringify(entity)})`);
        const rowsAffected = await this.ubicacionRepository.createAsync(entity);
        return rowsAffected;
    }

    updateAsync = async (entity) => {
        console.log(`ubicacionService.updateAsync(${JSON.stringify(entity)})`);
        const rowsAffected = await this.ubicacionRepository.updateAsync(entity);
        return rowsAffected;
    }

    deleteByIdAsync = async (id) => {
        console.log(`ubicacionService.deleteByIdAsync(${id})`);
        const rowsAffected = await this.ubicacionRepository.deleteByIdAsync(id);
        return rowsAffected;
    }
}