import express from 'express';
import agendaUsuarioService from './../../application/services/agendaUsuarioService.js';
import {
    authorizeSelfOrAdmin,
    hasAdminRole,
    parsePositiveId,
    requireAuthenticatedUser,
} from '../middlewares/authorization.js';

const router = express.Router();
const service = new agendaUsuarioService();

const bodyEventId = (body = {}) => parsePositiveId(
    body.IDEvento ?? body.idEvento ?? body.id_evento,
);

const entryOwnerId = entry => parsePositiveId(
    entry?.IDUsuario ?? entry?.idUsuario ?? entry?.id_usuario,
);

const sendInvalid = (res, message = 'Solicitud no valida') => (
    res.status(400).json({ error: message })
);

// Un usuario solo ve sus entradas. El listado completo queda reservado al
// administrador verificado en el JWT.
router.get('/', async (req, res) => {
    const requesterId = requireAuthenticatedUser(req, res);
    if (!requesterId) return null;

    try {
        const data = hasAdminRole(req)
            ? await service.getAllAsync()
            : await service.getByUsuarioAsync(requesterId);
        return res.status(200).json(data);
    } catch (error) {
        console.log('Error en GET /api/agendausuario', error);
        return res.status(500).json({ error: 'Error al obtener agendas' });
    }
});

// Datos de feriados: no contienen información de una cuenta.
router.get('/feriados/paises', async (req, res) => {
    try {
        const paises = await service.getSupportedCountries();
        return res.status(200).json(paises);
    } catch (error) {
        console.log('Error en GET /api/agendaUsuario/feriados/paises', error);
        return res.status(400).json({ error: error.message || 'Error al obtener paises soportados' });
    }
});

router.get('/:id', async (req, res) => {
    const id = authorizeSelfOrAdmin(req, res, req.params.id);
    if (!id) return null;

    try {
        const data = await service.getAgendaConFeriadosAsync(id);
        return res.status(200).json(data);
    } catch (error) {
        console.log('Error en GET /api/agendausuario/:id', error);
        return res.status(500).json({ error: error.message || 'Error al obtener agenda de usuario' });
    }
});

router.post('/', async (req, res) => {
    const requesterId = requireAuthenticatedUser(req, res);
    if (!requesterId) return null;

    const body = req.body || {};
    const eventId = bodyEventId(body);
    if (!eventId) return sendInvalid(res, 'IDEvento invalido');

    // IDUsuario se fija desde el token. Cualquier valor enviado por el
    // cliente se ignora, incluso si el solicitante es administrador.
    const entity = {
        IDUsuario: requesterId,
        IDEvento: eventId,
        interes: body.interes,
        recordatorio: body.recordatorio,
    };

    try {
        const result = await service.createAsync(entity);
        return res.status(201).json({ success: true, message: 'AgendaUsuario creado', id: result });
    } catch (error) {
        console.log('Error en POST /api/agendausuario', error);
        return res.status(500).json({ error: 'Error al crear agenda' });
    }
});

router.put('/', async (req, res) => {
    const body = req.body || {};
    const id = parsePositiveId(body.ID ?? body.id);
    if (!id) return sendInvalid(res, 'ID de agenda invalido');

    try {
        const existing = await service.getByIdAsync(id);
        if (!existing) return res.status(404).json({ error: 'Entrada de agenda no encontrada' });

        const ownerId = entryOwnerId(existing);
        const authorizedOwnerId = authorizeSelfOrAdmin(req, res, ownerId);
        if (!authorizedOwnerId) return null;

        const eventId = bodyEventId(body) || parsePositiveId(existing.IDEvento);
        if (!eventId) return sendInvalid(res, 'IDEvento invalido');

        const entity = {
            ID: id,
            // Nunca se permite cambiar el dueño de una entrada desde el body.
            IDUsuario: ownerId,
            IDEvento: eventId,
            interes: Object.prototype.hasOwnProperty.call(body, 'interes')
                ? body.interes
                : existing.interes,
            recordatorio: Object.prototype.hasOwnProperty.call(body, 'recordatorio')
                ? body.recordatorio
                : existing.recordatorio,
        };

        const result = await service.updateAsync(entity);
        return res.status(200).json({ success: true, message: 'AgendaUsuario actualizado', updated: result });
    } catch (error) {
        console.log('Error en PUT /api/agendausuario', error);
        return res.status(500).json({ error: 'Error al actualizar agenda' });
    }
});

router.delete('/:id', async (req, res) => {
    const id = parsePositiveId(req.params.id);
    if (!id) return sendInvalid(res, 'ID de agenda invalido');

    try {
        const entry = await service.getByIdAsync(id);
        if (!entry) return res.status(404).json({ error: 'Entrada de agenda no encontrada' });

        const ownerId = entryOwnerId(entry);
        const authorizedOwnerId = authorizeSelfOrAdmin(req, res, ownerId);
        if (!authorizedOwnerId) return null;

        const result = await service.deleteByIdAsync(id);
        return res.status(200).json({ success: true, message: 'AgendaUsuario eliminado', deleted: result });
    } catch (error) {
        console.log('Error en DELETE /api/agendausuario/:id', error);
        return res.status(500).json({ error: 'Error al eliminar agenda' });
    }
});

export default router;
