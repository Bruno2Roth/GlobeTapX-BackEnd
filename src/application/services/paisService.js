import paisRepository from '../../data/repositories/paisRepository.js';

export default class paisService {
    constructor() {
        console.log('Estoy en: paisService.constructor()');
        this.paisRepository = new paisRepository();
    }

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
}