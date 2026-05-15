import estadisticasRepository from '../../data/repositories/estadisticasRepository.js';

export default class estadisticasService {
    constructor() {
        console.log('Estoy en: estadisticasService.constructor()');
        this.estadisticasRepository = new estadisticasRepository();
    }

    getAllAsync = async () => {
        console.log(`estadisticasService.getAllAsync()`);
        const returnArray = await this.estadisticasRepository.getAllAsync();
        return returnArray;
    }

    getByIdAsync = async (id) => {
        console.log(`estadisticasService.getByIdAsync(${id})`);
        const returnEntity = await this.estadisticasRepository.getByIdAsync(id);
        return returnEntity;
    }

    updateAsync = async (entity) => {
        console.log(`estadisticasService.updateAsync(${JSON.stringify(entity)})`);
        const rowsAffected = await this.estadisticasRepository.updateAsync(entity);
        return rowsAffected;
    }
}