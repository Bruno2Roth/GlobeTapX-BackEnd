import agendaUsuarioRepository from '../../data/repositories/agendaUsuarioRepository.js';

export default class agendaUsuarioService {
    constructor({ repository = new agendaUsuarioRepository() } = {}) {
        this.agendaUsuarioRepository = repository;
    }

    getAllAsync = () => this.agendaUsuarioRepository.getAllAsync();
    getByIdAsync = (id) => this.agendaUsuarioRepository.getByIdAsync(id);
    getByUsuarioAsync = (IDUsuario) => this.agendaUsuarioRepository.getByUsuarioAsync(IDUsuario);
    getAgendaConDetallesByUsuarioAsync = (IDUsuario) => (
        this.agendaUsuarioRepository.getAgendaConDetallesByUsuarioAsync(IDUsuario)
    );
    createAsync = (entity) => this.agendaUsuarioRepository.createAsync(entity);
    updateAsync = (entity) => this.agendaUsuarioRepository.updateAsync(entity);
    deleteByIdAsync = (id) => this.agendaUsuarioRepository.deleteByIdAsync(id);
}
