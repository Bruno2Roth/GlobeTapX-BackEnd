import contenidoCategoriaRepository from '../../data/repositories/contenidoCategoriaRepository.js';

export default class contenidoCategoriaService {
    constructor() {
        console.log('Estoy en: contenidoCategoriaService.constructor()');
        this.contenidoCategoriaRepository = new contenidoCategoriaRepository();
    }

    getAllAsync = async () => {
        console.log(`contenidoCategoriaService.getAllAsync()`);
        const returnArray = await this.contenidoCategoriaRepository.getAllAsync();
        return returnArray;
    }

    getByIdAsync = async (id) => {
        console.log(`contenidoCategoriaService.getByIdAsync(${id})`);
        const returnEntity = await this.contenidoCategoriaRepository.getByIdAsync(id);
        return returnEntity;
    }

    getByContenidoAsync = async (IDContenido) => {
        console.log(`contenidoCategoriaService.getByContenidoAsync(${IDContenido})`);
        const returnArray = await this.contenidoCategoriaRepository.getByContenidoAsync(IDContenido);
        return returnArray;
    }

    getByCategoriaAsync = async (IDCategoria) => {
        console.log(`contenidoCategoriaService.getByCategoriaAsync(${IDCategoria})`);
        const returnArray = await this.contenidoCategoriaRepository.getByCategoriaAsync(IDCategoria);
        return returnArray;
    }
}