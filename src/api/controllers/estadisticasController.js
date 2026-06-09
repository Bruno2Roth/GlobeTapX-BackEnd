import express from 'express';
import estadisticasService from '../../application/services/estadisticasService.js';

const router = express.Router();
const service = new estadisticasService();

// Obtener todas las estadísticas (admin)
router.get('/', async (req, res) => {
    console.log('GET /estadisticas');
    try {
        const data = await service.getAllAsync();
        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Error en GET /estadisticas:', error);
        res.status(500).json({ error: error.message || 'Error al obtener estadísticas' });
    }
});

// Obtener estadísticas de un usuario específico
router.get('/usuario/:usuarioId', async (req, res) => {
    console.log(`GET /estadisticas/usuario/${req.params.usuarioId}`);
    try {
        const usuarioId = Number(req.params.usuarioId);
        if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
            return res.status(400).json({ error: 'ID de usuario inválido' });
        }

        // Access control: sólo el propio usuario o un admin pueden leer estas estadísticas
        const requester = req.user || null; // set by auth middleware
        const requesterId = requester ? Number(requester.id || requester.ID) : null;
        const isAdmin = requester && (requester.role === 'admin' || requester.isAdmin === true);

        if (!requester && !isAdmin) {
            return res.status(401).json({ error: 'No autorizado. Token requerido.' });
        }
        if (!isAdmin && requesterId !== usuarioId) {
            return res.status(403).json({ error: 'No tiene permiso para acceder a las estadísticas de otro usuario.' });
        }

        const stats = await service.getByUsuarioAsync(usuarioId);
        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        console.error('Error en GET /estadisticas/usuario/:id:', error);
        if (error.message.includes('no encontradas')) {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: error.message || 'Error al obtener estadísticas' });
    }
});

// Obtener estadística por ID
router.get('/:id', async (req, res) => {
    console.log(`GET /estadisticas/${req.params.id}`);
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: 'ID de estadística inválido' });
        }

        const stats = await service.getByIdAsync(id);
        if (!stats) {
            return res.status(404).json({ error: 'Estadística no encontrada' });
        }
        res.status(200).json({ success: true, data: stats });
    } catch (error) {
        console.error('Error en GET /estadisticas/:id:', error);
        res.status(500).json({ error: error.message || 'Error al obtener estadística' });
    }
});

// Actualizar estadísticas (admin)
router.put('/:id', async (req, res) => {
    console.log(`PUT /estadisticas/${req.params.id}`);
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: 'ID de estadística inválido' });
        }

        const entity = { ...req.body, ID: id };
        const rowsAffected = await service.updateAsync(entity);
        
        if (rowsAffected === 0) {
            return res.status(404).json({ error: 'Estadística no encontrada' });
        }

        res.status(200).json({ success: true, message: 'Estadísticas actualizadas', rowsAffected });
    } catch (error) {
        console.error('Error en PUT /estadisticas/:id:', error);
        if (error.message && error.message.startsWith('No se encontraron columnas válidas para actualizar')) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: error.message || 'Error al actualizar estadísticas' });
    }
});

export default router;
