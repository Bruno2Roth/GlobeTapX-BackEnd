/**
 * Helper de frontend para traducir automáticamente la página.
 *
 * Este helper solo debe utilizarse en el navegador, porque accede a
 * localStorage y a elementos DOM con `data-translate-id` (preferido) o
 * `data-translate` (compatibilidad).
 */

const STORAGE_KEY = 'preferredLanguage';
let translationInFlight = false;
let translationScheduled = false;
let translationObserver = null;
let suppressNextMutation = false;

function normalizeLanguage(language) {
    const value = String(language || 'es').trim().toLowerCase();
    return value.split(/[-_]/)[0] || 'es';
}

function setElementValue(element, value) {
    if (!element) return;

    const nextValue = value == null ? '' : String(value);
    const currentValue = element.value ?? element.textContent ?? element.placeholder ?? '';

    if (String(currentValue) === nextValue) return;

    suppressNextMutation = true;

    try {
        if ('value' in element && element.tagName !== 'DIV') {
            element.value = nextValue;
        }
    } catch (_error) {
        // Ignorar errores de escritura en elementos no editables.
    }

    try {
        if (element.placeholder !== undefined) {
            element.placeholder = nextValue;
        }
    } catch (_error) {
        // Ignorar errores de placeholder.
    }

    try {
        if (element.textContent !== undefined) {
            element.textContent = nextValue;
        }
    } catch (_error) {
        // Ignorar errores de textContent.
    }

    try {
        if (element.innerText !== undefined) {
            element.innerText = nextValue;
        }
    } catch (_error) {
        // Ignorar errores de innerText.
    }

    setTimeout(() => {
        suppressNextMutation = false;
    }, 0);
}

function scheduleDocumentTranslations() {
    if (translationInFlight || translationScheduled) return;

    translationScheduled = true;
    setTimeout(() => {
        translationScheduled = false;
        const preferredLanguage = getPreferredLanguage();
        Promise.resolve()
            .then(() => translatePage(preferredLanguage))
            .catch((error) => {
                console.warn('No se pudo aplicar la traducción programada:', error);
            });
    }, 50);
}

function startTranslationObserver() {
    if (!('MutationObserver' in window) || !document.body || translationObserver) return;

    translationObserver = new MutationObserver((mutations) => {
        if (translationInFlight || suppressNextMutation) return;

        const hasRelevantMutation = mutations.some((mutation) => {
            if (mutation.type === 'childList' || mutation.type === 'characterData') return true;
            return mutation.type === 'attributes'
                && ['data-translate-id', 'data-translate', 'placeholder', 'value'].includes(mutation.attributeName);
        });

        if (hasRelevantMutation) {
            scheduleDocumentTranslations();
        }
    });

    translationObserver.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['data-translate-id', 'data-translate', 'placeholder', 'value'],
    });
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
    if (translationInFlight) return;

    translationInFlight = true;
    targetLanguage = normalizeLanguage(targetLanguage || getPreferredLanguage());

    try {
        const elements = document.querySelectorAll('[data-translate-id], [data-translate]');
        const items = Array.from(elements).map((element) => {
            const rawTagId = element.dataset.translateId;
            const tagId = rawTagId && /^\d+$/.test(rawTagId.trim()) ? Number(rawTagId) : null;
            const text = element.dataset.translate && element.dataset.translate.toString().trim();
            return { element, tagId, text: text || tagId };
        }).filter(item => item.text !== null && item.text !== undefined && item.text !== '');

        if (items.length === 0) return;

        const texts = items.map(item => item.tagId
            ? { tagId: item.tagId, text: item.text }
            : item.text);

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

        items.forEach(({ element: el, tagId, text }) => {
            const translated = (tagId && translatedMap[`tag:${tagId}`])
                || translatedMap[String(text)]
                || text;

            if (el.placeholder !== undefined && el.placeholder !== '') {
                setElementValue(el, translated);
                return;
            }

            if (el.innerText !== undefined || el.textContent !== undefined) {
                setElementValue(el, translated);
            }
        });
    } finally {
        translationInFlight = false;
    }
}

export function initLanguageSelector(selectorId, callback) {
    // Inicializa un selector HTML de idioma y dispara la traducción al cambiar.
    const select = document.getElementById(selectorId);
    if (!select) return;

    const preferredLanguage = normalizeLanguage(getPreferredLanguage());
    select.value = preferredLanguage;
    startTranslationObserver();

    Promise.resolve()
        .then(() => translatePage(preferredLanguage))
        .catch((error) => {
            console.warn('No se pudo aplicar el idioma preferido:', error);
        });

    select.addEventListener('change', async (event) => {
        const language = normalizeLanguage(event.target.value);
        setPreferredLanguage(language);

        try {
            await Promise.resolve().then(() => translatePage(language));
        } catch (error) {
            console.warn('No se pudo traducir la página:', error);
        }

        if (typeof callback === 'function') {
            callback(language);
        }
    });
}
