import { BadRequestError } from '../../api/errors.js';
import {
    getLanguageCatalog,
    getTagId,
    getTagValue,
    getTranslationMaps,
    resolveLanguage,
} from '../../idiomas/index.js';

/**
 * Resuelve traducciones desde el catálogo local.
 *
 * Las rutas de traducción ya no dependen de MyMemory ni de la tabla
 * Traduccion: el frontend envía un tagId (o una clave antigua) y el valor se
 * obtiene directamente del archivo del idioma seleccionado.
 */
export default class traduccionService {
    getTraduccionesPorIdiomaAsync = async (languageReference) => {
        const result = getTranslationMaps(languageReference);
        if (!result) throw new BadRequestError('Solicitud no válida');
        return result;
    };

    getTodasLasTraduccionesAsync = async () => {
        const languages = ['es', 'en', 'fr', 'it', 'pt', 'ko', 'zh', 'he'];
        return Object.fromEntries(languages.map(codigo => [
            codigo,
            getTranslationMaps(codigo),
        ]));
    };

    async translateTextAsync(text, targetLanguage, sourceLanguage = 'auto') {
        const language = resolveLanguage(targetLanguage);
        if (!language) throw new BadRequestError('Solicitud no válida');

        const isObject = text && typeof text === 'object';
        const originalText = isObject
            ? (text.text ?? text.tag ?? text.tagId ?? text.id ?? '')
            : text;
        const explicitTag = isObject ? (text.tagId ?? text.id ?? text.tag ?? null) : null;
        const tagId = getTagId(explicitTag ?? originalText);
        const translatedText = tagId
            ? getTagValue(language, tagId)
            : String(originalText ?? '');

        return {
            text: originalText,
            tagId,
            targetLanguage: language.codigoIdioma,
            targetLanguageId: language.id,
            sourceLanguage,
            translatedText,
            cached: true,
            source: 'catalogo-local',
            error: null,
        };
    }

    async translateBatchAsync(texts, targetLanguage, sourceLanguage = 'auto') {
        const values = Array.isArray(texts) ? texts : [texts];
        return Promise.all(values.map(value => (
            this.translateTextAsync(value, targetLanguage, sourceLanguage)
        )));
    }

    getCatalogoIdioma(languageReference) {
        const catalog = getLanguageCatalog(languageReference);
        if (!catalog) throw new BadRequestError('Solicitud no válida');
        return catalog;
    }

    getTagIdioma(languageReference, tagReference) {
        const catalog = this.getCatalogoIdioma(languageReference);
        const tagId = getTagId(tagReference);
        const tag = catalog.tags.find(item => item.id === tagId);
        if (!tag) throw new BadRequestError('Solicitud no válida');
        return {
            idiomaId: catalog.idiomaId,
            codigoIdioma: catalog.codigoIdioma,
            tag: {
                id: tag.id,
                tagId: tag.id,
                clave: tag.clave,
                valor: tag.valor,
            },
        };
    }
}
