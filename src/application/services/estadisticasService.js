import estadisticasRepository from '../../data/repositories/estadisticasRepository.js';
import registroEstadisticasRepository from '../../data/repositories/registroEstadisticasRepository.js';

export default class estadisticasService {
    constructor() {
        console.log('Estoy en: estadisticasService.constructor()');
        this.estadisticasRepository = new estadisticasRepository();
        this.registroRepository = new registroEstadisticasRepository();
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

    createAsync = async (entity) => {
        console.log(`estadisticasService.createAsync(${JSON.stringify(entity)})`);
        return await this.estadisticasRepository.createAsync(entity);
    }

    incrementarStatAsync = async (usuarioId, campo, valor = 1) => {
        console.log(`estadisticasService.incrementarStatAsync(${usuarioId}, ${campo}, ${valor})`);
        let stats = await this.estadisticasRepository.getByUsuarioAsync(usuarioId);
        if (!stats) {
            const newStats = { IDUsuario: usuarioId, [campo]: valor };
            await this.estadisticasRepository.createAsync(newStats);
        } else {
            await this.estadisticasRepository.updateAsync({
                ID: stats.ID,
                [campo]: (stats[campo] || 0) + valor,
                fechaActualizacion: new Date(),
            });
        }
    }

    updateAsync = async (entity) => {
        console.log(`estadisticasService.updateAsync(${JSON.stringify(entity)})`);
        const rowsAffected = await this.estadisticasRepository.updateAsync(entity);
        return rowsAffected;
    }

    logEventoAsync = async (usuarioId, tipoEvento, detalle = null) => {
        console.log(`estadisticasService.logEventoAsync(${usuarioId}, ${tipoEvento})`);
        return await this.registroRepository.createAsync({
            IDUsuario: usuarioId,
            tipoEvento,
            detalle: detalle ? JSON.stringify(detalle) : null,
        });
    }

    getEventosByUsuarioAsync = async (usuarioId) => {
        console.log(`estadisticasService.getEventosByUsuarioAsync(${usuarioId})`);
        return await this.registroRepository.getByUsuarioAsync(usuarioId);
    }

    getGeneralesAsync = async () => {
        console.log(`estadisticasService.getGeneralesAsync()`);
        return await this.estadisticasRepository.contarRegistrosAsync();
    }

    getAllEventosAsync = async () => {
        console.log(`estadisticasService.getAllEventosAsync()`);
        return await this.registroRepository.getAllAsync();
    }
}
