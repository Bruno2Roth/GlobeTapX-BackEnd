import express from 'express';
import eventoFavoritoService from '../../application/services/eventoFavoritoService.js';
import usuariosRepository from '../../data/repositories/usuariosRepository.js';
import EventosRepository from '../../data/repositories/eventosRepository.js';

const router = express.Router();
const service = new eventoFavoritoService();
const usuariosRepo = new usuariosRepository();
const eventosRepo = new EventosRepository();

router.get('/', async (req, res) => {
    try {
        const IDUsuario = req.query.IDUsuario || req.query.idUsuario || req.query.id_usuario;
        if (IDUsuario) {
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

        const data = await service.getAllAsync();
        res.status(200).json(data);
    } catch (error) {
        console.error('Error en GET /api/eventoFavorito', error);
        res.status(500).json({ error: error.message || 'Error al obtener eventos favoritos' });
    }
});

router.post('/', async (req, res) => {
    try {
        console.log('POST /api/eventoFavorito headers:', req.headers['content-type']);
        console.log('POST /api/eventoFavorito body:', req.body);

        const body = req.body || {};
        const entity = {
            IDUsuario: body.IDUsuario || body.idUsuario || body.id_usuario,
            IDEvento: body.IDEvento || body.idEvento || body.id_evento,
        };

        console.log('POST /api/eventoFavorito entity:', entity);

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
        const rows = await service.deleteByIdAsync(id);
        if (!rows) {
            return res.status(404).json({ error: 'No se encontró el favorito para eliminar' });
        }
        res.status(200).json({ message: 'Favorito eliminado', rowsAffected: rows });
    } catch (error) {
        console.error('Error en DELETE /api/eventoFavorito/:id', error);
        res.status(500).json({ error: error.message || 'Error al eliminar evento favorito' });
    }
});

export default router;

