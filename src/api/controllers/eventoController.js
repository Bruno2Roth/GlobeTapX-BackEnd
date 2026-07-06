import express from 'express';
import eventosService from '../../application/services/eventoService.js';
import estadisticasService from '../../application/services/estadisticasService.js';

const router = express.Router();
const service = new eventosService();
const statsService = new estadisticasService();

const validarEvento = (body, parcial) => {
    const errores = [];
    if (!parcial || body.nombre !== undefined) {
        if (!body.nombre || typeof body.nombre !== 'string' || !body.nombre.trim()) {
            errores.push('nombre es requerido');
        }
    }
    if (!parcial || body.fechaInicio !== undefined) {
        if (!body.fechaInicio) {
            errores.push('fechaInicio es requerida');
        } else if (isNaN(Date.parse(body.fechaInicio))) {
            errores.push('fechaInicio no es una fecha válida');
        }
    }
    if (body.fechaFin !== undefined && body.fechaFin) {
        if (isNaN(Date.parse(body.fechaFin))) {
            errores.push('fechaFin no es una fecha válida');
        }
    }
    if (body.IDPais !== undefined && body.IDPais !== null) {
        const id = Number(body.IDPais);
        if (!Number.isInteger(id) || id <= 0) {
            errores.push('IDPais debe ser un número positivo');
        }
    }
    return errores;
};

router.get('/', async (req, res) => {
    try {
        const data = await service.getAllAsync();
        res.json(data);
    } catch (err) {
        console.log('Error obteniendo eventos', err);
        res.status(500).json({ error: err.message || 'Error al obtener eventos' });
    }
});

router.get('/pais/:idPais', async (req, res) => {
    try {
        const idPais = Number(req.params.idPais);
        if (!Number.isInteger(idPais) || idPais <= 0) {
            return res.status(400).json({ error: 'ID de país inválido' });
        }
        const data = await service.getByPaisAsync(idPais);
        res.json(data);
    } catch (err) {
        console.log('Error obteniendo eventos por país', err);
        res.status(500).json({ error: err.message || 'Error al obtener eventos por país' });
    }
});

router.get('/categoria/:idCategoria', async (req, res) => {
    try {
        const idCategoria = Number(req.params.idCategoria);
        if (!Number.isInteger(idCategoria) || idCategoria <= 0) {
            return res.status(400).json({ error: 'ID de categoría inválido' });
        }
        const data = await service.getByCategoriaAsync(idCategoria);
        res.json(data);
    } catch (err) {
        console.log('Error obteniendo eventos por categoría', err);
        res.status(500).json({ error: err.message || 'Error al obtener eventos por categoría' });
    }
});

router.get('/fecha', async (req, res) => {
    try {
        const { desde, hasta } = req.query;
        if (!desde) {
            return res.status(400).json({ error: 'Parámetro "desde" es requerido (YYYY-MM-DD)' });
        }
        if (!hasta) {
            return res.status(400).json({ error: 'Parámetro "hasta" es requerido (YYYY-MM-DD)' });
        }
        if (isNaN(Date.parse(desde)) || isNaN(Date.parse(hasta))) {
            return res.status(400).json({ error: 'Formato de fecha inválido. Use YYYY-MM-DD' });
        }
        const data = await service.getByFechaAsync(desde, hasta);
        res.json(data);
    } catch (err) {
        console.log('Error obteniendo eventos por fecha', err);
        res.status(500).json({ error: err.message || 'Error al obtener eventos por fecha' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: 'ID de evento inválido' });
        }
        const data = await service.getByIdAsync(id);
        if (!data) {
            return res.status(404).json({ error: 'Evento no encontrado' });
        }
        res.json(data);
    } catch (err) {
        console.log('Error obteniendo evento', err);
        res.status(500).json({ error: err.message || 'Error al obtener evento' });
    }
});

router.post('/', async (req, res) => {
    try {
        const errores = validarEvento(req.body);
        if (errores.length) {
            return res.status(400).json({ error: 'Datos inválidos', detalles: errores });
        }
        const id = await service.createAsync(req.body);
        const usuarioId = req.body.IDUsuario || req.body.idUsuario;
        if (usuarioId) {
            await statsService.logEventoAsync(usuarioId, 'creacion_expedicion', {
                idEvento: id?.ID || id,
                nombre: req.body.nombre,
            });
        }
        res.status(201).json({ success: true, message: 'Evento creado', id });
    } catch (err) {
        console.log('Error creando evento', err);
        res.status(500).json({ error: err.message || 'Error al crear evento' });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: 'ID de evento inválido' });
        }
        const errores = validarEvento(req.body, true);
        if (errores.length) {
            return res.status(400).json({ error: 'Datos inválidos', detalles: errores });
        }
        const entity = { ID: id, ...req.body };
        const updated = await service.updateAsync(entity);
        if (!updated) {
            return res.status(404).json({ error: 'Evento no encontrado' });
        }
        res.status(200).json({ success: true, message: 'Evento actualizado', updated });
    } catch (err) {
        console.log('Error actualizando evento', err);
        res.status(500).json({ error: err.message || 'Error al actualizar evento' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: 'ID de evento inválido' });
        }
        const deleted = await service.deleteByIdAsync(id);
        if (!deleted) {
            return res.status(404).json({ error: 'Evento no encontrado' });
        }
        res.status(200).json({ success: true, message: 'Evento eliminado', deleted });
    } catch (err) {
        console.log('Error eliminando evento', err);
        res.status(500).json({ error: err.message || 'Error al eliminar evento' });
    }
});

export default router;
