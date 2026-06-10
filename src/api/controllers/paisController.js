import express from 'express';
import paisService from '../../application/services/paisService.js';

const router = express.Router();
const service = new paisService();

router.get('/', async (req, res) => {
    try {
        const data = await service.getAllAsync();
        res.json(data);
    } catch (err) {
        console.log('Error obteniendo países', err);
        res.status(500).json({ error: err.message || 'Error al obtener países' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const data = await service.getByIdAsync(req.params.id);
        res.json(data);
    } catch (err) {
        console.log('Error obteniendo país', err);
        res.status(500).json({ error: err.message || 'Error al obtener país' });
    }
});

export default router;
