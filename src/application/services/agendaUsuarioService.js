import agendaUsuarioRepository from '../../data/repositories/agendaUsuarioRepository.js';

export default class agendaUsuarioService {
    constructor() {
        console.log('Estoy en: agendaUsuarioService.constructor()');
        this.agendaUsuarioRepository = new agendaUsuarioRepository();
    }

    getAllAsync = async () => {
        console.log(`agendaUsuarioService.getAllAsync()`);
        const returnArray = await this.agendaUsuarioRepository.getAllAsync();
        return returnArray;
    }

    getByIdAsync = async (id) => {
        console.log(`agendaUsuarioService.getByIdAsync(${id})`);
        const returnEntity = await this.agendaUsuarioRepository.getByIdAsync(id);
        return returnEntity;
    }

    getByUsuarioAsync = async (IDUsuario) => {
        console.log(`agendaUsuarioService.getByUsuarioAsync(${IDUsuario})`);
        const returnArray = await this.agendaUsuarioRepository.getByUsuarioAsync(IDUsuario);
        return returnArray;
    }

    getByEventoAsync = async (IDEvento) => {
        console.log(`agendaUsuarioService.getByEventoAsync(${IDEvento})`);
        const returnArray = await this.agendaUsuarioRepository.getByEventoAsync(IDEvento);
        return returnArray;
    }

    createAsync = async (entity) => {
        console.log(`agendaUsuarioService.createAsync(${JSON.stringify(entity)})`);
        const rowsAffected = await this.agendaUsuarioRepository.createAsync(entity);
        return rowsAffected;
    }

    updateAsync = async (entity) => {
        console.log(`agendaUsuarioService.updateAsync(${JSON.stringify(entity)})`);
        const rowsAffected = await this.agendaUsuarioRepository.updateAsync(entity);
        return rowsAffected;
    }

    deleteByIdAsync = async (id) => {
        console.log(`agendaUsuarioService.deleteByIdAsync(${id})`);
        const rowsAffected = await this.agendaUsuarioRepository.deleteByIdAsync(id);
        return rowsAffected;
    }
}