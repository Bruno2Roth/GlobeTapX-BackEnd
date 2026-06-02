import express from 'express';
import categoriaService from '../../application/services/categoriaService.js';

const router = express.Router();
const service = new categoriaService();

// GET /api/categoria
// - sin query devuelve todas las categorías
// - con nombre/categoria/name/search busca coincidencias parciales
router.get('/', async (req, res) => {
    try {
        const { nombre, categoria, name, search } = req.query;
        const searchTerm = nombre || categoria || name || search;

        if (searchTerm) {
            const data = await service.getByNameAsync(searchTerm);
            return res.json({ success: true, data });
        }

        const data = await service.getAllAsync();
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error en GET /api/categoria', error);
        res.status(500).json({ success: false, error: error.message || 'Error al obtener categorías' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id) || id <= 0) {
            return res.status(400).json({ success: false, error: 'ID inválido' });
        }

        const data = await service.getByIdAsync(id);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error en GET /api/categoria/:id', error);
        res.status(500).json({ success: false, error: error.message || 'Error al obtener categoría por ID' });
    }
});

export default router;
