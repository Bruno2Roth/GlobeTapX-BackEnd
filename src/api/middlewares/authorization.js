/**
 * Authorization helpers for routes that operate on user-owned data.
 *
 * `req.user` is populated only by the verified JWT middleware.  These helpers
 * deliberately never inspect the request body to decide who is allowed to
 * perform an operation.
 *
 * Este archivo centraliza la validación de permisos para rutas que trabajan con
 * datos pertenecientes a un usuario. La identidad del solicitante se toma
 * únicamente del token JWT ya verificado en `req.user`, evitando confiar en
 * datos manipulables del body o query string para autorizar la operación.
 */

// Valida que un valor exista, no sea nulo, no sea undefined y no sea un string vacío.
const hasValue = value => value !== undefined
    && value !== null
    && !(typeof value === 'string' && value.trim() === '');

// Convierte un identificador a un entero positivo válido.
// Solo acepta números enteros seguros mayores a 0.
export const parsePositiveId = (value) => {
    // Si no existe, es array u objeto, se considera inválido.
    if (!hasValue(value) || Array.isArray(value) || typeof value === 'object') {
        return null;
    }

    // Intenta convertir el valor a número.
    const id = Number(value);

    // Debe ser un entero seguro y estrictamente mayor que 0.
    return Number.isSafeInteger(id) && id > 0 ? id : null;
};

// Obtiene el ID del usuario autenticado desde el token JWT.
export const getAuthenticatedUserId = (req) => (
    parsePositiveId(req?.user?.id ?? req?.user?.ID)
);

// Evalúa si el usuario autenticado tiene rol de administrador.
// Acepta tanto `role: 'admin'` como `isAdmin: true` o `isAdmin: 'true'`.
export const hasAdminRole = (req) => {
    const role = typeof req?.user?.role === 'string'
        ? req.user.role.trim().toLowerCase()
        : '';
    const isAdminClaim = req?.user?.isAdmin === true
        || (typeof req?.user?.isAdmin === 'string'
            && req.user.isAdmin.trim().toLowerCase() === 'true');

    return role === 'admin' || isAdminClaim;
};

// Responde con un error estandarizado en formato JSON.
const respond = (res, status, message) => {
    res.status(status).json({
        success: false,
        message,
    });
    return null;
};

// Garantiza que el usuario esté autenticado antes de ejecutar la operación.
export const requireAuthenticatedUser = (req, res) => {
    const id = getAuthenticatedUserId(req);
    return id || respond(res, 401, 'No autorizado');
};

// Requiere autenticación y privilegios de administrador.
export const requireAdmin = (req, res) => {
    const requesterId = requireAuthenticatedUser(req, res);
    if (!requesterId) return null;
    return hasAdminRole(req)
        ? requesterId
        : respond(res, 403, 'No tiene permisos para esta operacion');
};

/**
 * Autoriza que el usuario acceda a un recurso que pertenece a otro usuario solo
 * si es administrador. La validación está basada en el token verificado, nunca
 * en el body o query param para otorgar permisos.
 */
export const authorizeSelfOrAdmin = (req, res, rawTargetId) => {
    // Valida el ID del recurso objetivo.
    const targetId = parsePositiveId(rawTargetId);
    if (!targetId) return respond(res, 400, 'Solicitud no valida');

    const requesterId = requireAuthenticatedUser(req, res);
    if (!requesterId) return null;

    // Un usuario normal solo puede operar sobre su propio ID.
    // Un administrador puede indicar otro usuario mediante el token verificado.
    if (!hasAdminRole(req) && requesterId !== targetId) {
        return respond(res, 403, 'No tiene permisos para esta operacion');
    }

    return targetId;
};

/**
 * Resuelve el ID del usuario afectado por la petición.
 *
 * Si el usuario no es admin, siempre se fuerza a usar el ID del token.
 * Si es admin y allowAdminTarget está habilitado, se puede apuntar a otro user.
 * Esto evita que un usuario normal manipule el ID de otro usuario en la petición.
 */
export const resolveUserIdFromToken = (
    req,
    res,
    rawRequestedId,
    { allowAdminTarget = false } = {},
) => {
    const requesterId = requireAuthenticatedUser(req, res);
    if (!requesterId) return null;

    const requested = hasValue(rawRequestedId)
        ? parsePositiveId(rawRequestedId)
        : null;

    // Si se envió un ID y no es válido, la solicitud es incorrecta.
    if (hasValue(rawRequestedId) && !requested) {
        return respond(res, 400, 'Solicitud no valida');
    }

    // Si el admin está habilitado y el usuario es admin, puede apuntar a otro target.
    if (allowAdminTarget && hasAdminRole(req) && requested) {
        return requested;
    }

    // Un usuario que no es admin no puede operar sobre un usuario distinto al suyo.
    if (requested && requested !== requesterId) {
        return respond(res, 403, 'No tiene permisos para esta operacion');
    }

    // Si no se envió ID o coincide con el propio usuario, se usa el del token.
    return requesterId;
};

// Exporta todas las funciones para reutilizarlas en middlewares y controladores.
export default {
    parsePositiveId,
    getAuthenticatedUserId,
    hasAdminRole,
    requireAuthenticatedUser,
    requireAdmin,
    authorizeSelfOrAdmin,
    resolveUserIdFromToken,
};
