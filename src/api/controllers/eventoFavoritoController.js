import express from 'express';
import eventoFavoritoService from '../../application/services/eventoFavoritoService.js';
import usuariosRepository from '../../data/repositories/usuariosRepository.js';
import EventosRepository from '../../data/repositories/eventosRepository.js';
import {
    authorizeSelfOrAdmin,
    hasAdminRole,
    parsePositiveId,
    requireAuthenticatedUser,
} from '../middlewares/authorization.js';

const router = express.Router();
const service = new eventoFavoritoService();
const usuariosRepo = new usuariosRepository();
const eventosRepo = new EventosRepository();

const requestedUserId = query => (
    query.IDUsuario ?? query.idUsuario ?? query.id_usuario
);

router.get('/', async (req, res) => {
    const rawUserId = requestedUserId(req.query || {});
    const hasTarget = rawUserId !== undefined
        && rawUserId !== null
        && String(rawUserId).trim() !== '';

    try {
        if (hasTarget) {
            const userId = authorizeSelfOrAdmin(req, res, rawUserId);
            if (!userId) return null;

            const usuario = await usuariosRepo.getByIdAsync(userId);
            if (!usuario) return res.status(404).json({ error: 'No existe el usuario' });

            const favoritos = await service.getByUsuarioAsync(userId);
            return res.status(200).json({ data: favoritos || [] });
        }

        const requesterId = requireAuthenticatedUser(req, res);
        if (!requesterId) return null;

        const data = hasAdminRole(req)
            ? await service.getAllAsync()
            : await service.getByUsuarioAsync(requesterId);
        return res.status(200).json(data);
    } catch (error) {
        console.error('Error en GET /api/eventoFavorito', error);
        return res.status(500).json({ error: error.message || 'Error al obtener eventos favoritos' });
    }
});

router.post('/', async (req, res) => {
    const requesterId = requireAuthenticatedUser(req, res);
    if (!requesterId) return null;

    const body = req.body || {};
    const eventId = parsePositiveId(body.IDEvento ?? body.idEvento ?? body.id_evento);
    if (!eventId) return res.status(400).json({ error: 'IDEvento invalido' });

    // El dueño del favorito siempre es el usuario autenticado; IDUsuario del
    // body se ignora para evitar crear favoritos en otra cuenta.
    const entity = {
        IDUsuario: requesterId,
        IDEvento: eventId,
    };

    try {
        const usuario = await usuariosRepo.getByIdAsync(requesterId);
        if (!usuario) return res.status(401).json({ error: 'No autorizado' });

        const evento = await eventosRepo.getByIdAsync(eventId);
        if (!evento) return res.status(404).json({ error: 'Evento no existe' });

        const id = await service.createAsync(entity);
        return res.status(201).json({ message: 'Favorito creado', ID: id });
    } catch (error) {
        console.error('Error en POST /api/eventoFavorito', error);
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Ya existe este evento favorito' });
        }
        return res.status(500).json({ error: error.message || 'Error al crear evento favorito' });
    }
});

router.delete('/:id', async (req, res) => {
    const id = parsePositiveId(req.params.id);
    if (!id) return res.status(400).json({ error: 'ID de favorito invalido' });

    try {
        const favorito = await service.getByIdAsync(id);
        if (!favorito) return res.status(404).json({ error: 'No se encontro el favorito' });

        const ownerId = parsePositiveId(favorito.IDUsuario);
        const authorizedOwnerId = authorizeSelfOrAdmin(req, res, ownerId);
        if (!authorizedOwnerId) return null;

        const rows = await service.deleteByIdAsync(id);
        return res.status(200).json({ message: 'Favorito eliminado', rowsAffected: rows });
    } catch (error) {
        console.error('Error en DELETE /api/eventoFavorito/:id', error);
        return res.status(500).json({ error: error.message || 'Error al eliminar evento favorito' });
    }
});

export default router;
