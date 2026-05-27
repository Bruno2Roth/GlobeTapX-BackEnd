/**
 * Translation Helper
 * Traducciones estáticas y gestión de idiomas soportados.
 */

import { translations, supportedLanguages, languageCodeMap } from '../locales/translations.js';

export default class translationHelper {
    constructor() {
        this.translations = translations;
    }

    translate(key, language = 'es') {
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
        return this.translate(key, language);
    }

    getAllTranslationsForLanguage(language) {
        return this.translations[language] || this.translations.en;
    }

    getSupportedLanguages() {
        return supportedLanguages;
    }

    isValidLanguageCode(languageCode) {
        return !!supportedLanguages[languageCode];
    }

    normalizeLanguageCode(languageCode) {
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
