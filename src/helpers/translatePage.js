/**
 * Helper de frontend para traducir automáticamente la página.
 *
 * Este helper solo debe utilizarse en el navegador, porque accede a
 * localStorage y a elementos DOM con `data-translate-id` (preferido) o
 * `data-translate` (compatibilidad).
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

    const elements = document.querySelectorAll('[data-translate-id], [data-translate]');
    const items = Array.from(elements).map((element) => {
        const rawTagId = element.dataset.translateId;
        const tagId = rawTagId && /^\d+$/.test(rawTagId.trim()) ? Number(rawTagId) : null;
        const text = element.dataset.translate && element.dataset.translate.toString().trim();
        return { element, tagId, text: text || tagId };
    }).filter(item => item.text !== null && item.text !== undefined && item.text !== '');

    const texts = items.map(item => item.tagId
        ? { tagId: item.tagId, text: item.text }
        : item.text);

    // Recopila los textos únicos que se deben traducir.

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
            texts,
            targetLanguage,
            sourceLanguage: 'es'
        })
    });

    const payload = await response.json();
    if (!response.ok || !payload.success) {
        console.warn('No se pudieron obtener los textos:', payload.message);
        return;
    }

    const translatedMap = {};
    payload.data.forEach(item => {
        if (item.tagId) translatedMap[`tag:${item.tagId}`] = item.translatedText;
        translatedMap[String(item.text)] = item.translatedText;
    });

    // Reemplaza en el DOM cada texto traducido.

    items.forEach(({ element: el, tagId, text }) => {
        const translated = (tagId && translatedMap[`tag:${tagId}`])
            || translatedMap[String(text)]
            || text;
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
