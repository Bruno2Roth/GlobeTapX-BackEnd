import tipoAdminRepository from '../../data/repositories/tipoAdminRespository.js';

export default class tipoAdminService {
    constructor() {
        console.log('Estoy en: tipoAdminService.constructor()');
        this.tipoAdminRepository = new tipoAdminRepository();
    }

    getAllAsync = async () => {
        console.log(`tipoAdminService.getAllAsync()`);
        const returnArray = await this.tipoAdminRepository.getAllAsync();
        return returnArray;
    }

    getByIdAsync = async (id) => {
        console.log(`tipoAdminService.getByIdAsync(${id})`);
        const returnEntity = await this.tipoAdminRepository.getByIdAsync(id);
        return returnEntity;
    }
}