export class HttpError extends Error {
    constructor(statusCode, publicMessage, options = {}) {
        super(options.internalMessage || publicMessage, options);
        this.name = options.name || 'HttpError';
        this.statusCode = statusCode;
        this.publicMessage = publicMessage;
        this.code = options.code;
    }
}

export class BadRequestError extends HttpError {
    constructor(message = 'Solicitud no válida', options = {}) {
        super(400, message, { ...options, name: 'BadRequestError' });
    }
}

export class UnauthorizedError extends HttpError {
    constructor(message = 'No autorizado', options = {}) {
        super(401, message, { ...options, name: 'UnauthorizedError' });
    }
}

export class ForbiddenError extends HttpError {
    constructor(message = 'No tiene permisos para esta operación', options = {}) {
        super(403, message, { ...options, name: 'ForbiddenError' });
    }
}

export class ServiceUnavailableError extends HttpError {
    constructor(message = 'Servicio temporalmente no disponible', options = {}) {
        super(503, message, { ...options, name: 'ServiceUnavailableError' });
    }
}

export const isDependencyError = (error) => Boolean(
    error?.code === 'DB_UNAVAILABLE'
    || error?.code === 'STORAGE_UNAVAILABLE'
    || error?.code === 'ETIMEDOUT'
    || error?.code === 'ECONNRESET'
    || error?.code === 'ECONNREFUSED'
    || error?.code === 'ENOTFOUND'
    || error?.code === 'EAI_AGAIN'
    || error?.code === '57014'
    || error?.code === '57P01'
    || String(error?.code || '').startsWith('08')
    || error?.name === 'AbortError'
    || /(?:database|postgres|connection|connect|query|socket|timed out)/i.test(String(error?.message || ''))
);

export const sendPublicError = (res, error, fallbackMessage = 'Solicitud no válida') => {
    let statusCode = error?.statusCode;
    if (!statusCode && (error?.name === 'ValidationError'
        || error?.name === 'DuplicateError'
        || error?.code === 'UsuarioDuplicado'
        || error?.message === 'Usuario no encontrado')) {
        statusCode = 400;
    }
    if (!statusCode && isDependencyError(error)) statusCode = 503;
    if (!statusCode) statusCode = 500;

    let message = error?.publicMessage;
    if (!message && (statusCode === 400 || error?.name === 'ValidationError')) {
        message = 'Solicitud no válida';
    }
    if (!message && statusCode === 503) message = 'Servicio temporalmente no disponible';
    if (!message) message = fallbackMessage;

    return res.status(statusCode).json({
        success: false,
        message,
    });
};

export const logInternalError = (context, error) => {
    console.error(`[${context}]`, {
        name: error?.name || 'Error',
        code: error?.code || null,
        message: error?.message || 'unknown error',
    });
};
