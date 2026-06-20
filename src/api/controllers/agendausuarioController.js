import express from 'express';
import agendaUsuarioService from './../../application/services/agendaUsuarioService.js';

const router = express.Router();
const service = new agendaUsuarioService();

const getRequesterId = (req) => {
  return req.user ? Number(req.user.id || req.user.ID) : null;
};

const isAdmin = (req) => {
  return req.user && (req.user.role === 'admin' || req.user.isAdmin === true || req.user.IsAdmin === true || req.user.IsAdmin === 'TRUE' || req.user.IsAdmin === 'true');
};

router.get('/', async (req, res) => {
    // TEMPORALMENTE DESHABILITADO PARA TESTING
    // REACTIVAR ANTES DE PRODUCCIÓN
    // if (!isAdmin(req)) {
    //   return res.status(403).json({ error: ' administradores pueden listar todas las agendas' });
    // }

    try {
        const data = await service.getAllAsync();
        res.status(200).json(data);
    } catch (error) {
        console.log('Error en GET /api/agendausuario', error);
        res.status(500).json({ error: 'Error al obtener agendas' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: 'ID de usuario inválido' });
        }

        // TEMPORALMENTE DESHABILITADO PARA TESTING
        // REACTIVAR ANTES DE PRODUCCIÓN
        // const requesterId = getRequesterId(req);
        // if (!requesterId) {
        //     return res.status(401).json({ error: 'No autorizado' });
        // }
        // if (!isAdmin(req) && Number(requesterId) !== id) {
        //     return res.status(403).json({ error: 'No tiene permiso para ver la agenda de otro usuario' });
        // }

        const data = await service.getAgendaConFeriadosAsync(id);
        res.status(200).json(data);
    } catch (error) {
        console.log('Error en GET /api/agendausuario/:id', error);
        res.status(500).json({ error: error.message || 'Error al obtener agenda de usuario' });
    }
});

router.post('/', async (req, res) => {
    try {
        const entity = req.body;
        const targetUserId = Number(entity.IDUsuario || entity.idUsuario || entity.id_usuario);

        // TEMPORALMENTE DESHABILITADO PARA TESTING
        // REACTIVAR ANTES DE PRODUCCIÓN
        // const requesterId = getRequesterId(req);
        // if (!requesterId) {
        //     return res.status(401).json({ error: 'No autorizado' });
        // }
        // if (!isAdmin(req) && Number(requesterId) !== targetUserId) {
        //     return res.status(403).json({ error: 'No puede crear agenda para otro usuario' });
        // }

        const result = await service.createAsync(entity);
        res.status(201).json({ success: true, message: 'AgendaUsuario creado', id: result });
    } catch (error) {
        console.log('Error en POST /api/agendausuario', error);
        res.status(500).json({ error: 'Error al crear agenda' });
    }
});

router.put('/', async (req, res) => {
    try {
        const entity = req.body;
        const targetUserId = Number(entity.IDUsuario || entity.idUsuario || entity.id_usuario);

        // TEMPORALMENTE DESHABILITADO PARA TESTING
        // REACTIVAR ANTES DE PRODUCCIÓN
        // const requesterId = getRequesterId(req);
        // if (!requesterId) {
        //     return res.status(401).json({ error: 'No autorizado' });
        // }
        // if (!isAdmin(req) && Number(requesterId) !== targetUserId) {
        //     return res.status(403).json({ error: 'No puede modificar la agenda de otro usuario' });
        // }

        const result = await service.updateAsync(entity);
        res.status(200).json({ success: true, message: 'AgendaUsuario actualizado', updated: result });
    } catch (error) {
        console.log('Error en PUT /api/agendausuario', error);
        res.status(500).json({ error: 'Error al actualizar agenda' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;

        const entry = await service.getByIdAsync(id);
        if (!entry) {
            return res.status(404).json({ error: 'Entrada de agenda no encontrada' });
        }

        // TEMPORALMENTE DESHABILITADO PARA TESTING
        // REACTIVAR ANTES DE PRODUCCIÓN
        // const requesterId = getRequesterId(req);
        // if (!requesterId) {
        //     return res.status(401).json({ error: 'No autorizado' });
        // }
        // if (!isAdmin(req) && Number(requesterId) !== Number(entry.IDUsuario)) {
        //     return res.status(403).json({ error: 'No puede eliminar la agenda de otro usuario' });
        // }

        const result = await service.deleteByIdAsync(id);
        res.status(200).json({ success: true, message: 'AgendaUsuario eliminado', deleted: result });
    } catch (error) {
        console.log('Error en DELETE /api/agendausuario/:id', error);
        res.status(500).json({ error: 'Error al eliminar agenda' });
    }
});

//
// Rutas de Feriados Internacionales (integradas en AgendaUsuario)
//

router.get('/feriados/paises', async (req, res) => {
    try {
        const paises = await service.getSupportedCountries();
        res.status(200).json(paises);
    } catch (error) {
        console.log('Error en GET /api/agendaUsuario/feriados/paises', error);
        res.status(400).json({ error: error.message || 'Error al obtener países soportados' });
    }
});

export default router;
