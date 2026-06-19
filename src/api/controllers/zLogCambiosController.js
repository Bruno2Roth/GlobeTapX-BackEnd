import express from 'express';
import zLogCambiosService from '../../application/services/zLogCambiosService.js';

const router = express.Router();
const service = new zLogCambiosService();

router.get('/', async (req, res) => {
    try {
        const { usuarioId } = req.query;
        if (usuarioId) {
            const data = await service.getByUsuarioAsync(usuarioId);
            return res.status(200).json(data);
        }
        const data = await service.getAllAsync();
        res.status(200).json(data);
    } catch (error) {
        console.log('Error en GET /logCambios', error);
        res.status(500).json({ error: error.message || 'Error al obtener logs' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: 'ID inválido' });
        }
        const data = await service.getByIdAsync(id);
        if (!data) {
            return res.status(404).json({ error: 'Log no encontrado' });
        }
        res.status(200).json(data);
    } catch (error) {
        console.log('Error en GET /logCambios/:id', error);
        res.status(500).json({ error: error.message || 'Error al obtener log' });
    }
});

router.post('/', async (req, res) => {
    try {
        const entity = req.body;
        const result = await service.createAsync(entity);
        res.status(201).json({ success: true, message: 'Log creado', id: result.ID || result });
    } catch (error) {
        console.log('Error en POST /logCambios', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: error.message || 'Error al crear log' });
    }
});

export default router;
