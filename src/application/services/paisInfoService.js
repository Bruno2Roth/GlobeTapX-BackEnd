import paisInfoRepository from '../../data/repositories/paisInfoRepository.js';

export default class paisInfoService {
    constructor() {
        console.log('Estoy en: paisInfoService.constructor()');
        this.paisInfoRepository = new paisInfoRepository();
    }

    // Devuelve todos los registros de PaisInfo sin filtro.
    getAllAsync = async () => {
        console.log('paisInfoService.getAllAsync()');
        return await this.paisInfoRepository.getAllAsync();
    }

    // Devuelve un registro de PaisInfo por su ID en la tabla.
    getByIdAsync = async (id) => {
        console.log(`paisInfoService.getByIdAsync(${id})`);
        return await this.paisInfoRepository.getByIdAsync(id);
    }

    // Devuelve todos los registros de PaisInfo para un país específico
    // usando el ID del país (IDPais).
    getByPaisIdAsync = async (IDPais) => {
        console.log(`paisInfoService.getByPaisIdAsync(${IDPais})`);
        return await this.paisInfoRepository.getByPaisIdAsync(IDPais);
    }

    // Busca PaisInfo por nombre de país.
    getByPaisNameAsync = async (name) => {
        console.log(`paisInfoService.getByPaisNameAsync(${name})`);
        return await this.paisInfoRepository.getByPaisNameAsync(name);
    }

    // Devuelve solo los campos de reglas para todos los países.
    getAllRulesAsync = async () => {
        console.log('paisInfoService.getAllRulesAsync()');
        return await this.paisInfoRepository.getAllRulesAsync();
    }

    getRulesByPaisIdAsync = async (IDPais) => {
        console.log(`paisInfoService.getRulesByPaisIdAsync(${IDPais})`);
        return await this.paisInfoRepository.getRulesByPaisIdAsync(IDPais);
    }

    getRulesByPaisNameAsync = async (name) => {
        console.log(`paisInfoService.getRulesByPaisNameAsync(${name})`);
        return await this.paisInfoRepository.getRulesByPaisNameAsync(name);
    }
}
