import express from 'express';
import estadisticasService from '../../application/services/estadisticasService.js';
import {
    authorizeSelfOrAdmin,
    parsePositiveId,
    requireAdmin,
    requireAuthenticatedUser,
} from '../middlewares/authorization.js';

const router = express.Router();
const service = new estadisticasService();

const mapTipoEvento = {
    visita_pais: 'paisesVisitados',
    creacion_expedicion: 'expediciones',
    asistencia_evento: 'eventosAsistidos',
    visita_continente: 'continentesVisitados',
    inicio_viaje: 'diasViajando',
};

const statFields = [
    'paisesVisitados',
    'expediciones',
    'eventosAsistidos',
    'continentesVisitados',
    'diasViajando',
    'nivelViajero',
    'ultimaUbicacion',
    'fechaActualizacion',
];

const userIdFromBody = body => parsePositiveId(
    body?.IDUsuario ?? body?.idUsuario ?? body?.usuarioId ?? body?.id_usuario,
);

const buildStatsUpdate = (body = {}, id) => {
    const entity = { ID: id };
    for (const field of statFields) {
        if (Object.prototype.hasOwnProperty.call(body, field)) {
            entity[field] = body[field];
        }
    }
    return entity;
};

// El listado completo contiene información agregada por usuario y es solo
// para administradores.
router.get('/', async (req, res) => {
    if (!requireAdmin(req, res)) return null;

    try {
        const data = await service.getAllAsync();
        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Error en GET /estadisticas:', error);
        return res.status(500).json({ error: error.message || 'Error al obtener estadisticas' });
    }
});

router.get('/usuario/:usuarioId', async (req, res) => {
    const usuarioId = authorizeSelfOrAdmin(req, res, req.params.usuarioId);
    if (!usuarioId) return null;

    try {
        const stats = await service.getByUsuarioAsync(usuarioId);
        return res.status(200).json({ success: true, data: stats });
    } catch (error) {
        console.error('Error en GET /estadisticas/usuario/:id:', error);
        if (error.message?.includes('no encontradas')) {
            return res.status(404).json({ error: error.message });
        }
        return res.status(500).json({ error: error.message || 'Error al obtener estadisticas' });
    }
});

// Son conteos globales, no datos personales; siguen requiriendo un JWT válido
// por la protección general de /api.
router.get('/generales', async (req, res) => {
    if (!requireAuthenticatedUser(req, res)) return null;

    try {
        const data = await service.getGeneralesAsync();
        return res.status(200).json({ success: true, data });
    } catch (error) {
        console.error('Error en GET /estadisticas/generales:', error);
        return res.status(500).json({ error: error.message || 'Error al obtener estadisticas generales' });
    }
});

router.get('/eventos/:usuarioId', async (req, res) => {
    const usuarioId = authorizeSelfOrAdmin(req, res, req.params.usuarioId);
    if (!usuarioId) return null;

    try {
        const eventos = await service.getEventosByUsuarioAsync(usuarioId);
        return res.status(200).json({ success: true, data: eventos });
    } catch (error) {
        console.error('Error en GET /estadisticas/eventos/:id:', error);
        return res.status(500).json({ error: error.message || 'Error al obtener eventos' });
    }
});

router.get('/:id', async (req, res) => {
    const id = parsePositiveId(req.params.id);
    if (!id) return res.status(400).json({ error: 'ID de estadistica invalido' });

    try {
        const stats = await service.getByIdAsync(id);
        if (!stats) return res.status(404).json({ error: 'Estadistica no encontrada' });

        const ownerId = parsePositiveId(stats.IDUsuario ?? stats.idUsuario);
        const authorizedOwnerId = authorizeSelfOrAdmin(req, res, ownerId);
        if (!authorizedOwnerId) return null;

        return res.status(200).json({ success: true, data: stats });
    } catch (error) {
        console.error('Error en GET /estadisticas/:id:', error);
        return res.status(500).json({ error: error.message || 'Error al obtener estadistica' });
    }
});

// La creación directa de estadísticas es administrativa. Las estadísticas de
// un usuario normal se generan mediante POST /evento, ligado al token.
router.post('/', async (req, res) => {
    if (!requireAdmin(req, res)) return null;

    const body = req.body || {};
    const targetUserId = userIdFromBody(body);
    if (!targetUserId) return res.status(400).json({ error: 'IDUsuario invalido' });

    const entity = { IDUsuario: targetUserId };
    for (const field of statFields) {
        if (Object.prototype.hasOwnProperty.call(body, field)) entity[field] = body[field];
    }

    try {
        const result = await service.createAsync(entity);
        return res.status(201).json({ success: true, data: result });
    } catch (error) {
        console.error('Error en POST /estadisticas:', error);
        return res.status(500).json({ error: error.message || 'Error al crear estadisticas' });
    }
});

// El propietario se toma exclusivamente del JWT. usuarioId en el body ya no
// define a qué cuenta se imputa el evento.
router.post('/evento', async (req, res) => {
    const requesterId = requireAuthenticatedUser(req, res);
    if (!requesterId) return null;

    const body = req.body || {};
    const tipoEvento = typeof body.tipoEvento === 'string' ? body.tipoEvento.trim() : '';
    if (!tipoEvento) {
        return res.status(400).json({ error: 'tipoEvento es requerido' });
    }

    try {
        await service.logEventoAsync(requesterId, tipoEvento, body.detalle);

        const campo = mapTipoEvento[tipoEvento];
        if (campo) await service.incrementarStatAsync(requesterId, campo);

        return res.status(201).json({
            success: true,
            message: 'Evento registrado y estadisticas actualizadas',
        });
    } catch (error) {
        console.error('Error en POST /estadisticas/evento:', error);
        return res.status(500).json({ error: error.message || 'Error al registrar evento' });
    }
});

// Los valores de IDUsuario enviados al actualizar se descartan: la relación
// de la fila queda intacta y solo el token de administrador habilita el cambio.
router.put('/:id', async (req, res) => {
    if (!requireAdmin(req, res)) return null;

    const id = parsePositiveId(req.params.id);
    if (!id) return res.status(400).json({ error: 'ID de estadistica invalido' });

    const entity = buildStatsUpdate(req.body || {}, id);
    if (Object.keys(entity).length === 1) {
        return res.status(400).json({ error: 'No hay campos validos para actualizar' });
    }

    try {
        const rowsAffected = await service.updateAsync(entity);
        if (rowsAffected === 0) return res.status(404).json({ error: 'Estadistica no encontrada' });

        return res.status(200).json({ success: true, message: 'Estadisticas actualizadas', rowsAffected });
    } catch (error) {
        console.error('Error en PUT /estadisticas/:id:', error);
        return res.status(500).json({ error: error.message || 'Error al actualizar estadisticas' });
    }
});

export default router;
