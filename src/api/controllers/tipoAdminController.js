import express from 'express';
import tipoAdminService from '../../application/services/tipoAdminService.js';

const router = express.Router();

const service = new tipoAdminService();

router.get('/', async (req, res) => {
    console.log('GET /api/tipoAdmin');

    try {
        const data = await service.getAllAsync();
        console.log('TipoAdmin obtenidos:', data);
        res.status(200).json(data);
    } catch (error) {
        console.log('Error en GET /api/tipoAdmin');
        console.log(error);
        res.status(500).json({ error: 'Error al obtener tipoAdmin' });
    }
});

router.get('/:id', async (req, res) => {
    console.log(`GET /api/tipoAdmin/${req.params.id}`);

    try {
        const id = req.params.id;
        const data = await service.getByIdAsync(id);
        console.log('TipoAdmin obtenido:', data);
        res.status(200).json(data);
    } catch (error) {
        console.log('Error en GET /api/tipoAdmin/:id');
        console.log(error);
        res.status(500).json({ error: 'Error al obtener tipoAdmin' });
    }
});

export default router;
