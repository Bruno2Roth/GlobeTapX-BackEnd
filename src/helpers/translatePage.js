/**
 * Helper de frontend para traducir automáticamente la página.
 *
 * Este helper solo debe utilizarse en el navegador, porque accede a
 * localStorage y a elementos DOM con el atributo `data-translate`.
 */

const STORAGE_KEY = 'preferredLanguage';

function normalizeLanguage(language) {
    const value = String(language || 'es').trim().toLowerCase();
    return value.split(/[-_]/)[0] || 'es';
}

export function getPreferredLanguage() {
    // Lee el idioma preferido guardado en localStorage.
    return normalizeLanguage(localStorage.getItem(STORAGE_KEY));
}

export function setPreferredLanguage(language) {
    // Guarda el idioma seleccionado por el usuario.
    localStorage.setItem(STORAGE_KEY, normalizeLanguage(language));
}

export async function translatePage(targetLanguage) {
    targetLanguage = normalizeLanguage(targetLanguage || getPreferredLanguage());

    const elements = document.querySelectorAll('[data-translate]');
    const texts = Array.from(elements)
        .map(el => el.dataset.translate && el.dataset.translate.toString().trim())
        .filter(Boolean);

    // Recopila los textos únicos que se deben traducir.

    const uniqueTexts = [...new Set(texts)];

    if (targetLanguage === 'es') {
        elements.forEach((el) => {
            const originalText = el.dataset.translate.toString().trim();
            if (el.placeholder !== undefined && el.placeholder !== '') {
                el.placeholder = originalText;
            }
            if (el.innerText !== undefined) {
                el.innerText = originalText;
            }
        });
        return;
    }

    const response = await fetch('/api/traduccion/batch', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(localStorage.getItem('token')
                ? { Authorization: `Bearer ${localStorage.getItem('token')}` }
                : {})
        },
        credentials: 'same-origin',
        body: JSON.stringify({
            texts: uniqueTexts,
            targetLanguage,
            sourceLanguage: 'es'
        })
    });

    const payload = await response.json();
    if (!response.ok || !payload.success) {
        console.warn('No se pudieron traducir los textos:', payload.error);
        return;
    }

    const translatedMap = {};
    payload.data.forEach(item => {
        translatedMap[item.text] = item.translatedText;
    });

    // Reemplaza en el DOM cada texto traducido.

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
    // Inicializa un selector HTML de idioma y dispara la traducción al cambiar.
    const select = document.getElementById(selectorId);
    if (!select) return;

    const preferredLanguage = normalizeLanguage(getPreferredLanguage());
    select.value = preferredLanguage;

    // Aplica el idioma guardado también al cargar o volver a la página.
    translatePage(preferredLanguage).catch((error) => {
        console.warn('No se pudo aplicar el idioma preferido:', error);
    });

    select.addEventListener('change', async (event) => {
        const language = normalizeLanguage(event.target.value);
        setPreferredLanguage(language);
        await translatePage(language);
        if (typeof callback === 'function') {
            callback(language);
        }
    });
}
