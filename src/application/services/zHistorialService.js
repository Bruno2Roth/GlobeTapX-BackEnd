import zHistorialRepository from '../../data/repositories/zHistorialRepository.js';

export default class zHistorialService {
    constructor() {
        console.log('Estoy en: zHistorialService.constructor()');
        this.zHistorialRepository = new zHistorialRepository();
    }
}