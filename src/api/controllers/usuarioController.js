import express from 'express';
import usuariosService from '../../application/services/usuariosService.js';
import { getUploadedPhoto, parseProfilePhoto } from '../middlewares/profilePhotoUpload.js';
import { sendPublicError } from '../errors.js';
import { toSafeUserForInternalRead } from '../../application/dtos/userProfile.js';
import {
    authorizeSelfOrAdmin,
    hasAdminRole,
    requireAdmin,
    resolveUserIdFromToken,
} from '../middlewares/authorization.js';

const router = express.Router();
const service = new usuariosService();

const containsLanguageField = (body = {}) => [
    'idiomaPreferido',
    'idiomaId',
    'codigoIdioma',
    'language',
    'idioma',
].some(field => Object.prototype.hasOwnProperty.call(body, field));

const containsPhotoField = (body = {}) => [
    'fotoPerfil',
    'foto',
    'photo',
    'image',
    'profileImage',
].some(field => Object.prototype.hasOwnProperty.call(body, field));

// Estos son los únicos campos que puede actualizar el endpoint de perfil.
// Los IDs de relación y las capacidades de la cuenta nunca salen del body.
const userUpdateFields = [
    'nombre',
    'name',
    'mail',
    'email',
    'contrasena',
    'password',
    'nombreCompleto',
    'fullName',
    'numeroContacto',
    'phone',
    'paisActual',
    'paisactual',
    'countryId',
];

const userPermissionFields = ['isAdmin', 'esPremium'];

const parseBooleanField = (value) => {
    if (value === true || value === 'true' || value === 'TRUE') return true;
    if (value === false || value === 'false' || value === 'FALSE') return false;
    return null;
};

const buildUserUpdate = (body = {}, allowPermissions = false) => {
    const hasPermissionField = userPermissionFields.some(field => (
        Object.prototype.hasOwnProperty.call(body, field)
    ));

    if (hasPermissionField && !allowPermissions) {
        return { error: 'forbidden' };
    }

    const entity = {};
    for (const field of userUpdateFields) {
        if (Object.prototype.hasOwnProperty.call(body, field)) {
            entity[field] = body[field];
        }
    }

    if (allowPermissions) {
        for (const field of userPermissionFields) {
            if (!Object.prototype.hasOwnProperty.call(body, field)) continue;
            const value = parseBooleanField(body[field]);
            if (value === null) return { error: 'invalid-permission' };
            entity[field] = value;
        }
    }

    return { entity };
};

const handleKnownUserError = (res, error, fallback) => {
    if (error?.message === 'Usuario no encontrado') {
        return res.status(400).json({ success: false, message: 'Solicitud no valida' });
    }
    return sendPublicError(res, error, fallback);
};

const sendUpdateValidationError = (res, update) => {
    if (update.error === 'forbidden') {
        return res.status(403).json({
            success: false,
            message: 'No puede modificar permisos de una cuenta',
        });
    }
    if (update.error === 'invalid-permission') {
        return res.status(400).json({ success: false, message: 'Solicitud no valida' });
    }
    if (Object.keys(update.entity || {}).length === 0) {
        return res.status(400).json({ success: false, message: 'Solicitud no valida' });
    }
    return null;
};

router.get('/', async (req, res) => {
    if (!requireAdmin(req, res)) return null;

    try {
        const users = await service.getAllAsync();
        return res.status(200).json(users.map(user => toSafeUserForInternalRead(user, req)));
    } catch (error) {
        return sendPublicError(res, error, 'No se pudieron obtener los usuarios');
    }
});

// Perfil de idioma optimizado: una lectura de una sola columna por ID.
router.get('/idioma', async (req, res) => {
    const id = resolveUserIdFromToken(
        req,
        res,
        req.query.usuarioId,
        { allowAdminTarget: true },
    );
    if (!id) return null;

    try {
        const codigoIdioma = await service.getPreferredLanguageCodeAsync(id);
        return res.status(200).json({ success: true, codigoIdioma });
    } catch (error) {
        return handleKnownUserError(res, error, 'No se pudo obtener el idioma');
    }
});

router.put('/idioma', async (req, res) => {
    const body = req.body || {};
    const codigoIdioma = body.codigoIdioma;
    const idiomaId = body.idiomaId;
    const languageReference = idiomaId ?? codigoIdioma;
    const validLanguageReference = (
        typeof languageReference === 'string' && languageReference.trim().length > 0
    ) || (
        Number.isInteger(languageReference) && languageReference > 0
    );

    if (!validLanguageReference) {
        return res.status(400).json({ success: false, message: 'Solicitud no valida' });
    }

    const id = resolveUserIdFromToken(
        req,
        res,
        body.usuarioId,
        { allowAdminTarget: true },
    );
    if (!id) return null;

    try {
        const result = await service.cambiarIdiomaAsync(id, codigoIdioma, idiomaId);
        return res.status(200).json({
            success: true,
            codigoIdioma: result.codigoIdioma,
            idiomaId: result.idiomaId,
        });
    } catch (error) {
        return handleKnownUserError(res, error, 'No se pudo actualizar el idioma');
    }
});

// El país actual siempre se modifica para el usuario del token. El campo
// usuarioId solo se acepta por compatibilidad cuando coincide con ese token.
router.put('/paisactual', async (req, res) => {
    const id = resolveUserIdFromToken(req, res, req.body?.usuarioId);
    if (!id) return null;

    try {
        const result = await service.updatePaisActualAsync(id, req.body?.paisactual);
        return res.status(200).json(result);
    } catch (error) {
        return handleKnownUserError(res, error, 'No se pudo actualizar el pais');
    }
});

// Crear usuarios fuera de /auth/register es una operación administrativa.
// El token del administrador, y no un campo del body, habilita esta ruta.
router.post('/', async (req, res) => {
    if (!requireAdmin(req, res)) return null;

    if (containsPhotoField(req.body)) {
        return res.status(400).json({
            success: false,
            message: 'La foto debe enviarse como multipart/form-data',
        });
    }

    try {
        const result = await service.createAsync(req.body || {});
        return res.status(201).json({ success: true, id: result });
    } catch (error) {
        return sendPublicError(res, error, 'No se pudo crear el usuario');
    }
});

// Compatibilidad con clientes que actualizan enviando el ID en el body. La
// identidad se autoriza contra el token y el body se reduce a campos seguros.
router.put('/', async (req, res) => {
    const body = req.body || {};
    if (containsLanguageField(body)) {
        return res.status(400).json({ success: false, message: 'Use PUT /api/usuario/idioma' });
    }
    if (containsPhotoField(body)) {
        return res.status(400).json({ success: false, message: 'Use PUT /api/usuario/:id/foto' });
    }

    const id = authorizeSelfOrAdmin(req, res, body.ID ?? body.id);
    if (!id) return null;

    const update = buildUserUpdate(body, hasAdminRole(req));
    const validationResponse = sendUpdateValidationError(res, update);
    if (validationResponse) return validationResponse;

    try {
        const result = await service.updateAsync({ ...update.entity, ID: id });
        return res.status(200).json({ success: true, updated: result });
    } catch (error) {
        return handleKnownUserError(res, error, 'No se pudo actualizar el usuario');
    }
});

router.get('/:id', async (req, res) => {
    const id = authorizeSelfOrAdmin(req, res, req.params.id);
    if (!id) return null;

    try {
        const user = await service.getByIdAsync(id);
        if (!user) return res.status(400).json({ success: false, message: 'Solicitud no valida' });
        return res.status(200).json(toSafeUserForInternalRead(user, req));
    } catch (error) {
        return sendPublicError(res, error, 'No se pudo obtener el usuario');
    }
});

// La autorización se ejecuta antes de parsear el multipart y antes de copiar
// hasta 5 MB a memoria.
router.put('/:id/foto', (req, res, next) => {
    const id = authorizeSelfOrAdmin(req, res, req.params.id);
    if (!id) return null;
    req.targetUserId = id;
    return next();
}, parseProfilePhoto, async (req, res) => {
    try {
        const file = getUploadedPhoto(req);
        if (!file) {
            return res.status(400).json({ success: false, message: 'Solicitud no valida' });
        }

        const result = await service.updateFotoPerfilAsync(req.targetUserId, file);
        return res.status(200).json({
            success: true,
            fotoPerfil: result.fotoPerfil,
            fotoPath: result.fotoPath,
        });
    } catch (error) {
        return handleKnownUserError(res, error, 'No se pudo actualizar la foto');
    }
});

router.delete('/:id/foto', async (req, res) => {
    const id = authorizeSelfOrAdmin(req, res, req.params.id);
    if (!id) return null;

    try {
        const result = await service.deleteFotoPerfilAsync(id);
        return res.status(200).json(result);
    } catch (error) {
        return handleKnownUserError(res, error, 'No se pudo eliminar la foto');
    }
});

router.put('/:id', async (req, res) => {
    const body = req.body || {};
    if (containsLanguageField(body)) {
        return res.status(400).json({ success: false, message: 'Use PUT /api/usuario/idioma' });
    }
    if (containsPhotoField(body)) {
        return res.status(400).json({ success: false, message: 'Use PUT /api/usuario/:id/foto' });
    }

    const id = authorizeSelfOrAdmin(req, res, req.params.id);
    if (!id) return null;

    const update = buildUserUpdate(body, hasAdminRole(req));
    const validationResponse = sendUpdateValidationError(res, update);
    if (validationResponse) return validationResponse;

    try {
        const result = await service.updateAsync({ ...update.entity, ID: id });
        return res.status(200).json({ success: true, updated: result });
    } catch (error) {
        return handleKnownUserError(res, error, 'No se pudo actualizar el usuario');
    }
});

router.delete('/:id', async (req, res) => {
    const id = authorizeSelfOrAdmin(req, res, req.params.id);
    if (!id) return null;

    try {
        const deleted = await service.deleteByIdAsync(id);
        if (!deleted) return res.status(400).json({ success: false, message: 'Solicitud no valida' });
        return res.status(200).json({ success: true, deleted });
    } catch (error) {
        return sendPublicError(res, error, 'No se pudo eliminar el usuario');
    }
});

export default router;
