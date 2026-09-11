/**
 * Authorization helpers for routes that operate on user-owned data.
 *
 * `req.user` is populated only by the verified JWT middleware.  These helpers
 * deliberately never inspect the request body to decide who is allowed to
 * perform an operation.
 */

const hasValue = value => value !== undefined
    && value !== null
    && !(typeof value === 'string' && value.trim() === '');

export const parsePositiveId = (value) => {
    if (!hasValue(value) || Array.isArray(value) || typeof value === 'object') {
        return null;
    }

    const id = Number(value);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
};

export const getAuthenticatedUserId = (req) => (
    parsePositiveId(req?.user?.id ?? req?.user?.ID)
);

export const hasAdminRole = (req) => {
    const role = typeof req?.user?.role === 'string'
        ? req.user.role.trim().toLowerCase()
        : '';
    const isAdminClaim = req?.user?.isAdmin === true
        || (typeof req?.user?.isAdmin === 'string'
            && req.user.isAdmin.trim().toLowerCase() === 'true');

    return role === 'admin' || isAdminClaim;
};

const respond = (res, status, message) => {
    res.status(status).json({
        success: false,
        message,
    });
    return null;
};

export const requireAuthenticatedUser = (req, res) => {
    const id = getAuthenticatedUserId(req);
    return id || respond(res, 401, 'No autorizado');
};

export const requireAdmin = (req, res) => {
    const requesterId = requireAuthenticatedUser(req, res);
    if (!requesterId) return null;
    return hasAdminRole(req)
        ? requesterId
        : respond(res, 403, 'No tiene permisos para esta operacion');
};

/**
 * Authorizes an explicit resource owner from a path/query parameter.
 * Administrators may address another user only because the verified token
 * carries the admin claim; the parameter never grants that permission.
 */
export const authorizeSelfOrAdmin = (req, res, rawTargetId) => {
    const targetId = parsePositiveId(rawTargetId);
    if (!targetId) return respond(res, 400, 'Solicitud no valida');

    const requesterId = requireAuthenticatedUser(req, res);
    if (!requesterId) return null;

    if (!hasAdminRole(req) && requesterId !== targetId) {
        return respond(res, 403, 'No tiene permisos para esta operacion');
    }

    return targetId;
};

/**
 * Resolves a user target for endpoints that historically accepted usuarioId
 * in the body/query. Regular users are always bound to the user ID in their
 * verified token. An administrator may select a target explicitly, but only
 * after the token's admin claim has been checked.
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

    if (hasValue(rawRequestedId) && !requested) {
        return respond(res, 400, 'Solicitud no valida');
    }

    if (allowAdminTarget && hasAdminRole(req) && requested) {
        return requested;
    }

    if (requested && requested !== requesterId) {
        return respond(res, 403, 'No tiene permisos para esta operacion');
    }

    return requesterId;
};

export default {
    parsePositiveId,
    getAuthenticatedUserId,
    hasAdminRole,
    requireAuthenticatedUser,
    requireAdmin,
    authorizeSelfOrAdmin,
    resolveUserIdFromToken,
};
