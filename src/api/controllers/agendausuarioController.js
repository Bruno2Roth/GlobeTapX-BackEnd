import express from 'express';
import agendaUsuarioService from './../../application/services/agendaUsuarioService.js';

const router = express.Router();

const service = new agendaUsuarioService();

router.get('/', async (req, res) => {
    console.log('GET /api/agendausuario');

    try {

        const data = await service.getAllAsync();

        console.log('Usuarios obtenidos:', data);

        res.status(200).json(data);

    } catch (error) {

        console.log('Error en GET /api/agendausuario');
        console.log(error);

        res.status(500).json({
            error: 'Error al obtener usuarios'
        });
    }
});

router.get('/:id', async (req, res) => {
    console.log(`GET /api/agendausuario/${req.params.id}`);

    try {

        const id = req.params.id;

        const data = await service.getByIdAsync(id);

        console.log('Usuario obtenido:', data);

        res.status(200).json(data);

    } catch (error) {

        console.log('Error en GET /api/agendausuario/:id');
        console.log(error);

        res.status(500).json({
            error: 'Error al obtener usuario'
        });
    }
});

router.post('/', async (req, res) => {
    console.log('POST /api/agendausuario');
    console.log(req.body);

    try {

        const entity = req.body;

        const result = await service.createAsync(entity);

        console.log('AgendaUsuario creado:', result);

        res.status(201).json({ success: true, message: 'AgendaUsuario creado', id: result });

    } catch (error) {

        console.log('Error en POST /api/agendausuario');
        console.log(error);

        res.status(500).json({
            error: 'Error al crear usuario'
        });
    }
});

router.put('/', async (req, res) => {
    console.log('PUT /api/agendausuario');
    console.log(req.body);

    try {

        const entity = req.body;

        const result = await service.updateAsync(entity);

        console.log('AgendaUsuario actualizado:', result);

        res.status(200).json({ success: true, message: 'AgendaUsuario actualizado', updated: result });

    } catch (error) {

        console.log('Error en PUT /api/agendausuario');
        console.log(error);

        res.status(500).json({
            error: 'Error al actualizar usuario'
        });
    }
});

router.delete('/:id', async (req, res) => {
    console.log(`DELETE /api/agendausuario/${req.params.id}`);

    try {

        const id = req.params.id;

        const result = await service.deleteByIdAsync(id);

        console.log('AgendaUsuario eliminado:', result);

        res.status(200).json({ success: true, message: 'AgendaUsuario eliminado', deleted: result });

    } catch (error) {

        console.log('Error en DELETE /api/agendausuario/:id');
        console.log(error);

        res.status(500).json({
            error: 'Error al eliminar usuario'
        });
    }
});

export default router;