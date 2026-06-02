import paisInfoRepository from '../../data/repositories/paisInfoRepository.js';
import paisInfo from '../entities/paisInfo.js';

export default class paisInfoService {
    constructor() {
        console.log('Estoy en: paisInfoService.constructor()');
        this.paisInfoRepository = new paisInfoRepository();
    }

    mapRowToEntity(row) {
        return row ? new paisInfo(row) : null;
    }

    mapRowsToEntities(rows) {
        return Array.isArray(rows) ? rows.map((row) => this.mapRowToEntity(row)) : [];
    }

    // Devuelve todos los registros de PaisInfo sin filtro.
    getAllAsync = async () => {
        console.log('paisInfoService.getAllAsync()');
        const rows = await this.paisInfoRepository.getAllAsync();
        return this.mapRowsToEntities(rows);
    }

    // Devuelve un registro de PaisInfo por su ID en la tabla.
    getByIdAsync = async (id) => {
        console.log(`paisInfoService.getByIdAsync(${id})`);
        const row = await this.paisInfoRepository.getByIdAsync(id);
        return this.mapRowToEntity(row);
    }

    // Devuelve todos los registros de PaisInfo para un país específico
    // usando el ID del país (IDPais).
    getByPaisIdAsync = async (IDPais) => {
        console.log(`paisInfoService.getByPaisIdAsync(${IDPais})`);
        const rows = await this.paisInfoRepository.getByPaisIdAsync(IDPais);
        return this.mapRowsToEntities(rows);
    }

    // Busca PaisInfo por nombre de país.
    getByPaisNameAsync = async (name) => {
        console.log(`paisInfoService.getByPaisNameAsync(${name})`);
        const rows = await this.paisInfoRepository.getByPaisNameAsync(name);
        return this.mapRowsToEntities(rows);
    }

    // Devuelve solo los campos de reglas para todos los países.
    getAllRulesAsync = async () => {
        console.log('paisInfoService.getAllRulesAsync()');
        const rows = await this.paisInfoRepository.getAllRulesAsync();
        return this.mapRowsToEntities(rows);
    }

    getRulesByPaisIdAsync = async (IDPais) => {
        console.log(`paisInfoService.getRulesByPaisIdAsync(${IDPais})`);
        const rows = await this.paisInfoRepository.getRulesByPaisIdAsync(IDPais);
        return this.mapRowsToEntities(rows);
    }

    getRulesByPaisNameAsync = async (name) => {
        console.log(`paisInfoService.getRulesByPaisNameAsync(${name})`);
        const rows = await this.paisInfoRepository.getRulesByPaisNameAsync(name);
        return this.mapRowsToEntities(rows);
    }
}
