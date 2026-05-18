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
    const data = await service.createAsync(req.body);
    res.json(data);
});

router.put('/', async (req, res) => {
    const data = await service.updateAsync(req.body);
    res.json(data);
});

router.delete('/:id', async (req, res) => {
    const data = await service.deleteByIdAsync(req.params.id);
    res.json(data);
});

export default router;
