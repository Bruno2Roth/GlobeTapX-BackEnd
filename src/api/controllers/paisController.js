import express from 'express';
import paisService from '../../application/services/paisService.js';
import { sendPublicError } from '../errors.js';

const router = express.Router();
const service = new paisService();

router.get('/', async (req, res) => {
    try {
        const data = await service.getAllAsync();
        const cache = service.getCacheStatus();
        res.set('X-Countries-Cache', cache.source);
        return res.status(200).json(data);
    } catch (error) {
        return sendPublicError(res, error, 'No se pudieron obtener los países');
    }
});

router.get('/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ success: false, message: 'Solicitud no válida' });
    }

    try {
        const data = await service.getByIdAsync(id);
        return res.status(200).json(data);
    } catch (error) {
        return sendPublicError(res, error, 'No se pudo obtener el país');
    }
});

export default router;
