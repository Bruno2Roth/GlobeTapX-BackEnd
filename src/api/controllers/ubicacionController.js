import express from 'express';
import ubicacionService from '../../application/services/ubicacionService.js';
import { logInternalError, sendPublicError } from '../errors.js';

const router = express.Router();
const service = new ubicacionService();

router.get('/', async (req, res) => {
    try {
        const ip = req.query.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
        const location = await service.getByIpAsync(ip);
        res.status(200).json(location);
    } catch (error) {
        logInternalError('GET /api/ubicacion', error);
        return sendPublicError(res, error, 'Error al obtener ubicación');
    }
});

export default router;
