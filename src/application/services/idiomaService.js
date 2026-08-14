import paisService from './paisService.js';
import idiomaRepository from '../../data/repositories/idiomaRepository.js';
import mymemoryTranslationHelper from '../../helpers/mymemoryTranslationHelper.js';

export default class idiomaService {
    constructor() {
        console.log('Estoy en: idiomaService.constructor()');
        this.paisService = new paisService();
        this.idiomaRepository = new idiomaRepository();
        this.translator = new mymemoryTranslationHelper();
    }

    getIdiomasSoportadosAsync = async () => {
        // La lista soportada no puede depender de que ya exista un usuario
        // con ese idioma guardado en la base de datos.
        return this.translator.getSupportedLanguages();
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
        const idiomaInfo = this.translator.getSupportedLanguages()[codigoIdioma];

        return {
            paisId: pais.ID,
            nombrePais: pais.nombre,
            idioma: {
                codigoIdioma,
                nombreIdioma: idiomaInfo?.name || codigoIdioma,
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
