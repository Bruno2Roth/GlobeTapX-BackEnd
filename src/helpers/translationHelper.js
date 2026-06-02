/**
 * Translation Helper
 *
 * Este helper se usa para obtener traducciones estáticas desde el archivo
 * de locales y para validar/normalizar códigos de idioma.
 */

import { translations, supportedLanguages, languageCodeMap } from '../locales/translations.js';

export default class translationHelper {
    constructor() {
        // Carga las traducciones estáticas definidas en locales/translations.js
        this.translations = translations;
    }

    translate(key, language = 'es') {
        // Devuelve la traducción de una clave para el idioma indicado.
        // Si no existe el idioma, retorna el texto en inglés si está disponible.
        const lang = language || 'es';

        if (!this.translations[lang]) {
            return this.translations.en[key] || key;
        }

        const translated = this.translations[lang][key];
        if (!translated) {
            return this.translations.en[key] || key;
        }

        return translated;
    }

    t(key, language = 'es') {
        // Alias corto para translate().
        return this.translate(key, language);
    }

    getAllTranslationsForLanguage(language) {
        // Devuelve todas las traducciones disponibles para un idioma.
        // Si no está definido, devuelve el conjunto en inglés.
        return this.translations[language] || this.translations.en;
    }

    getSupportedLanguages() {
        // Devuelve el listado de idiomas que soporta la aplicación.
        return supportedLanguages;
    }

    isValidLanguageCode(languageCode) {
        // Valida si un código de idioma está soportado.
        return !!supportedLanguages[languageCode];
    }

    normalizeLanguageCode(languageCode) {
        // Normaliza códigos como "en-US" o "es-ES" a su forma base.
        if (!languageCode || typeof languageCode !== 'string') {
            return 'en';
        }

        const normalized = languageCodeMap[languageCode];
        if (normalized) {
            return normalized;
        }

        const base = languageCode.split('-')[0];
        return languageCodeMap[base] || 'en';
    }
}
