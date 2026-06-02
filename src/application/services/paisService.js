import paisRepository from '../../data/repositories/paisRepository.js';

export default class paisService {
    constructor() {
        console.log('Estoy en: paisService.constructor()');
        this.paisRepository = new paisRepository();
    }

    // Servicio que abstrae las consultas de país sobre la tabla Pais.

    getAllAsync = async () => {
        console.log(`paisService.getAllAsync()`);
        const returnArray = await this.paisRepository.getAllAsync();
        return returnArray;
    }

    getByIdAsync = async (id) => {
        console.log(`paisService.getByIdAsync(${id})`);
        const returnEntity = await this.paisRepository.getByIdAsync(id);
        return returnEntity;
    }

    getByNameAsync = async (name) => {
        console.log(`paisService.getByNameAsync(${name})`);
        const returnEntity = await this.paisRepository.getByNameAsync(name);
        return returnEntity;
    }
}