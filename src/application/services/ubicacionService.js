import axios from 'axios';
import https from 'https';
import ubicacionRepository from '../../data/repositories/ubicacionRepository.js';

export default class ubicacionService {
    constructor() {
        console.log('Estoy en: ubicacionService.constructor()');
        this.ubicacionRepository = new ubicacionRepository();
    }

    normalizeIp(ip) {
        if (!ip) return null;
        const cleaned = ip.toString().trim();
        if (cleaned.startsWith('::ffff:')) {
            return cleaned.substring(7);
        }
        if (cleaned === '::1' || cleaned === '127.0.0.1') {
            return null;
        }
        return cleaned;
    }

    async getByIpAsync(ip) {
        console.log(`ubicacionService.getByIpAsync(${ip})`);

        const normalizedIp = this.normalizeIp(ip);
        const url = normalizedIp ? `https://ipapi.co/${normalizedIp}/json/` : 'https://ipapi.co/json/';
        const response = await axios.get(url, { timeout: 10000, httpsAgent: new https.Agent({ rejectUnauthorized: process.env.NODE_ENV === 'production' }) });

        if (response.data && response.data.error) {
            throw new Error(response.data.reason || 'Error al consultar ipapi.co');
        }

        return {
            ip: response.data.ip,
            city: response.data.city,
            region: response.data.region,
            country: response.data.country_name,
            country_code: response.data.country,
            postal: response.data.postal,
            latitude: response.data.latitude,
            longitude: response.data.longitude,
            timezone: response.data.timezone,
            org: response.data.org,
        };
    }

    getAllAsync = async () => {
        console.log(`ubicacionService.getAllAsync()`);
        const returnArray = await this.ubicacionRepository.getAllAsync();
        return returnArray;
    }

    getByIdAsync = async (id) => {
        console.log(`ubicacionService.getByIdAsync(${id})`);
        const returnEntity = await this.ubicacionRepository.getByIdAsync(id);
        return returnEntity;
    }

    createAsync = async (entity) => {
        console.log(`ubicacionService.createAsync(${JSON.stringify(entity)})`);
        const rowsAffected = await this.ubicacionRepository.createAsync(entity);
        return rowsAffected;
    }

    updateAsync = async (entity) => {
        console.log(`ubicacionService.updateAsync(${JSON.stringify(entity)})`);
        const rowsAffected = await this.ubicacionRepository.updateAsync(entity);
        return rowsAffected;
    }

    deleteByIdAsync = async (id) => {
        console.log(`ubicacionService.deleteByIdAsync(${id})`);
        const rowsAffected = await this.ubicacionRepository.deleteByIdAsync(id);
        return rowsAffected;
    }
}