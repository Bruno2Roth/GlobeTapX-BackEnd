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
    getByPaisAsync = async (IDPais) => {
        console.log(`categoriasEmergenciaService.getByPaisAsync(${IDPais})`);
        const returnArray = await this.categoriasEmergenciaRepository.getByPaisAsync(IDPais);
        return returnArray;
    }
}