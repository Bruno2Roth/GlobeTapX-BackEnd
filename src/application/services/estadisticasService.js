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

    getByUsuarioAsync = async (usuarioId) => {
        console.log(`estadisticasService.getByUsuarioAsync(${usuarioId})`);
        if (!usuarioId || usuarioId <= 0) {
            throw new Error('ID de usuario inválido');
        }
        const stats = await this.estadisticasRepository.getByUsuarioAsync(usuarioId);
        if (!stats) {
            throw new Error('Estadísticas no encontradas para este usuario');
        }
        return stats;
    }

    updateAsync = async (entity) => {
        console.log(`estadisticasService.updateAsync(${JSON.stringify(entity)})`);
        const rowsAffected = await this.estadisticasRepository.updateAsync(entity);
        return rowsAffected;
    }
}