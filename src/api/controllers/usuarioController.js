import express from 'express';
import usuariosService from '../../application/services/usuariosService.js';

const router = express.Router();

const service = new usuariosService();

router.get('/', async (req, res) => {
    console.log('GET /usuarios');

    try {

        const data = await service.getAllAsync();

        console.log('Usuarios obtenidos:', data);

        res.status(200).json(data);

    } catch (error) {

        console.log('Error en GET /usuarios');
        console.log(error);

        res.status(500).json({
            error: 'Error al obtener usuarios'
        });
    }
});

router.get('/:id', async (req, res) => {
    console.log(`GET /usuarios/${req.params.id}`);

    try {

        const id = req.params.id;

        const data = await service.getByIdAsync(id);

        console.log('Usuario obtenido:', data);

        res.status(200).json(data);

    } catch (error) {

        console.log('Error en GET /usuarios/:id');
        console.log(error);

        res.status(500).json({
            error: 'Error al obtener usuario'
        });
    }
});

router.post('/', async (req, res) => {
    console.log('POST /usuarios');
    console.log('Body:', req.body);

    try {

        const entity = req.body;

        const result = await service.createAsync(entity);

        console.log('Usuario creado:', result);

        res.status(201).json(result);

    } catch (error) {

        console.log('Error en POST /usuarios');
        console.log(error);

        res.status(500).json({
            error: 'Error al crear usuario'
        });
    }
});

router.put('/', async (req, res) => {
    console.log('PUT /usuarios');
    console.log('Body:', req.body);

    try {

        const entity = req.body;

        const result = await service.updateAsync(entity);

        console.log('Usuario actualizado:', result);

        res.status(200).json(result);

    } catch (error) {

        console.log('Error en PUT /usuarios');
        console.log(error);

        res.status(500).json({
            error: 'Error al actualizar usuario'
        });
    }
});

router.delete('/:id', async (req, res) => {
    console.log(`DELETE /usuarios/${req.params.id}`);

    try {

        const id = req.params.id;

        const result = await service.deleteByIdAsync(id);

        console.log('Usuario eliminado:', result);

        res.status(200).json(result);

    } catch (error) {

        console.log('Error en DELETE /usuarios/:id');
        console.log(error);

        res.status(500).json({
            error: 'Error al eliminar usuario'
        });
    }
});

export default router;