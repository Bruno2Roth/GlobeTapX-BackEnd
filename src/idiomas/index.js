import es from './es.js';
import en from './en.js';
import fr from './fr.js';
import it from './it.js';
import pt from './pt.js';
import ko from './ko.js';
import zh from './zh.js';
import he from './he.js';
import {
    TAG_DEFINITIONS,
    TAG_ID_BY_KEY,
    TAG_KEY_BY_ID,
} from './tags.js';

export const IDIOMAS = Object.freeze([es, en, fr, it, pt, ko, zh, he]);
export const SUPPORTED_LANGUAGE_CODES = Object.freeze(
    IDIOMAS.map(idioma => idioma.codigoIdioma),
);

const LANGUAGES_BY_ID = new Map(IDIOMAS.map(idioma => [idioma.id, idioma]));
const LANGUAGES_BY_CODE = new Map(IDIOMAS.map(idioma => [idioma.codigoIdioma, idioma]));

const normalizeCode = value => String(value || '')
    .trim()
    .toLowerCase()
    .split(/[-_,]/)[0];

const numericId = value => {
    if (typeof value === 'number') return Number.isInteger(value) ? value : null;
    if (typeof value !== 'string' || !/^\d+$/.test(value.trim())) return null;
    const id = Number(value.trim());
    return Number.isInteger(id) ? id : null;
};

/** Resuelve un código legado, un ID numérico o un objeto de idioma. */
export const resolveLanguage = (value, fallback = null) => {
    if (value && typeof value === 'object') {
        const objectId = value.id ?? value.idiomaId;
        const objectLanguage = resolveLanguage(objectId);
        if (objectLanguage) return objectLanguage;
        return resolveLanguage(value.codigoIdioma ?? value.codigo ?? value.code, fallback);
    }

    const id = numericId(value);
    if (id !== null && LANGUAGES_BY_ID.has(id)) return LANGUAGES_BY_ID.get(id);

    const code = normalizeCode(value);
    if (LANGUAGES_BY_CODE.has(code)) return LANGUAGES_BY_CODE.get(code);

    if (fallback === null || fallback === undefined) return null;
    if (fallback === value) return null;
    return resolveLanguage(fallback);
};

export const getLanguageById = id => resolveLanguage(id);
export const getLanguageByCode = code => resolveLanguage(code);
export const getLanguageId = value => resolveLanguage(value)?.id ?? null;
export const getLanguageCode = value => resolveLanguage(value)?.codigoIdioma ?? null;
export const isSupportedLanguage = value => Boolean(resolveLanguage(value));

/**
 * Resuelve valores recibidos para guardar preferencia. Acepta solo un código
 * exacto (es/en/...) o un ID; no convierte `en-US` silenciosamente.
 */
export const resolveLanguageForWrite = (value) => {
    if (typeof value === 'number' || (typeof value === 'string' && /^\d+$/.test(value.trim()))) {
        return resolveLanguage(value);
    }
    if (typeof value !== 'string') return null;
    return LANGUAGES_BY_CODE.get(value.trim().toLowerCase()) || null;
};

export const getSupportedLanguages = () => IDIOMAS.map(idioma => ({
    id: idioma.id,
    idiomaId: idioma.id,
    codigoIdioma: idioma.codigoIdioma,
    nombre: idioma.nombre,
    nombreNativo: idioma.nombreNativo,
}));

export const getTagId = (reference) => {
    if (typeof reference === 'number' && Number.isInteger(reference) && TAG_KEY_BY_ID[String(reference)]) {
        return reference;
    }

    if (typeof reference === 'string') {
        const value = reference.trim();
        if (/^\d+$/.test(value) && TAG_KEY_BY_ID[value]) return Number(value);
        if (TAG_ID_BY_KEY[value]) return TAG_ID_BY_KEY[value];
        const normalized = value.toLowerCase();
        const keyMatch = TAG_DEFINITIONS.find(tag => tag.clave.toLowerCase() === normalized);
        if (keyMatch) return keyMatch.id;

        for (const idioma of IDIOMAS) {
            const matchingTag = Object.entries(idioma.tags)
                .find(([, text]) => String(text).trim().toLowerCase() === normalized);
            if (matchingTag) return Number(matchingTag[0]);
        }
    }

    return null;
};

export const getTagValue = (languageReference, tagReference) => {
    const idioma = resolveLanguage(languageReference);
    const tagId = getTagId(tagReference);
    if (!idioma || !tagId) return null;
    return idioma.tags[tagId] ?? null;
};

export const getTag = (languageReference, tagReference) => {
    const idioma = resolveLanguage(languageReference);
    const tagId = getTagId(tagReference);
    if (!idioma || !tagId) return null;

    return {
        id: tagId,
        tagId,
        clave: TAG_KEY_BY_ID[String(tagId)],
        valor: idioma.tags[tagId] ?? null,
    };
};

export const getLanguageCatalog = (languageReference) => {
    const idioma = resolveLanguage(languageReference);
    if (!idioma) return null;

    return {
        id: idioma.id,
        idiomaId: idioma.id,
        codigoIdioma: idioma.codigoIdioma,
        nombre: idioma.nombre,
        nombreNativo: idioma.nombreNativo,
        tags: TAG_DEFINITIONS.map(tag => ({
            id: tag.id,
            tagId: tag.id,
            clave: tag.clave,
            valor: idioma.tags[tag.id] ?? null,
        })),
    };
};

export const getTranslationMaps = (languageReference) => {
    const catalog = getLanguageCatalog(languageReference);
    if (!catalog) return null;

    return {
        idiomaId: catalog.idiomaId,
        codigoIdioma: catalog.codigoIdioma,
        tags: Object.fromEntries(catalog.tags.map(tag => [String(tag.id), tag.valor])),
        byKey: Object.fromEntries(catalog.tags.map(tag => [tag.clave, tag.valor])),
    };
};

export const getTagDefinitions = () => TAG_DEFINITIONS.map(tag => ({ ...tag }));
