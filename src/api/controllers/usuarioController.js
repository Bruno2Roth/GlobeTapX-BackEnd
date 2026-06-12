import express from 'express';
import usuariosService from '../../application/services/usuariosService.js';

const router = express.Router();
const service = new usuariosService();

const getRequesterId = (req) => {
  return req.user ? Number(req.user.id || req.user.ID) : null;
};

const isAdmin = (req) => {
  return req.user && (req.user.role === 'admin' || req.user.isAdmin === true || req.user.IsAdmin === true || req.user.IsAdmin === 'TRUE' || req.user.IsAdmin === 'true');
};

const checkOwnUser = (req, res, targetId) => {
  const requesterId = getRequesterId(req);
  if (!requesterId) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  if (!isAdmin(req) && Number(requesterId) !== Number(targetId)) {
    return res.status(403).json({ error: 'No tiene permiso para acceder a este recurso' });
  }
  return null;
};

router.get('/', async (req, res) => {
    if (!isAdmin(req)) {
      return res.status(403).json({ error: 'Solo administradores pueden listar todos los usuarios' });
    }

    try {
        const data = await service.getAllAsync();
        res.status(200).json(data);
    } catch (error) {
        console.log('Error en GET /usuarios', error);
        res.status(500).json({ error: 'Error al obtener usuarios' });
    }
});

router.get('/idioma', async (req, res) => {
    try {
        const usuarioId = req.query.usuarioId || req.query.id;

        const blocked = checkOwnUser(req, res, usuarioId);
        if (blocked) return blocked;

        const detectedLanguage = req.query.detectedLanguage || req.headers['x-user-language'];
        const idioma = await service.getIdiomaPreferidoConFallbackAsync(parseInt(usuarioId, 10), detectedLanguage);
        res.status(200).json({ success: true, data: idioma });
    } catch (error) {
        console.log('Error en GET /usuarios/idioma', error);
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
    try {
        const { usuarioId, codigoIdioma } = req.body;

        const blocked = checkOwnUser(req, res, usuarioId);
        if (blocked) return blocked;

        if (!usuarioId || !codigoIdioma) {
            return res.status(400).json({ error: 'usuarioId y codigoIdioma son requeridos' });
        }

        const result = await service.cambiarIdiomaAsync(parseInt(usuarioId, 10), codigoIdioma);
        res.status(200).json(result);
    } catch (error) {
        console.log('Error en PUT /usuarios/idioma', error);
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
    try {
        const id = req.params.id;

        const blocked = checkOwnUser(req, res, id);
        if (blocked) return blocked;

        const data = await service.getByIdAsync(id);
        res.status(200).json(data);
    } catch (error) {
        console.log('Error en GET /usuarios/:id', error);
        res.status(500).json({ error: 'Error al obtener usuario' });
    }
});

router.post('/', async (req, res) => {
    try {
        const entity = req.body;
        const result = await service.createAsync(entity);
        res.status(201).json({ success: true, message: 'Usuario creado', id: result });
    } catch (error) {
        console.log('Error en POST /usuarios', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        if (error.code === 'UsuarioDuplicado') {
            return res.status(409).json({ error: error.message });
        }
        res.status(500).json({ error: 'Error al crear usuario' });
    }
});

router.put('/', async (req, res) => {
    try {
        const entity = req.body;
        const targetId = entity.ID || entity.id;

        const blocked = checkOwnUser(req, res, targetId);
        if (blocked) return blocked;

        const result = await service.updateAsync(entity);
        res.status(200).json({ success: true, message: 'Usuario actualizado', updated: result });
    } catch (error) {
        console.log('Error en PUT /usuarios', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ error: error.message });
        }
        if (error.code === 'UsuarioDuplicado') {
            return res.status(409).json({ error: error.message });
        }
        res.status(500).json({ error: 'Error al actualizar usuario' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: 'ID de usuario inválido' });
        }

        const blocked = checkOwnUser(req, res, id);
        if (blocked) return blocked;

        const result = await service.deleteByIdAsync(id);
        if (result === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.status(200).json({ success: true, message: 'Usuario eliminado', deleted: result });
    } catch (error) {
        console.log('Error en DELETE /usuarios/:id', error);
        res.status(500).json({ error: error.message || 'Error al eliminar usuario' });
    }
});

export default router;