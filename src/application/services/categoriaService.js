import categoriaRepository from '../../data/repositories/categoriaRepository.js';

export default class categoriaService {
    constructor() {
        console.log('Estoy en: categoriaService.constructor()');
        this.categoriaRepository = new categoriaRepository();
    }

    getAllAsync = async () => {
        console.log(`categoriaService.getAllAsync()`);
        const returnArray = await this.categoriaRepository.getAllAsync();
        return returnArray;
    }

    getByNameAsync = async (name) => {
        console.log(`categoriaService.getByNameAsync(${name})`);
        const returnEntity = await this.categoriaRepository.getByNameAsync(name);
        return returnEntity;
    }
}