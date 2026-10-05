import usuariosRepository from '../../data/repositories/usuariosRepository.js';
import { BadRequestError } from '../../api/errors.js';
import { getLanguageCode, resolveLanguage, resolveLanguageForWrite } from '../../idiomas/index.js';

export default class usuarioLanguageService {
    constructor({ repository = new usuariosRepository() } = {}) {
        this.usuariosRepository = repository;
    }

    getPreferredLanguageCodeAsync = async (usuarioId) => {
        const id = Number(usuarioId);
        if (!Number.isInteger(id) || id <= 0) throw new BadRequestError('Solicitud no válida');

        const record = await this.usuariosRepository.getPreferredLanguageRecordAsync(id);
        if (!record) throw new BadRequestError('Solicitud no válida');
        return getLanguageCode(record.codigoIdioma) || 'es';
    };

    getIdiomaPreferidoConFallbackAsync = async (usuarioId, detectedLanguage = null) => {
        const id = Number(usuarioId);
        if (!Number.isInteger(id) || id <= 0) throw new BadRequestError('Solicitud no válida');

        const record = await this.usuariosRepository.getPreferredLanguageRecordAsync(id);
        if (!record) throw new Error('Usuario no encontrado');

        const storedLanguage = record.codigoIdioma ? resolveLanguage(record.codigoIdioma) : null;
        const detected = resolveLanguage(detectedLanguage);
        const selected = storedLanguage || detected || resolveLanguage('es');
        return {
            usuarioId: id,
            idiomaId: selected.id,
            codigoIdioma: selected.codigoIdioma,
            nombreIdioma: selected.nombre,
            nombreNativo: selected.nombreNativo,
            origen: storedLanguage ? 'guardado' : detected ? 'detectado' : 'predeterminado',
        };
    };

    cambiarIdiomaAsync = async (usuarioId, codigoIdioma, idiomaId = null) => {
        const id = Number(usuarioId);
        const language = resolveLanguageForWrite(idiomaId ?? codigoIdioma);

        if (!Number.isInteger(id) || id <= 0 || !language) {
            throw new BadRequestError('Solicitud no válida');
        }

        const rowsAffected = await this.usuariosRepository.updateIdiomaPreferidoAsync(id, language.id);
        if (rowsAffected < 1) throw new BadRequestError('Solicitud no válida');

        return {
            success: true,
            idiomaId: language.id,
            codigoIdioma: language.codigoIdioma,
        };
    };
}
