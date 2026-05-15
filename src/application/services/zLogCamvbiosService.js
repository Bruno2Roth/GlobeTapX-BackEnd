import zLogCambiosRepository from '../../data/repositories/zLogCambiosRepository.js';

export default class zLogCambiosService {
    constructor() {
        console.log('Estoy en: zLogCambiosService.constructor()');
        this.zLogCambiosRepository = new zLogCambiosRepository();
    }
    
    createAsync = async (entity) => {
        console.log(`zLogCambiosService.createAsync(${JSON.stringify(entity)})`);
        const rowsAffected = await this.zLogCambiosRepository.createAsync(entity);
        return rowsAffected;
    }
}