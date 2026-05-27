/**
 * MyMemory Translation Helper
 * Traduce texto usando la API gratuita de MyMemory.
 */

import axios from 'axios';

export default class mymemoryTranslationHelper {
    constructor() {
        this.cache = new Map();
        this.apiBase = 'https://api.mymemory.translated.net/get';
    }

    getCacheKey(text, sourceLanguage, targetLanguage) {
        return `${text}::${sourceLanguage}::${targetLanguage}`;
    }

    async translateTextAsync(text, targetLanguage, sourceLanguage = 'auto') {
        const cleanText = String(text || '').trim();
        const target = String(targetLanguage || 'en').trim();
        const source = String(sourceLanguage || 'auto').trim();

        if (!cleanText) {
            return { translatedText: '', cached: false };
        }

        if (target.toLowerCase() === 'auto') {
            return { translatedText: cleanText, cached: false };
        }

        const cacheKey = this.getCacheKey(cleanText, source, target);
        if (this.cache.has(cacheKey)) {
            return { translatedText: this.cache.get(cacheKey), cached: true };
        }

        const url = `${this.apiBase}?q=${encodeURIComponent(cleanText)}&langpair=${encodeURIComponent(source)}|${encodeURIComponent(target)}`;

        try {
            const response = await axios.get(url, { timeout: 10000 });
            const body = response.data;

            if (body && body.responseData && typeof body.responseData.translatedText === 'string') {
                const translated = body.responseData.translatedText;
                this.cache.set(cacheKey, translated);
                return { translatedText: translated, cached: false };
            }

            if (target !== 'en') {
                const englishFallback = await this.translateTextAsync(cleanText, 'en', source);
                const fallbackText = englishFallback.translatedText || cleanText;
                this.cache.set(cacheKey, fallbackText);
                return { translatedText: fallbackText, cached: false };
            }

            const fallback = cleanText;
            this.cache.set(cacheKey, fallback);
            return { translatedText: fallback, cached: false };
        } catch (error) {
            if (target !== 'en') {
                const englishFallback = await this.translateTextAsync(cleanText, 'en', source);
                const fallbackText = englishFallback.translatedText || cleanText;
                this.cache.set(cacheKey, fallbackText);
                return { translatedText: fallbackText, cached: englishFallback.cached, error: error.message };
            }

            const fallback = cleanText;
            this.cache.set(cacheKey, fallback);
            return { translatedText: fallback, cached: false, error: error.message };
        }
    }

    async translateBatchAsync(items, targetLanguage, sourceLanguage = 'auto') {
        const results = [];
        for (const text of items) {
            const translated = await this.translateTextAsync(text, targetLanguage, sourceLanguage);
            results.push({ text, translatedText: translated.translatedText, cached: translated.cached, error: translated.error });
        }
        return results;
    }
}
