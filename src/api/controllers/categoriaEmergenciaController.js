import express from 'express';
import categoriasEmergenciaService from '../../application/services/categoriaEmergenciaService.js';

const router = express.Router();
const service = new categoriasEmergenciaService();

// GET /api/categoriaEmergencia
// - sin paisId devuelve todas las emergencias
// - con paisId devuelve solo emergencias del país solicitado
router.get('/', async (req, res) => {
    try {
        const paisId = req.query.paisId || req.query.IDPais;

        if (paisId !== undefined) {
            const id = Number(paisId);
            if (Number.isNaN(id) || id <= 0) {
                return res.status(400).json({ success: false, error: 'paisId inválido' });
            }

            const data = await service.getByPaisAsync(id);
            return res.json({ success: true, data });
        }

        const data = await service.getAllAsync();
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error en GET /api/categoriaEmergencia', error);
        res.status(500).json({ success: false, error: error.message || 'Error al obtener números de emergencia' });
    }
});

router.get('/:paisId', async (req, res) => {
    try {
        const paisId = Number(req.params.paisId);
        if (Number.isNaN(paisId) || paisId <= 0) {
            return res.status(400).json({ success: false, error: 'paisId inválido' });
        }

        const data = await service.getByPaisAsync(paisId);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Error en GET /api/categoriaEmergencia/:paisId', error);
        res.status(500).json({ success: false, error: error.message || 'Error al obtener números de emergencia por país' });
    }
});

export default router;

