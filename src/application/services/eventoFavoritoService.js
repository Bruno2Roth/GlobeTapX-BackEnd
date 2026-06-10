import eventoFavoritoRepository from '../../data/repositories/eventoFavoritoRepository.js';
import eventoFavorito from '../entities/eventoFavorito.js';

export default class eventoFavoritoService {
    constructor() {
        console.log('Estoy en: eventoFavoritoService.constructor()');
        this.eventoFavoritoRepository = new eventoFavoritoRepository();
    }

    mapRowToEntity(row) {
        return row ? new eventoFavorito(row.ID, row.IDUsuario, row.IDEvento, row.fechaAgregado) : null;
    }

    mapRowsToEntities(rows) {
        return Array.isArray(rows) ? rows.map((row) => this.mapRowToEntity(row)) : [];
    }

    getAllAsync = async () => {
        console.log(`eventoFavoritoService.getAllAsync()`);
        const rows = await this.eventoFavoritoRepository.getAllAsync();
        return this.mapRowsToEntities(rows);
    }

    getByUsuarioAsync = async (IDUsuario) => {
        console.log(`eventoFavoritoService.getByUsuarioAsync(${IDUsuario})`);
        const rows = await this.eventoFavoritoRepository.getByUsuarioAsync(IDUsuario);
        return this.mapRowsToEntities(rows);
    }

    getByIdAsync = async (id) => {
        console.log(`eventoFavoritoService.getByIdAsync(${id})`);
        const row = await this.eventoFavoritoRepository.getByIdAsync(id);
        return this.mapRowToEntity(row);
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