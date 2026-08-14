export const SUPPORTED_LANGUAGE_CODES = Object.freeze([
    'es',
    'en',
    'fr',
    'it',
    'pt',
    'ko',
    'zh',
    'he',
]);

export const normalizeLanguageCode = (value, fallback = 'es') => {
    const code = String(value || '').trim().toLowerCase().split(/[-_,]/)[0];
    return SUPPORTED_LANGUAGE_CODES.includes(code) ? code : fallback;
};

export const isSupportedLanguageCode = (value) => {
    const code = String(value || '').trim().toLowerCase();
    return SUPPORTED_LANGUAGE_CODES.includes(code);
};

export const profilePhotoEndpoint = (request, userId) => {
    const configuredBaseUrl = String(process.env.PUBLIC_API_URL || '').trim().replace(/\/$/, '');
    if (configuredBaseUrl) {
        return `${configuredBaseUrl}/api/auth/foto/${userId}`;
    }

    const protocol = request?.protocol || 'http';
    const host = request?.get?.('host');
    return host ? `${protocol}://${host}/api/auth/foto/${userId}` : `/api/auth/foto/${userId}`;
};

/**
 * DTO público. Se construye campo por campo para no filtrar contraseña,
 * tokens, credenciales de Storage ni columnas futuras de la tabla Usuario.
 */
export const toPublicUser = (row, request = null) => {
    if (!row) return null;

    const id = Number(row.id ?? row.ID);
    const rawCountryId = row.paisActual ?? row.paisactual ?? row.countryId ?? null;
    const countryId = rawCountryId === null || rawCountryId === '' ? null : Number(rawCountryId);
    const storedPhoto = row.fotoPath ?? row.fotoPerfil ?? null;
    const hasPhoto = Boolean(storedPhoto && !/^data:/i.test(String(storedPhoto)));

    return {
        id: Number.isInteger(id) && id > 0 ? id : null,
        nombreCompleto: String(
            row.nombreCompleto
            ?? row.nombre_completo
            ?? row.nombre
            ?? '',
        ).trim(),
        mail: row.mail ?? row.email ?? '',
        paisActual: Number.isInteger(countryId) && countryId > 0 ? countryId : null,
        idiomaPreferido: normalizeLanguageCode(row.idiomaPreferido ?? row.idioma, 'es'),
        // Se devuelve la ruta HTTP de lectura para que /me no espere a Storage.
        // GET /api/auth/foto/:id genera la URL firmada bajo demanda.
        fotoPerfil: hasPhoto && Number.isInteger(id) && id > 0
            ? profilePhotoEndpoint(request, id)
            : null,
    };
};

export const toSafeUserForInternalRead = (row, request = null) => toPublicUser(row, request);
