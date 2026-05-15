import eventoFavoritoRepository from '../../data/repositories/eventoFavoritoRepository.js';

export default class eventoFavoritoService {
    constructor() {
        console.log('Estoy en: eventoFavoritoService.constructor()');
        this.eventoFavoritoRepository = new eventoFavoritoRepository();
    }

    getAllAsync = async () => {
        console.log(`eventoFavoritoService.getAllAsync()`);
        const returnArray = await this.eventoFavoritoRepository.getAllAsync();
        return returnArray;
    }

    getByUsuarioAsync = async (IDUsuario) => {
        console.log(`eventoFavoritoService.getByUsuarioAsync(${IDUsuario})`);
        const returnArray = await this.eventoFavoritoRepository.getByUsuarioAsync(IDUsuario);
        return returnArray;
    }

    createAsync = async (entity) => {
        console.log(`eventoFavoritoService.createAsync(${JSON.stringify(entity)})`);
        const rowsAffected = await this.eventoFavoritoRepository.createAsync(entity);
        return rowsAffected;
    }

    deleteByIdAsync = async (id) => {
        console.log(`eventoFavoritoService.deleteByIdAsync(${id})`);
        const rowsAffected = await this.eventoFavoritoRepository.deleteByIdAsync(id);
        return rowsAffected;
    }
}