import express from 'express';
import eventoFavoritoService from '../../application/services/eventoFavoritoService.js';
import usuariosRepository from '../../data/repositories/usuariosRepository.js';

const router = express.Router();
const service = new eventoFavoritoService();
const usuariosRepo = new usuariosRepository();

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
        const body = req.body || {};
        const entity = {
            IDUsuario: body.IDUsuario || body.idUsuario || body.id_usuario,
            IDEvento: body.IDEvento || body.idEvento || body.id_evento,
        };

        if (!entity.IDUsuario || !entity.IDEvento) {
            return res.status(400).json({ error: 'Debe enviar IDUsuario e IDEvento' });
        }

        const id = await service.createAsync(entity);
        res.status(201).json({ message: 'Favorito creado', ID: id });
    } catch (error) {
        console.error('Error en POST /api/eventoFavorito', error);
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

