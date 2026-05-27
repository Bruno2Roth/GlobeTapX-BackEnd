/**
 * Helper de frontend para traducir automáticamente la página.
 * Mantiene la preferencia en localStorage y usa data-translate.
 */

const STORAGE_KEY = 'preferredLanguage';

export function getPreferredLanguage() {
    return localStorage.getItem(STORAGE_KEY) || 'es';
}

export function setPreferredLanguage(language) {
    localStorage.setItem(STORAGE_KEY, language);
}

export async function translatePage(targetLanguage) {
    if (!targetLanguage) {
        targetLanguage = getPreferredLanguage();
    }

    const elements = document.querySelectorAll('[data-translate]');
    const texts = Array.from(elements)
        .map(el => el.dataset.translate && el.dataset.translate.toString().trim())
        .filter(Boolean);

    const uniqueTexts = [...new Set(texts)];
    const response = await fetch('/api/traduccion/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            texts: uniqueTexts,
            targetLanguage,
            sourceLanguage: 'auto'
        })
    });

    const payload = await response.json();
    if (!payload.success) {
        console.warn('No se pudieron traducir los textos:', payload.error);
        return;
    }

    const translatedMap = {};
    payload.data.forEach(item => {
        translatedMap[item.text] = item.translatedText;
    });

    elements.forEach(el => {
        const key = el.dataset.translate && el.dataset.translate.toString().trim();
        const translated = translatedMap[key] || key;
        if (el.placeholder !== undefined && el.placeholder !== '') {
            el.placeholder = translated;
        }
        if (el.innerText !== undefined) {
            el.innerText = translated;
        }
    });
}

export function initLanguageSelector(selectorId, callback) {
    const select = document.getElementById(selectorId);
    if (!select) return;

    select.value = getPreferredLanguage();
    select.addEventListener('change', async (event) => {
        const language = event.target.value;
        setPreferredLanguage(language);
        await translatePage(language);
        if (typeof callback === 'function') {
            callback(language);
        }
    });
}
