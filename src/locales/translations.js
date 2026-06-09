/**
 * Traducciones estáticas para la aplicación.
 *
 * Aquí se almacenan las claves que se pueden usar en la UI para mostrar
 * texto en diferentes idiomas.
 */

export const translations = {
    es: {
        home: "Inicio",
        login: "Iniciar sesión",
        profile: "Perfil",
        settings: "Configuración",
        logout: "Cerrar sesión",
        register: "Registrarse",
        error_required_field: "El campo es requerido",
        error_invalid_email: "Email inválido",
        error_password_min: "La contraseña debe tener al menos 8 caracteres",
        error_user_not_found: "Usuario no encontrado",
        error_internal_server: "Error interno del servidor",
        success_language_updated: "Idioma actualizado exitosamente",
        select_language: "Seleccionar idioma",
        preferred_language: "Idioma Preferido",
        change_language: "Cambiar Idioma",
        language: "Idioma",
        spanish: "Español",
        english: "Inglés",
        french: "Francés",
        italian: "Italiano",
        portuguese: "Portugués",
        korean: "Coreano",
        chinese: "Chino",
        hebrew: "Hebreo"
    },
    en: {
        home: "Home",
        login: "Login",
        profile: "Profile",
        settings: "Settings",
        logout: "Logout",
        register: "Register",
        error_required_field: "This field is required",
        error_invalid_email: "Invalid email",
        error_password_min: "Password must be at least 8 characters",
        error_user_not_found: "User not found",
        error_internal_server: "Internal server error",
        success_language_updated: "Language updated successfully",
        select_language: "Select language",
        preferred_language: "Preferred language",
        change_language: "Change language",
        language: "Language",
        spanish: "Español",
        english: "English",
        french: "Français",
        italian: "Italiano",
        portuguese: "Português",
        korean: "korean",
        chinese: "chinese",
        hebrew: "hebrew"
    }
};

// Mapa de códigos de idioma que normaliza variantes regionales a su código base.
export const languageCodeMap = {
    es: 'es',
    'es-ES': 'es',
    'es-MX': 'es',
    'es-AR': 'es',
    en: 'en',
    'en-US': 'en',
    'en-GB': 'en',
    fr: 'fr',
    it: 'it',
    pt: 'pt',
    ko: 'ko',
    zh: 'zh',
    he: 'he'
};

// Idiomas soportados por la aplicación y sus nombres legibles.
export const supportedLanguages = {
    es: { name: 'Español' },
    en: { name: 'English' },
    fr: { name: 'Français' },
    it: { name: 'Italiano' },
    pt: { name: 'Português' },
    ko: { name: '한국어' },
    zh: { name: '中文' },
    he: { name: 'עברית' }
};

export default translations;
