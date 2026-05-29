import express from 'express';
import eventosService from '../../application/services/eventoService.js';

const router = express.Router();
const service = new eventosService();

router.get('/', async (req, res) => {
    const data = await service.getAllAsync();
    res.json(data);
});

router.get('/:id', async (req, res) => {
    const data = await service.getByIdAsync(req.params.id);
    res.json(data);
});

router.post('/', async (req, res) => {
    try {
        const id = await service.createAsync(req.body);
        res.status(201).json({ success: true, message: 'Evento creado', id });
    } catch (err) {
        console.log('Error creando evento', err);
        res.status(500).json({ error: err.message || 'Error al crear evento' });
    }
});

router.put('/', async (req, res) => {
    try {
        const updated = await service.updateAsync(req.body);
        res.status(200).json({ success: true, message: 'Evento actualizado', updated });
    } catch (err) {
        console.log('Error actualizando evento', err);
        res.status(500).json({ error: err.message || 'Error al actualizar evento' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const deleted = await service.deleteByIdAsync(req.params.id);
        res.status(200).json({ success: true, message: 'Evento eliminado', deleted });
    } catch (err) {
        console.log('Error eliminando evento', err);
        res.status(500).json({ error: err.message || 'Error al eliminar evento' });
    }
});

export default router;
