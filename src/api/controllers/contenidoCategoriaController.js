import express from 'express';
import contenidoCategoriaService from '../../application/services/contenidoCategoriaService.js';

const router = express.Router();
const service = new contenidoCategoriaService();

// Controlador para contenido de categorías.
// Permite listar todo el contenido, buscar por categoría o por contenido específico.
router.get('/', async (req, res) => {
    try {
        const { IDCategoria, IDContenido } = req.query;

        if (IDCategoria !== undefined) {
            const idCategoria = Number(IDCategoria);
            if (Number.isNaN(idCategoria) || idCategoria <= 0) {
                return res.status(400).json({ success: false, error: 'IDCategoria inválido' });
            }
            const data = await service.getByCategoriaAsync(idCategoria);
            return res.json({ success: true, data });
        }

        if (IDContenido !== undefined) {
            const idContenido = Number(IDContenido);
            if (Number.isNaN(idContenido) || idContenido <= 0) {
                return res.status(400).json({ success: false, error: 'IDContenido inválido' });
            }
            const data = await service.getByContenidoAsync(idContenido);
            return res.json({ success: true, data });
        }

        const data = await service.getAllAsync();
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error en GET /api/contenidoPorCategoria', error);
        res.status(500).json({ success: false, error: error.message || 'Error al obtener contenido por categoría' });
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
        console.error('Error en GET /api/contenidoPorCategoria/:id', error);
        res.status(500).json({ success: false, error: error.message || 'Error al obtener contenido por ID' });
    }
});

export default router;

