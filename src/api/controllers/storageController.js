import express from 'express';
import usuariosService from '../../application/services/usuariosService.js';
import storageService from '../../application/services/storageService.js';
import { getUploadedPhoto, parseProfilePhoto } from '../middlewares/profilePhotoUpload.js';

/**
 * Controller operativo de Storage.
 *
 * Las rutas de perfil también se mantienen en Usuario para compatibilidad
 * con el frontend actual. Este controller ofrece una API explícita para
 * diagnosticar, consultar, subir, listar y eliminar fotos de perfil.
 */
const router = express.Router();
const usuarioService = new usuariosService();
const service = new storageService();

const getRequesterId = (req) => Number(req.user?.id || req.user?.ID) || null;

const isAdmin = (req) => req.user && (
    req.user.role === 'admin'
    || req.user.isAdmin === true
    || req.user.isAdmin === 'TRUE'
    || req.user.isAdmin === 'true'
);

const checkOwnUser = (req, res, targetId) => {
    const requesterId = getRequesterId(req);
    if (!requesterId) return res.status(401).json({ error: 'No autorizado' });
    if (!isAdmin(req) && Number(requesterId) !== Number(targetId)) {
        return res.status(403).json({ error: 'No tiene permiso para acceder a este recurso' });
    }
    return null;
};

/** Comprueba configuración y permisos contra el bucket real. */
router.get('/health', async (req, res) => {
    try {
        const status = service.getStatus();
        if (!status.configured) {
            return res.status(503).json({ success: false, data: status });
        }

        const bucket = await service.getBucketInfo();
        return res.status(200).json({
            success: true,
            data: {
                ...status,
                bucket: bucket?.name || status.bucket,
                bucketPublic: bucket?.public ?? status.public,
            },
        });
    } catch (error) {
        console.error('Error en GET /api/storage/health:', error.message);
        return res.status(503).json({ success: false, error: error.message });
    }
});

/** Obtiene la URL vigente de la foto de un usuario. */
router.get('/profile/:id', async (req, res) => {
    const id = Number(req.params.id);
    const blocked = checkOwnUser(req, res, id);
    if (blocked) return blocked;

    try {
        const usuario = await usuarioService.getByIdAsync(id);
        if (!usuario || !usuario.fotoPerfil) {
            return res.status(404).json({ error: 'Foto no encontrada' });
        }

        const fotoPerfil = await usuarioService.getFotoPerfilUrlAsync(usuario.fotoPerfil);
        return res.status(200).json({ success: true, data: { fotoPerfil } });
    } catch (error) {
        console.error('Error en GET /api/storage/profile/:id:', error.message);
        return res.status(500).json({ error: error.message || 'Error al obtener foto' });
    }
});

/** Sube una nueva foto y actualiza Usuario.fotoPerfil con el path resultante. */
router.put('/profile/:id', parseProfilePhoto, async (req, res) => {
    const id = Number(req.params.id);
    const blocked = checkOwnUser(req, res, id);
    if (blocked) return blocked;

    try {
        const file = getUploadedPhoto(req);
        if (!file) {
            return res.status(400).json({ error: 'Debe enviarse una imagen en FormData' });
        }

        const result = await usuarioService.updateFotoPerfilAsync(id, file);
        return res.status(200).json(result);
    } catch (error) {
        console.error('Error en PUT /api/storage/profile/:id:', error.message);
        if (error.message === 'Usuario no encontrado') {
            return res.status(404).json({ error: error.message });
        }
        return res.status(500).json({ error: error.message || 'Error al subir foto' });
    }
});

/** Lista los objetos del prefijo del usuario para mantenimiento. */
router.get('/profile/:id/files', async (req, res) => {
    const id = Number(req.params.id);
    const blocked = checkOwnUser(req, res, id);
    if (blocked) return blocked;

    try {
        const files = await usuarioService.listFotosPerfilAsync(id);
        return res.status(200).json({ success: true, data: files });
    } catch (error) {
        console.error('Error en GET /api/storage/profile/:id/files:', error.message);
        return res.status(500).json({ error: error.message || 'Error al listar fotos' });
    }
});

/** Elimina la referencia de Usuario y trata de limpiar el objeto remoto. */
router.delete('/profile/:id', async (req, res) => {
    const id = Number(req.params.id);
    const blocked = checkOwnUser(req, res, id);
    if (blocked) return blocked;

    try {
        const result = await usuarioService.deleteFotoPerfilAsync(id);
        return res.status(200).json(result);
    } catch (error) {
        console.error('Error en DELETE /api/storage/profile/:id:', error.message);
        if (error.message === 'Usuario no encontrado') {
            return res.status(404).json({ error: error.message });
        }
        return res.status(500).json({ error: error.message || 'Error al eliminar foto' });
    }
});

export default router;
