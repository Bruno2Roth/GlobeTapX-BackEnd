import categoriasEmergenciaRepository from '../../data/repositories/categoriasEmergenciaRepository.js';

export default class categoriasEmergenciaService {
    constructor() {
        console.log('Estoy en: categoriasEmergenciaService.constructor()');
        this.categoriasEmergenciaRepository = new categoriasEmergenciaRepository();
    }

    getAllAsync = async () => {
        console.log(`categoriasEmergenciaService.getAllAsync()`);
        const returnArray = await this.categoriasEmergenciaRepository.getAllAsync();
        return returnArray;
    }

    getByIdAsync = async (id) => {
        console.log(`categoriasEmergenciaService.getByIdAsync(${id})`);
        const returnEntity = await this.categoriasEmergenciaRepository.getByIdAsync(id);
        return returnEntity;
    }
}