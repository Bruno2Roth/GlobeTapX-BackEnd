import paisService from './paisService.js';
import {
    getLanguageByCode,
    getSupportedLanguages,
} from '../../idiomas/index.js';

export default class idiomaService {
    constructor() {
        console.log('Estoy en: idiomaService.constructor()');
        this.paisService = new paisService();
    }

    getIdiomasSoportadosAsync = async () => {
        // La lista es estática y no necesita una lectura de usuarios ni una
        // llamada a un proveedor de traducción.
        return getSupportedLanguages();
    }

    async getIdiomaByCountryAsync({ paisId, nombre }) {
        let pais = null;

        if (paisId) {
            pais = await this.paisService.getByIdAsync(paisId);
        }

        if (!pais && nombre) {
            pais = await this.paisService.getByNameAsync(nombre);
        }

        if (!pais) {
            throw new Error('País no encontrado');
        }

        const codigoIdioma = this.getLanguageCodeForCountry(pais.nombre);
        const idiomaInfo = getLanguageByCode(codigoIdioma);

        return {
            paisId: pais.ID,
            nombrePais: pais.nombre,
            idioma: {
                idiomaId: idiomaInfo?.id || null,
                codigoIdioma,
                nombreIdioma: idiomaInfo?.nombre || codigoIdioma,
                nombreNativo: idiomaInfo?.nombreNativo || codigoIdioma,
                origen: 'pais',
                source: 'DB'
            }
        };
    }

    getLanguageCodeForCountry(countryName) {
        if (!countryName) return 'en';

        const normalized = countryName.toLowerCase();

        const map = {
            argentina: 'es',
            mexico: 'es',
            colombia: 'es',
            peru: 'es',
            chile: 'es',
            españa: 'es',
            espana: 'es',
            brazil: 'pt',
            brasil: 'pt',
            portugal: 'pt',
            usa: 'en',
            'united states': 'en',
            england: 'en',
            australia: 'en',
            canada: 'en',
            france: 'fr',
            italy: 'it',
            china: 'zh',
            israel: 'he',
            'south korea': 'ko',
            'corea del sur': 'ko'
        };

        return map[normalized] || 'en';
    }
}
