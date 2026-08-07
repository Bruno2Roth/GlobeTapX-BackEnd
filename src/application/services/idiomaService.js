import paisService from './paisService.js';
import idiomaRepository from '../../data/repositories/idiomaRepository.js';

export default class idiomaService {
    constructor() {
        console.log('Estoy en: idiomaService.constructor()');
        this.paisService = new paisService();
        this.idiomaRepository = new idiomaRepository();
    }

    getIdiomasSoportadosAsync = async () => {
        const rows = await this.idiomaRepository.getIdiomasSoportadosAsync();
        const nombres = {
            es: 'Español',
            en: 'Inglés',
            fr: 'Francés',
            it: 'Italiano',
            pt: 'Portugués',
            ko: 'Coreano',
            zh: 'Chino',
            he: 'Hebreo'
        };

        const idiomas = {};

        for (const row of rows) {
            const codigo = row.codigo;
            if (codigo) {
                idiomas[codigo] = {
                    name: nombres[codigo] || codigo
                };
            }
        }

        return idiomas;
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

        return {
            paisId: pais.ID,
            nombrePais: pais.nombre,
            idioma: {
                codigoIdioma,
                nombreIdioma: pais.nombre,
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
