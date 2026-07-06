import EventosRepository from '../../data/repositories/eventosRepository.js';
import zLogCambiosService from './zLogCambiosService.js';

export default class eventosService {
    constructor() {
        console.log('Estoy en: eventosService.constructor()');
        this.eventosRepository = new EventosRepository();
        this.logService = new zLogCambiosService();
    }

    getAllAsync = async () => {
        console.log(`eventosService.getAllAsync()`);
        const returnArray = await this.eventosRepository.getAllAsync();
        return returnArray;
    }

    getByIdAsync = async (id) => {
        console.log(`eventosService.getByIdAsync(${id})`);
        const returnEntity = await this.eventosRepository.getByIdAsync(id);
        return returnEntity;
    }

    createAsync = async (entity) => {
        console.log(`eventosService.createAsync(${JSON.stringify(entity)})`);
        const rowsAffected = await this.eventosRepository.createAsync(entity);

        const nuevoId = rowsAffected?.ID || rowsAffected;

        // Log automático
        try {
            const usuarioId = entity.IDUsuario || entity.idUsuario || null;
            await this.logService.createAsync({
                IDUsuario: usuarioId,
                accion: 'CREATE',
                tipoEntidad: 'Evento',
                IDEntidad: nuevoId,
                diferencia: JSON.stringify(entity)
            });
        } catch (logErr) {
            console.error('Error al guardar log de creación de evento:', logErr);
        }

        return rowsAffected;
    }

    getByPaisAsync = async (IDPais) => {
        console.log(`eventosService.getByPaisAsync(${IDPais})`);
        const returnArray = await this.eventosRepository.getByPaisAsync(IDPais);
        return returnArray;
    }

    getByCategoriaAsync = async (IDCategoria) => {
        console.log(`eventosService.getByCategoriaAsync(${IDCategoria})`);
        const returnArray = await this.eventosRepository.getByCategoriaAsync(IDCategoria);
        return returnArray;
    }

    getByFechaAsync = async (fechaInicio, fechaFin) => {
        console.log(`eventosService.getByFechaAsync(${fechaInicio}, ${fechaFin})`);
        const returnArray = await this.eventosRepository.getByFechaAsync(fechaInicio, fechaFin);
        return returnArray;
    }

    updateAsync = async (entity) => {
        console.log(`eventosService.updateAsync(${JSON.stringify(entity)})`);
        const rowsAffected = await this.eventosRepository.updateAsync(entity);

        // Log automático
        try {
            const usuarioId = entity.IDUsuario || entity.idUsuario || null;
            await this.logService.createAsync({
                IDUsuario: usuarioId,
                accion: 'UPDATE',
                tipoEntidad: 'Evento',
                IDEntidad: entity.ID,
                diferencia: JSON.stringify(entity)
            });
        } catch (logErr) {
            console.error('Error al guardar log de actualización de evento:', logErr);
        }

        return rowsAffected;
    }
    
    deleteByIdAsync = async (id) => {
        console.log(`eventosService.deleteByIdAsync(${id})`);
        const rowsAffected = await this.eventosRepository.deleteByIdAsync(id);
        return rowsAffected;
    }
}

