/**
 * Servicio de traducción dinámico
 * Usa MyMemory API y cache local para evitar peticiones repetidas.
 */


export default class traduccionService {
    constructor() {
        console.log('Estoy en: traduccionService.constructor()');
    }

    async translateTextAsync(text, targetLanguage, sourceLanguage = 'auto') {
        const result = await this.translator.translateTextAsync(text, targetLanguage, sourceLanguage);
        return {
            text,
            targetLanguage,
            sourceLanguage,
            translatedText: result.translatedText,
            cached: result.cached,
            error: result.error || null
        };
    }

    async translateBatchAsync(texts, targetLanguage, sourceLanguage = 'auto') {
        if (!Array.isArray(texts)) {
            texts = [texts];
        }

        const translated = await this.translator.translateBatchAsync(texts, targetLanguage, sourceLanguage);
        return translated.map(item => ({
            text: item.text,
            translatedText: item.translatedText,
            cached: item.cached,
            error: item.error || null,
            targetLanguage,
            sourceLanguage
        }));
    }
}
