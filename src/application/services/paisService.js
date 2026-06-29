import paisRepository from '../../data/repositories/paisRepository.js';
import { getUtcOffset } from '../../helpers/timezoneMap.js';

export default class paisService {
    constructor() {
        console.log('Estoy en: paisService.constructor()');
        this.paisRepository = new paisRepository();
    }

    _attachLocalTime(entity) {
        if (!entity) return null;
        const offset = getUtcOffset(entity.codigo);
        return {
            ...entity,
            utc_offset_seconds: offset,
            local_time: new Date(Date.now() + offset * 1000)
                .toISOString()
                .replace('Z', ''),
        };
    }

    getAllAsync = async () => {
        console.log(`paisService.getAllAsync()`);
        const returnArray = await this.paisRepository.getAllAsync();
        return returnArray.map(e => this._attachLocalTime(e));
    }

    getByIdAsync = async (id) => {
        console.log(`paisService.getByIdAsync(${id})`);
        const returnEntity = await this.paisRepository.getByIdAsync(id);
        return this._attachLocalTime(returnEntity);
    }

    getByNameAsync = async (name) => {
        console.log(`paisService.getByNameAsync(${name})`);
        const returnEntity = await this.paisRepository.getByNameAsync(name);
        return this._attachLocalTime(returnEntity);
    }
}