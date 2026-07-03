import express from 'express';
import estadisticasService from '../../application/services/estadisticasService.js';

const router = express.Router();
const service = new estadisticasService();

const mapTipoEvento = {
    visita_pais: 'paisesVisitados',
    creacion_expedicion: 'expediciones',
    asistencia_evento: 'eventosAsistidos',
    visita_continente: 'continentesVisitados',
    inicio_viaje: 'diasViajando',
};

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

        const requester = req.user || null;
        const requesterId = requester ? Number(requester.id || requester.ID) : null;
        const isAdmin = requester && (requester.role === 'admin' || requester.isAdmin === true || requester.isAdmin === true || requester.isAdmin === 'TRUE' || requester.isAdmin === 'true');

        // TEMPORALMENTE DESHABILITADO PARA TESTING
        // REACTIVAR ANTES DE PRODUCCIÓN
        // if (!requester && !isAdmin) {
        //     return res.status(401).json({ error: 'No autorizado. Token requerido.' });
        // }
        // if (!isAdmin && requesterId !== usuarioId) {
        //     return res.status(403).json({ error: 'No tiene permiso para acceder a las estadísticas de otro usuario.' });
        // }

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

// Obtener estadísticas generales de la app (conteos globales)
router.get('/generales', async (req, res) => {
    console.log('GET /estadisticas/generales');
    try {
        const data = await service.getGeneralesAsync();
        res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Error en GET /estadisticas/generales:', error);
        res.status(500).json({ error: error.message || 'Error al obtener estadísticas generales' });
    }
});

// Obtener timeline de eventos de un usuario
router.get('/eventos/:usuarioId', async (req, res) => {
    console.log(`GET /estadisticas/eventos/${req.params.usuarioId}`);
    try {
        const usuarioId = Number(req.params.usuarioId);
        if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
            return res.status(400).json({ error: 'ID de usuario inválido' });
        }
        const eventos = await service.getEventosByUsuarioAsync(usuarioId);
        res.status(200).json({ success: true, data: eventos });
    } catch (error) {
        console.error('Error en GET /estadisticas/eventos/:id:', error);
        res.status(500).json({ error: error.message || 'Error al obtener eventos' });
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

// Crear registro de estadísticas para un usuario
router.post('/', async (req, res) => {
    console.log('POST /estadisticas');
    try {
        const result = await service.createAsync(req.body);
        res.status(201).json({ success: true, data: result });
    } catch (error) {
        console.error('Error en POST /estadisticas:', error);
        res.status(500).json({ error: error.message || 'Error al crear estadísticas' });
    }
});

// Registrar un evento + auto-actualizar stats agregadas
router.post('/evento', async (req, res) => {
    console.log('POST /estadisticas/evento');
    try {
        const { usuarioId, tipoEvento, detalle } = req.body;
        if (!usuarioId || !tipoEvento) {
            return res.status(400).json({ error: 'usuarioId y tipoEvento son requeridos' });
        }

        await service.logEventoAsync(usuarioId, tipoEvento, detalle);

        const campo = mapTipoEvento[tipoEvento];
        if (campo) {
            await service.incrementarStatAsync(usuarioId, campo);
        }

        res.status(201).json({ success: true, message: 'Evento registrado y estadísticas actualizadas' });
    } catch (error) {
        console.error('Error en POST /estadisticas/evento:', error);
        res.status(500).json({ error: error.message || 'Error al registrar evento' });
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
