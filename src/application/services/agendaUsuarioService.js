import axios from 'axios';
import https from 'https';
import agendaUsuarioRepository from '../../data/repositories/agendaUsuarioRepository.js';
import usuariosRepository from '../../data/repositories/usuariosRepository.js';

const agent = new https.Agent({ rejectUnauthorized: process.env.NODE_ENV === 'production' });

const paisIdToCode = {
  1: "AR", 2: "AU", 3: "US", 4: "BR", 5: "GB", 6: "FR",
  7: "IL", 8: "KR", 9: "CN", 10: "IT", 11: "ES", 12: "CL"
};

const paisIdToNombre = {
  1: "Argentina", 2: "Australia", 3: "Estados Unidos", 4: "Brasil",
  5: "Inglaterra", 6: "Francia", 7: "Israel", 8: "Corea del Sur",
  9: "China", 10: "Italia", 11: "España", 12: "Chile"
};

const supportedCountryCodes = Object.values(paisIdToCode);

const codeToPaisId = Object.fromEntries(
  Object.entries(paisIdToCode).map(([id, code]) => [code, Number(id)])
);

export default class agendaUsuarioService {
    constructor() {
        console.log('Estoy en: agendaUsuarioService.constructor()');
        this.agendaUsuarioRepository = new agendaUsuarioRepository();
        this.usuariosRepository = new usuariosRepository();
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

    getSupportedCountries = () => {
        return paisIdToNombre;
    }

    validateCountryCode = (countryCode) => {
        const code = String(countryCode).toUpperCase().trim();
        if (!supportedCountryCodes.includes(code)) {
            const supported = supportedCountryCodes.join(', ');
            throw new Error(`País no soportado: ${countryCode}. Países disponibles: ${supported}`);
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
        const code = this.validateCountryCode(countryCode);
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
        const paisactual = usuario?.paisactual || null;

        const paisesIds = new Set();
        if (paisactual) {
            paisesIds.add(Number(paisactual));
        }
        if (agenda && agenda.length > 0) {
            for (const item of agenda) {
                if (item.IDPais) {
                    paisesIds.add(Number(item.IDPais));
                }
            }
        }

        const feriados = {};
        const anioActual = new Date().getFullYear();
        for (const paisId of paisesIds) {
            const paisCode = paisIdToCode[paisId];
            if (paisCode) {
                try {
                    feriados[paisId] = await this.getPublicHolidaysAsync(paisCode, anioActual);
                } catch (error) {
                    feriados[paisId] = { error: error.message };
                }
            }
        }

        return { agenda, feriados };
    }
}