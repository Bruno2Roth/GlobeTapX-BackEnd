import express from 'express';
import usuariosService from '../../application/services/usuariosService.js';
import storageService from '../../application/services/storageService.js';
import { getUploadedPhoto, parseProfilePhoto } from '../middlewares/profilePhotoUpload.js';
import { sendPublicError, logInternalError } from '../errors.js';
import { authorizeSelfOrAdmin, requireAdmin } from '../middlewares/authorization.js';

const router = express.Router();
const usuarioService = new usuariosService();
const service = new storageService();

router.get('/health', async (req, res) => {
    if (!requireAdmin(req, res)) return null;

    try {
        const status = service.getStatus();
        if (!status.configured) {
            return res.status(503).json({ success: false, message: 'Servicio temporalmente no disponible' });
        }
        const bucket = await service.getBucketInfo();
        return res.status(200).json({
            success: true,
            data: {
                configured: true,
                bucket: bucket?.name || status.bucket,
                public: status.public,
                timeoutMs: status.timeoutMs,
                signedUrlTtlSeconds: status.signedUrlTtlSeconds,
            },
        });
    } catch (error) {
        logInternalError('GET /api/storage/health', error);
        return sendPublicError(res, error, 'Servicio temporalmente no disponible');
    }
});

router.get('/profile/:id', async (req, res) => {
    const id = authorizeSelfOrAdmin(req, res, req.params.id);
    if (!id) return null;

    try {
        const usuario = await usuarioService.getProfilePhotoByIdAsync(id);
        const fotoPath = usuario?.fotoPath && !/^data:/i.test(String(usuario.fotoPath))
            ? usuario.fotoPath
            : null;
        const fotoPerfil = fotoPath ? await usuarioService.getFotoPerfilUrlAsync(fotoPath) : null;
        return res.status(200).json({ success: true, data: { fotoPerfil, fotoPath } });
    } catch (error) {
        logInternalError('GET /api/storage/profile/:id', error);
        return sendPublicError(res, error, 'No se pudo obtener la foto');
    }
});

router.put('/profile/:id', (req, res, next) => {
    const id = authorizeSelfOrAdmin(req, res, req.params.id);
    if (!id) return null;
    req.targetUserId = id;
    return next();
}, parseProfilePhoto, async (req, res) => {
    try {
        const file = getUploadedPhoto(req);
        if (!file) return res.status(400).json({ success: false, message: 'Solicitud no valida' });
        return res.status(200).json(await usuarioService.updateFotoPerfilAsync(req.targetUserId, file));
    } catch (error) {
        logInternalError('PUT /api/storage/profile/:id', error);
        return sendPublicError(res, error, 'No se pudo subir la foto');
    }
});

router.get('/profile/:id/files', async (req, res) => {
    const id = authorizeSelfOrAdmin(req, res, req.params.id);
    if (!id) return null;
    try {
        return res.status(200).json({ success: true, data: await usuarioService.listFotosPerfilAsync(id) });
    } catch (error) {
        logInternalError('GET /api/storage/profile/:id/files', error);
        return sendPublicError(res, error, 'No se pudieron listar las fotos');
    }
});

router.delete('/profile/:id', async (req, res) => {
    const id = authorizeSelfOrAdmin(req, res, req.params.id);
    if (!id) return null;
    try {
        return res.status(200).json(await usuarioService.deleteFotoPerfilAsync(id));
    } catch (error) {
        logInternalError('DELETE /api/storage/profile/:id', error);
        return sendPublicError(res, error, 'No se pudo eliminar la foto');
    }
});

export default router;
