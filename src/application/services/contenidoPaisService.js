import contenidoPaisRepository from '../../data/repositories/contenidoPaisRepository.js';

export default class contenidoPaisService {
    constructor() {
        console.log('Estoy en: contenidoPaisService.constructor()');
        this.contenidoPaisRepository = new contenidoPaisRepository();
    }

    getAllAsync = async () => {
        console.log(`contenidoPaisService.getAllAsync()`);
        const returnArray = await this.contenidoPaisRepository.getAllAsync();
        return returnArray;
    }

    getByIdAsync = async (id) => {
        console.log(`contenidoPaisService.getByIdAsync(${id})`);
        const returnEntity = await this.contenidoPaisRepository.getByIdAsync(id);
        return returnEntity;
    }

    getByPaisAsync = async (IDPais) => {
        console.log(`contenidoPaisService.getByPaisAsync(${IDPais})`);
        const returnArray = await this.contenidoPaisRepository.getByPaisAsync(IDPais);
        return returnArray;
    }
} 