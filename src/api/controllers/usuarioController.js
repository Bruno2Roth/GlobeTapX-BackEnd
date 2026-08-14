import express from 'express';
import usuariosService from '../../application/services/usuariosService.js';
import { getUploadedPhoto, parseProfilePhoto } from '../middlewares/profilePhotoUpload.js';
import { sendPublicError } from '../errors.js';
import { toSafeUserForInternalRead } from '../../application/dtos/userProfile.js';

const router = express.Router();
const service = new usuariosService();

const requesterId = (req) => Number(req.user?.id || req.user?.ID) || null;
const admin = (req) => Boolean(
    req.user?.role === 'admin'
    || req.user?.isAdmin === true
    || req.user?.isAdmin === 'true'
    || req.user?.isAdmin === 'TRUE',
);

const authorizeTarget = (req, res, targetId) => {
    const id = Number(targetId);
    if (!Number.isInteger(id) || id <= 0) {
        res.status(400).json({ success: false, message: 'Solicitud no válida' });
        return null;
    }

    const currentId = requesterId(req);
    if (!currentId) {
        res.status(401).json({ success: false, message: 'No autorizado' });
        return null;
    }

    if (!admin(req) && currentId !== id) {
        res.status(403).json({
            success: false,
            message: 'No tiene permisos para esta operación',
        });
        return null;
    }

    return id;
};

const containsLanguageField = (body = {}) => [
    'idiomaPreferido',
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

const handleKnownUserError = (res, error, fallback) => {
    if (error?.message === 'Usuario no encontrado') {
        return res.status(400).json({ success: false, message: 'Solicitud no válida' });
    }
    return sendPublicError(res, error, fallback);
};

router.get('/', async (req, res) => {
    if (!admin(req)) {
        return res.status(403).json({
            success: false,
            message: 'No tiene permisos para esta operación',
        });
    }

    try {
        const users = await service.getAllAsync();
        return res.status(200).json(users.map(user => toSafeUserForInternalRead(user, req)));
    } catch (error) {
        return sendPublicError(res, error, 'No se pudieron obtener los usuarios');
    }
});

// Perfil de idioma optimizado: una lectura de una sola columna por ID.
router.get('/idioma', async (req, res) => {
    const usuarioId = Number(req.query.usuarioId);
    const id = authorizeTarget(req, res, usuarioId);
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
    const usuarioId = Number(body.usuarioId);
    const codigoIdioma = body.codigoIdioma;

    if (!Number.isInteger(usuarioId) || usuarioId <= 0 || typeof codigoIdioma !== 'string') {
        return res.status(400).json({ success: false, message: 'Solicitud no válida' });
    }

    const id = authorizeTarget(req, res, usuarioId);
    if (!id) return null;

    try {
        const result = await service.cambiarIdiomaAsync(id, codigoIdioma);
        return res.status(200).json({
            success: true,
            codigoIdioma: result.codigoIdioma,
        });
    } catch (error) {
        return handleKnownUserError(res, error, 'No se pudo actualizar el idioma');
    }
});

router.get('/:id', async (req, res) => {
    const id = authorizeTarget(req, res, req.params.id);
    if (!id) return null;

    try {
        const user = await service.getByIdAsync(id);
        if (!user) return res.status(400).json({ success: false, message: 'Solicitud no válida' });
        return res.status(200).json(toSafeUserForInternalRead(user, req));
    } catch (error) {
        return sendPublicError(res, error, 'No se pudo obtener el usuario');
    }
});

// La autorización se ejecuta antes de parsear el multipart y antes de copiar
// hasta 5 MB a memoria.
router.put('/:id/foto', (req, res, next) => {
    const id = authorizeTarget(req, res, req.params.id);
    if (!id) return null;
    req.targetUserId = id;
    return next();
}, parseProfilePhoto, async (req, res) => {
    try {
        const file = getUploadedPhoto(req);
        if (!file) {
            return res.status(400).json({ success: false, message: 'Solicitud no válida' });
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
    const id = authorizeTarget(req, res, req.params.id);
    if (!id) return null;

    try {
        const result = await service.deleteFotoPerfilAsync(id);
        return res.status(200).json(result);
    } catch (error) {
        return handleKnownUserError(res, error, 'No se pudo eliminar la foto');
    }
});

router.post('/', async (req, res) => {
    if (containsPhotoField(req.body)) {
        return res.status(400).json({ success: false, message: 'La foto debe enviarse como multipart/form-data' });
    }

    try {
        const result = await service.createAsync(req.body || {});
        return res.status(201).json({ success: true, id: result });
    } catch (error) {
        return sendPublicError(res, error, 'No se pudo crear el usuario');
    }
});

router.put('/', async (req, res) => {
    const body = req.body || {};
    if (containsLanguageField(body)) {
        return res.status(400).json({ success: false, message: 'Use PUT /api/usuario/idioma' });
    }
    if (containsPhotoField(body)) {
        return res.status(400).json({ success: false, message: 'Use PUT /api/usuario/:id/foto' });
    }

    const id = authorizeTarget(req, res, body.ID ?? body.id);
    if (!id) return null;

    try {
        const result = await service.updateAsync({ ...body, ID: id });
        return res.status(200).json({ success: true, updated: result });
    } catch (error) {
        return handleKnownUserError(res, error, 'No se pudo actualizar el usuario');
    }
});

// Debe quedar después de /idioma, /paisactual y /:id/foto.
router.put('/paisactual', async (req, res) => {
    const id = authorizeTarget(req, res, req.body?.usuarioId);
    if (!id) return null;

    try {
        const result = await service.updatePaisActualAsync(id, req.body?.paisactual);
        return res.status(200).json(result);
    } catch (error) {
        return handleKnownUserError(res, error, 'No se pudo actualizar el país');
    }
});

router.put('/:id', async (req, res) => {
    if (containsLanguageField(req.body)) {
        return res.status(400).json({ success: false, message: 'Use PUT /api/usuario/idioma' });
    }
    if (containsPhotoField(req.body)) {
        return res.status(400).json({ success: false, message: 'Use PUT /api/usuario/:id/foto' });
    }

    const id = authorizeTarget(req, res, req.params.id);
    if (!id) return null;

    try {
        const result = await service.updateAsync({ ...(req.body || {}), ID: id });
        return res.status(200).json({ success: true, updated: result });
    } catch (error) {
        return handleKnownUserError(res, error, 'No se pudo actualizar el usuario');
    }
});

router.delete('/:id', async (req, res) => {
    const id = authorizeTarget(req, res, req.params.id);
    if (!id) return null;

    try {
        const deleted = await service.deleteByIdAsync(id);
        if (!deleted) return res.status(400).json({ success: false, message: 'Solicitud no válida' });
        return res.status(200).json({ success: true, deleted });
    } catch (error) {
        return sendPublicError(res, error, 'No se pudo eliminar el usuario');
    }
});

export default router;
