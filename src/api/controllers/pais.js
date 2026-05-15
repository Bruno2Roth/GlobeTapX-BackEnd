import express from 'express';
import paisService from '../services/paisService.js';

const router = express.Router();
const service = new paisService();

router.get('/', async (req, res) => {
    const data = await service.getAllAsync();
    res.json(data);
});

router.get('/:id', async (req, res) => {
    const data = await service.getByIdAsync(req.params.id);
    res.json(data);
});

export default router;
