import axios from 'axios';
import https from 'https';
import agendaUsuarioRepository from '../../data/repositories/agendaUsuarioRepository.js';
import usuariosRepository from '../../data/repositories/usuariosRepository.js';
import paisRepository from '../../data/repositories/paisRepository.js';

const agent = new https.Agent({ rejectUnauthorized: process.env.NODE_ENV === 'production' });

export default class agendaUsuarioService {
    constructor() {
        console.log('Estoy en: agendaUsuarioService.constructor()');
        this.agendaUsuarioRepository = new agendaUsuarioRepository();
        this.usuariosRepository = new usuariosRepository();
        this.paisRepository = new paisRepository();
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

    getSupportedCountries = async () => {
        const paises = await this.paisRepository.getAllAsync();
        const result = {};
        for (const p of paises) {
            if (p.codigo) {
                result[p.ID] = p.nombre;
            }
        }
        return result;
    }

    validateCountryCode = async (countryCode) => {
        const code = String(countryCode).toUpperCase().trim();
        const paises = await this.paisRepository.getAllAsync();
        const valido = paises.some(p => p.codigo && p.codigo.toUpperCase() === code);
        if (!valido) {
            const disponibles = paises.filter(p => p.codigo).map(p => p.codigo).join(', ');
            throw new Error(`País no soportado: ${countryCode}. Países disponibles: ${disponibles}`);
        }
        return code;
    }

    validateYear = (year) => {
        const yearNum = Number(year);
        if (!Number.isInteger(yearNum) || yearNum < 1900 || yearNum > 2100) {
            throw new Error(`Año inválido: ${year}. Debe ser un número entre 1900 y 2100`);
        }
        return yearNum;
    }

    getPublicHolidaysAsync = async (countryCode, year) => {
        const code = await this.validateCountryCode(countryCode);
        const yearNum = this.validateYear(year);

        let data;
        try {
            const url = `https://date.nager.at/api/v3/PublicHolidays/${yearNum}/${code}`;
            const response = await axios.get(url, { httpsAgent: agent });
            data = response.data;
        } catch (error) {
            if (error.response) {
                const status = error.response.status;
                if (status === 404) {
                    throw new Error(`No se encontraron feriados para ${code} en el año ${yearNum}`);
                }
                throw new Error(`Error de la API externa (${status}): ${error.response.data?.title || 'Error al obtener feriados'}`);
            }
            throw new Error(`Error de conexión con la API de feriados: ${error.message}`);
        }

        if (!Array.isArray(data) || data.length === 0) {
            throw new Error(`No se encontraron feriados para ${code} en el año ${yearNum}`);
        }

        return data.map(item => ({
            date: item.date,
            localName: item.localName,
            name: item.name,
            countryCode: item.countryCode,
            global: item.global
        }));
    }

    getAgendaConFeriadosAsync = async (userId) => {
        const agenda = await this.agendaUsuarioRepository.getAgendaConDetallesByUsuarioAsync(userId);

        const usuario = await this.usuariosRepository.getByIdAsync(userId);
        const paisactual = usuario?.paisactual ? Number(usuario.paisactual) : null;

        const feriados = {};
        const anioActual = new Date().getFullYear();
        if (paisactual) {
            const pais = await this.paisRepository.getByIdAsync(paisactual);
            if (pais?.codigo) {
                try {
                    feriados[paisactual] = await this.getPublicHolidaysAsync(pais.codigo, anioActual);
                } catch (error) {
                    feriados[paisactual] = { error: error.message };
                }
            }
        }

        return { agenda, feriados };
    }
}