import axios from 'axios';
import https from 'node:https';
import paisRepository from '../../data/repositories/paisRepository.js';
import { BadRequestError, ServiceUnavailableError } from '../../api/errors.js';

const agent = new https.Agent({ rejectUnauthorized: process.env.NODE_ENV === 'production' });

export default class feriadosService {
    constructor({ paises = new paisRepository(), httpClient = axios } = {}) {
        this.paisRepository = paises;
        this.httpClient = httpClient;
    }

    getSupportedCountries = async () => {
        const countries = await this.paisRepository.getAllAsync();
        return Object.fromEntries(
            countries.filter(country => country.codigo)
                .map(country => [country.ID, country.nombre]),
        );
    };

    validateCountryCode = async (countryCode) => {
        const code = String(countryCode || '').trim().toUpperCase();
        if (!/^[A-Z]{2}$/.test(code)) throw new BadRequestError('Código de país inválido');

        const countries = await this.paisRepository.getAllAsync();
        if (!countries.some(country => String(country.codigo || '').toUpperCase() === code)) {
            throw new BadRequestError('País no soportado');
        }
        return code;
    };

    validateYear = (year) => {
        const yearNumber = Number(year);
        if (!Number.isInteger(yearNumber) || yearNumber < 1900 || yearNumber > 2100) {
            throw new BadRequestError('Año inválido');
        }
        return yearNumber;
    };

    getPublicHolidaysAsync = async (countryCode, year) => {
        const [code, yearNumber] = await Promise.all([
            this.validateCountryCode(countryCode),
            Promise.resolve(this.validateYear(year)),
        ]);

        try {
            const response = await this.httpClient.get(
                `https://date.nager.at/api/v3/PublicHolidays/${yearNumber}/${code}`,
                { httpsAgent: agent, timeout: 5000 },
            );
            if (!Array.isArray(response.data)) {
                throw new Error('Invalid holiday provider response');
            }
            return response.data.map(item => ({
                date: item.date,
                localName: item.localName,
                name: item.name,
                countryCode: item.countryCode,
                global: item.global,
            }));
        } catch (error) {
            if (error?.name === 'BadRequestError') throw error;
            throw new ServiceUnavailableError('Servicio de feriados temporalmente no disponible', {
                internalMessage: error?.message,
                cause: error,
            });
        }
    };
}
