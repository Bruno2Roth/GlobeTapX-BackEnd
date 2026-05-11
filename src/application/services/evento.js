import EventosRepository from '../../data/repositories/eventosRepository.js';

export default class EventosService {
    constructor() {
        console.log('Estoy en: EventosService.constructor()');
        this.eventosRepository = new EventosRepository();
    }

    getAllAsync = async () => {
        console.log(`EventosService.getAllAsync()`);
        const returnArray = await this.eventosRepository.getAllAsync();
        return returnArray;
    }

    getByIdAsync = async (id) => {
        console.log(`EventosService.getByIdAsync(${id})`);
        const returnEntity = await this.eventosRepository.getByIdAsync(id);
        return returnEntity;
    }

    createAsync = async (entity) => {
        console.log(`EventosService.createAsync(${JSON.stringify(entity)})`);
        const rowsAffected = await this.eventosRepository.createAsync(entity);
        return rowsAffected;
    }

    updateAsync = async (entity) => {
        console.log(`EventosService.updateAsync(${JSON.stringify(entity)})`);
        const rowsAffected = await this.eventosRepository.updateAsync(entity);
        return rowsAffected;
    }
    
    deleteByIdAsync = async (id) => {
        console.log(`EventosService.deleteByIdAsync(${id})`);
        const rowsAffected = await this.eventosRepository.deleteByIdAsync(id);
        return rowsAffected;
    }

    /*
    getByIdAsync_PPT = async (id) => {
        console.log('Estoy en: EventosService.getByIdAsync_PPT()');
        const returnEntity = await this.eventosRepository.getByIdAsync_PPT(id);
        return returnEntity;
    }
    */
}

