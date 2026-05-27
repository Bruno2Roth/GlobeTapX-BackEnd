import express from 'express';
import ubicacionService from '../../application/services/ubicacionService.js';

const router = express.Router();
const service = new ubicacionService();

router.get('/', async (req, res) => {
    try {
        const ip = req.query.ip || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
        const location = await service.getByIpAsync(ip);
        res.status(200).json(location);
    } catch (error) {
        console.log('Error en GET /api/ubicacion');
        console.log(error);
        res.status(500).json({ error: error.message || 'Error al obtener ubicación' });
    }
});

export default router;
