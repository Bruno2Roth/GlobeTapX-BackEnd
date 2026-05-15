import EventosRepository from '../../data/repositories/eventosRepository.js';

export default class eventosService {
    constructor() {
        console.log('Estoy en: eventosService.constructor()');
        this.eventosRepository = new EventosRepository();
    }

    getAllAsync = async () => {
        console.log(`eventosService.getAllAsync()`);
        const returnArray = await this.eventosRepository.getAllAsync();
        return returnArray;
    }

    getByIdAsync = async (id) => {
        console.log(`eventosService.getByIdAsync(${id})`);
        const returnEntity = await this.eventosRepository.getByIdAsync(id);
        return returnEntity;
    }

    createAsync = async (entity) => {
        console.log(`eventosService.createAsync(${JSON.stringify(entity)})`);
        const rowsAffected = await this.eventosRepository.createAsync(entity);
        return rowsAffected;
    }

    updateAsync = async (entity) => {
        console.log(`eventosService.updateAsync(${JSON.stringify(entity)})`);
        const rowsAffected = await this.eventosRepository.updateAsync(entity);
        return rowsAffected;
    }
    
    deleteByIdAsync = async (id) => {
        console.log(`eventosService.deleteByIdAsync(${id})`);
        const rowsAffected = await this.eventosRepository.deleteByIdAsync(id);
        return rowsAffected;
    }
}

