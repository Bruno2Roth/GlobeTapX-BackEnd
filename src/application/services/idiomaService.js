import paisService from './paisService.js';
import translationHelper from '../../helpers/translationHelper.js';

export default class idiomaService {
    constructor() {
        console.log('Estoy en: idiomaService.constructor()');
        this.paisService = new paisService();
        this.translator = new translationHelper();
    }

    // Servicio para obtener idioma por país, usando la tabla Pais como fuente.

    async getIdiomaByCountryAsync({ paisId, nombre }) {
        console.log(`idiomaService.getIdiomaByCountryAsync(${paisId}, ${nombre})`);

        if (!paisId && !nombre) {
            throw new Error('paisId o nombre de país son requeridos');
        }

        let pais;

        if (paisId) {
            pais = await this.paisService.getByIdAsync(paisId);
        }

        if (!pais && nombre) {
            pais = await this.paisService.getByNameAsync(nombre);
        }

        if (!pais) {
            throw new Error('País no encontrado');
        }

        const codigoIdioma = this.getLanguageCodeForCountry(pais.nombre || pais.descripcion || nombre);
        const supported = this.translator.getSupportedLanguages();

        return {
            paisId: pais.ID || paisId,
            nombrePais: pais.nombre || pais.descripcion || null,
            idioma: {
                codigoIdioma,
                nombreIdioma: supported[codigoIdioma]?.name || supported.en.name,
                origen: 'pais',
                source: 'DB'
            }
        };
    }

    getLanguageCodeForCountry(countryName) {
        if (!countryName || typeof countryName !== 'string') {
            return 'en';
        }

        const normalized = countryName.trim().toLowerCase();

        const map = {
            argentina: 'es',
            mexico: 'es',
            colombia: 'es',
            peru: 'es',
            chile: 'es',
            españa: 'es',
            espana: 'es',
            spain: 'es',
            brazil: 'pt',
            brasil: 'pt',
            portugal: 'pt',
            usa: 'en',
            uk: 'en',
            england: 'en',
            australia: 'en',
            canada: 'en',
            france: 'fr',
            italy: 'it',
            italian: 'it',
            korea: 'ko',
            'south korea': 'ko',
            china: 'zh',
            israel: 'he'
        };

        for (const key of Object.keys(map)) {
            if (normalized.includes(key)) {
                return map[key];
            }
        }

        return 'en';
    }
}
