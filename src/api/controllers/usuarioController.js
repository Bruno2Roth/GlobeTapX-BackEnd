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

router.get('/idioma', async (req, res) => {
    console.log('GET /usuarios/idioma');

    try {
        const usuarioId = req.query.usuarioId || req.query.id;
        const detectedLanguage = req.query.detectedLanguage || req.headers['x-user-language'];

        if (!usuarioId) {
            return res.status(400).json({ error: 'usuarioId es requerido' });
        }

        const idioma = await service.getIdiomaPreferidoConFallbackAsync(parseInt(usuarioId, 10), detectedLanguage);
        res.status(200).json({ success: true, data: idioma });
    } catch (error) {
        console.log('Error en GET /usuarios/idioma');
        console.log(error);
        if (error.message === 'Usuario no encontrado') {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        if (error.message === 'ID de usuario es requerido' || error.message === 'usuarioId es requerido') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: error.message || 'Error al obtener idioma del usuario' });
    }
});

router.put('/idioma', async (req, res) => {
    console.log('PUT /usuarios/idioma');
    console.log('Body:', req.body);

    try {
        const { usuarioId, codigoIdioma } = req.body;

        if (!usuarioId || !codigoIdioma) {
            return res.status(400).json({ error: 'usuarioId y codigoIdioma son requeridos' });
        }

        const result = await service.cambiarIdiomaAsync(parseInt(usuarioId, 10), codigoIdioma);
        res.status(200).json(result);
    } catch (error) {
        console.log('Error en PUT /usuarios/idioma');
        console.log(error);
        if (error.message === 'Usuario no encontrado') {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        if (error.name === 'ValidationError' || error.message === 'Usuario ID e idioma son requeridos') {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: error.message || 'Error al actualizar idioma del usuario' });
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

        res.status(201).json({ success: true, message: 'Usuario creado', id: result });

    } catch (error) {

        console.log('Error en POST /usuarios');
        console.log(error);

        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }

        if (error.code === 'DUPLICATE_USER') {
            return res.status(409).json({ error: error.message });
        }

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

        res.status(200).json({ success: true, message: 'Usuario actualizado', updated: result });

    } catch (error) {

        console.log('Error en PUT /usuarios');
        console.log(error);

        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }

        if (error.code === 'DUPLICATE_USER') {
            return res.status(409).json({ error: error.message });
        }

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

        res.status(200).json({ success: true, message: 'Usuario eliminado', deleted: result });

    } catch (error) {

        console.log('Error en DELETE /usuarios/:id');
        console.log(error);

        res.status(500).json({
            error: 'Error al eliminar usuario'
        });
    }
});

export default router;