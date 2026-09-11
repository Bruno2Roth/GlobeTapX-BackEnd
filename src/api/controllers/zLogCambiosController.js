import express from 'express';
import zLogCambiosService from '../../application/services/zLogCambiosService.js';
import {
    authorizeSelfOrAdmin,
    parsePositiveId,
    requireAdmin,
} from '../middlewares/authorization.js';

const router = express.Router();
const service = new zLogCambiosService();

router.get('/', async (req, res) => {
    try {
        const rawUserId = req.query?.usuarioId;
        const hasTarget = rawUserId !== undefined
            && rawUserId !== null
            && String(rawUserId).trim() !== '';

        if (hasTarget) {
            const usuarioId = authorizeSelfOrAdmin(req, res, rawUserId);
            if (!usuarioId) return null;
            const data = await service.getByUsuarioAsync(usuarioId);
            return res.status(200).json(data);
        }

        if (!requireAdmin(req, res)) return null;
        const data = await service.getAllAsync();
        return res.status(200).json(data);
    } catch (error) {
        console.log('Error en GET /logCambios', error);
        return res.status(500).json({ error: 'Error al obtener logs' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const id = parsePositiveId(req.params.id);
        if (!id) return res.status(400).json({ error: 'ID invalido' });

        const data = await service.getByIdAsync(id);
        if (!data) return res.status(404).json({ error: 'Log no encontrado' });

        const ownerId = parsePositiveId(data.IDUsuario);
        if (ownerId) {
            const authorizedOwnerId = authorizeSelfOrAdmin(req, res, ownerId);
            if (!authorizedOwnerId) return null;
        } else if (!requireAdmin(req, res)) {
            return null;
        }

        return res.status(200).json(data);
    } catch (error) {
        console.log('Error en GET /logCambios/:id', error);
        return res.status(500).json({ error: 'Error al obtener log' });
    }
});

// La escritura manual de auditoría es administrativa y el actor se toma del
// token; IDUsuario enviado por el cliente no puede falsificar al autor.
router.post('/', async (req, res) => {
    const actorId = requireAdmin(req, res);
    if (!actorId) return null;

    try {
        const body = req.body || {};
        const entity = {
            IDUsuario: actorId,
            accion: body.accion,
            tipoEntidad: body.tipoEntidad,
            IDEntidad: body.IDEntidad,
            diferencia: body.diferencia,
        };
        const result = await service.createAsync(entity);
        return res.status(201).json({ success: true, message: 'Log creado', id: result.ID || result });
    } catch (error) {
        console.log('Error en POST /logCambios', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        return res.status(500).json({ error: error.message || 'Error al crear log' });
    }
});

export default router;
