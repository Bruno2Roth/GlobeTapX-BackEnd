import express from 'express';
import agendaUsuarioService from './../../application/services/agendaUsuarioService.js';

const router = express.Router();

const service = new agendaUsuarioService();

router.get('/', async (req, res) => {
    console.log('GET /api/usuario');

    try {

        const data = await service.getAllAsync();

        console.log('Usuarios obtenidos:', data);

        res.status(200).json(data);

    } catch (error) {

        console.log('Error en GET /api/usuario');
        console.log(error);

        res.status(500).json({
            error: 'Error al obtener usuarios'
        });
    }
});

router.get('/:id', async (req, res) => {
    console.log(`GET /api/usuario/${req.params.id}`);

    try {

        const id = req.params.id;

        const data = await service.getByIdAsync(id);

        console.log('Usuario obtenido:', data);

        res.status(200).json(data);

    } catch (error) {

        console.log('Error en GET /api/usuario/:id');
        console.log(error);

        res.status(500).json({
            error: 'Error al obtener usuario'
        });
    }
});

router.post('/', async (req, res) => {
    console.log('POST /api/usuario');
    console.log(req.body);

    try {

        const entity = req.body;

        const result = await service.createAsync(entity);

        console.log('Usuario creado:', result);

        res.status(201).json(result);

    } catch (error) {

        console.log('Error en POST /api/usuario');
        console.log(error);

        res.status(500).json({
            error: 'Error al crear usuario'
        });
    }
});

router.put('/', async (req, res) => {
    console.log('PUT /api/usuario');
    console.log(req.body);

    try {

        const entity = req.body;

        const result = await service.updateAsync(entity);

        console.log('Usuario actualizado:', result);

        res.status(200).json(result);

    } catch (error) {

        console.log('Error en PUT /api/usuario');
        console.log(error);

        res.status(500).json({
            error: 'Error al actualizar usuario'
        });
    }
});

router.delete('/:id', async (req, res) => {
    console.log(`DELETE /api/usuario/${req.params.id}`);

    try {

        const id = req.params.id;

        const result = await service.deleteByIdAsync(id);

        console.log('Usuario eliminado:', result);

        res.status(200).json(result);

    } catch (error) {

        console.log('Error en DELETE /api/usuario/:id');
        console.log(error);

        res.status(500).json({
            error: 'Error al eliminar usuario'
        });
    }
});

export default router;