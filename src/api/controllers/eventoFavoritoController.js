import express from 'express';
import eventoFavoritoService from '../../application/services/eventoFavoritoService.js';
import usuariosRepository from '../../data/repositories/usuariosRepository.js';
import EventosRepository from '../../data/repositories/eventosRepository.js';

const router = express.Router();
const service = new eventoFavoritoService();
const usuariosRepo = new usuariosRepository();
const eventosRepo = new EventosRepository();

const getRequesterId = (req) => {
  return req.user ? Number(req.user.id || req.user.ID) : null;
};

const isAdmin = (req) => {
  return req.user && (req.user.role === 'admin' || req.user.isAdmin === true);
};

router.get('/', async (req, res) => {
    try {
        const IDUsuario = req.query.IDUsuario || req.query.idUsuario || req.query.id_usuario;
        if (IDUsuario) {
            const requesterId = getRequesterId(req);
            if (!requesterId) {
                return res.status(401).json({ error: 'No autorizado' });
            }
            if (!isAdmin(req) && Number(requesterId) !== Number(IDUsuario)) {
                return res.status(403).json({ error: 'No tiene permiso para ver los favoritos de otro usuario' });
            }

            const usuario = await usuariosRepo.getByIdAsync(IDUsuario);
            if (!usuario) {
                return res.status(404).json({ error: 'No existe el usuario' });
            }

            const favoritos = await service.getByUsuarioAsync(IDUsuario);
            if (!favoritos || favoritos.length === 0) {
                return res.status(200).json({ message: 'No tiene favoritos', data: [] });
            }

            return res.status(200).json({ data: favoritos });
        }

        if (!isAdmin(req)) {
            return res.status(403).json({ error: 'No tiene permiso para listar todos los favoritos' });
        }

        const data = await service.getAllAsync();
        res.status(200).json(data);
    } catch (error) {
        console.error('Error en GET /api/eventoFavorito', error);
        res.status(500).json({ error: error.message || 'Error al obtener eventos favoritos' });
    }
});

router.post('/', async (req, res) => {
    try {
        const body = req.body || {};
        const IDUsuario = body.IDUsuario || body.idUsuario || body.id_usuario;

        const requesterId = getRequesterId(req);
        if (!requesterId) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        if (!isAdmin(req) && Number(requesterId) !== Number(IDUsuario)) {
            return res.status(403).json({ error: 'No puede crear favoritos para otro usuario' });
        }

        const entity = {
            IDUsuario,
            IDEvento: body.IDEvento || body.idEvento || body.id_evento,
        };

        if (!entity.IDUsuario || !entity.IDEvento) {
            return res.status(400).json({ error: 'Debe enviar IDUsuario e IDEvento' });
        }

        const usuario = await usuariosRepo.getByIdAsync(entity.IDUsuario);
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no existe' });
        }

        const evento = await eventosRepo.getByIdAsync(entity.IDEvento);
        if (!evento) {
            return res.status(404).json({ error: 'Evento no existe' });
        }

        const id = await service.createAsync(entity);
        res.status(201).json({ message: 'Favorito creado', ID: id });
    } catch (error) {
        console.error('Error en POST /api/eventoFavorito', error);
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Ya existe este evento favorito' });
        }
        res.status(500).json({ error: error.message || 'Error al crear evento favorito' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const favorito = await service.getByIdAsync(id);
        if (!favorito) {
            return res.status(404).json({ error: 'No se encontró el favorito' });
        }

        const requesterId = getRequesterId(req);
        if (!requesterId) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        const favoritoUsuarioId = Number(favorito.IDUsuario || favorito.idUsuario || favorito.id_usuario);
        if (!isAdmin(req) && Number(requesterId) !== favoritoUsuarioId) {
            return res.status(403).json({ error: 'No puede eliminar favoritos de otro usuario' });
        }

        const rows = await service.deleteByIdAsync(id);
        res.status(200).json({ message: 'Favorito eliminado', rowsAffected: rows });
    } catch (error) {
        console.error('Error en DELETE /api/eventoFavorito/:id', error);
        res.status(500).json({ error: error.message || 'Error al eliminar evento favorito' });
    }
});

export default router;

