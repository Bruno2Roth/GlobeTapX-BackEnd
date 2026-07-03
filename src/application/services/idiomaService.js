import paisService from './paisService.js';
import traduccionRepository from '../../data/repositories/traduccionRepository.js';

export default class idiomaService {
    constructor() {
        console.log('Estoy en: idiomaService.constructor()');
        this.paisService = new paisService();
        this.traduccionRepo = new traduccionRepository();
    }

    getIdiomasSoportadosAsync = async () => {
        const paises = await this.paisService.getAllAsync();

        const idiomas = {};

        for (const pais of paises) {
            const codigo = this.getLanguageCodeForCountry(pais.nombre);

            if (!idiomas[codigo]) {
                idiomas[codigo] = {
                    name: pais.nombre
                };
            }
        }

        return idiomas;
    }

    getTraduccionesPorIdiomaAsync = async (codigoIdioma) => {
        const rows = await this.traduccionRepo.getTraduccionesPorIdiomaAsync(codigoIdioma);

        const result = {};

        for (const row of rows) {
            result[row.clave] = row.valor;
        }

        return result;
    }

    getTodasLasTraduccionesAsync = async () => {
        const rows = await this.traduccionRepo.getTodasLasTraduccionesAsync();

        const result = {};

        for (const row of rows) {
            if (!result[row.codigoIdioma]) {
                result[row.codigoIdioma] = {};
            }

            result[row.codigoIdioma][row.clave] = row.valor;
        }

        return result;
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