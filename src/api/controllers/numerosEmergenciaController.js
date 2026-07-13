import express from 'express';
import numerosEmergenciaService from '../../application/services/numerosEmergenciaService.js';
import { extractPaisInfo } from '../../helpers/emergencyPaisHelper.js';

const router = express.Router();
const service = new numerosEmergenciaService();

const MENSAJE = 'Números de emergencia provistos tal cual; verifique localmente.';

function hasDataValue(value) {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'string') return value.trim().length > 0;
    if (typeof value === 'object' && value !== null) {
        return Object.values(value).some(hasDataValue);
    }
    return false;
}

function isNoDataCountry(obj) {
    if (!obj) return true;

    const keys = [
        'ambulance',
        'fire',
        'firedepartment',
        'fireDepartment',
        'police',
        'dispatch',
        'emergencydispatch',
        'emergencyDispatch',
        'emergency_dispatch',
    ];

    for (const key of keys) {
        if (hasDataValue(obj[key])) return false;
    }

    // Also consider any nested object values for backward-compatible formats
    return !Object.values(obj).some(hasDataValue);
}

router.get('/country/:code', async (req, res) => {
    const code = req.params.code;
    try {
        console.log(`numerosEmergenciaController: request for code=${code}, remoteBase=${service.baseRemota}`);
        const remote = await service.getCountry(code);
        console.log(`numerosEmergenciaController: service.getCountry(${code}) returned:`, !!remote);
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.set('X-EM-Source', service.baseRemota);
        if (!remote) return res.status(404).json({ mensaje: MENSAJE, error: 'No encontrado', data: {}, pais: null });
        if (isNoDataCountry(remote)) return res.json({ mensaje: MENSAJE, error: 'Sin datos para este territorio', data: {}, pais: null });
        const pais = await extractPaisInfo(code, remote);
        return res.json({ mensaje: MENSAJE, error: null, data: remote, pais });
    } catch (err) {
        return res.status(502).json({ mensaje: MENSAJE, error: err.message || 'Error en servicio remoto', data: {}, pais: null });
    }
});

router.get('/data/all', async (req, res) => {
    try {
        const allRemote = await service.getAll();
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        return res.json({ mensaje: MENSAJE, error: null, data: allRemote });
    } catch (err) {
        return res.status(502).json({ mensaje: MENSAJE, error: err.message || 'Error en servicio remoto', data: [] });
    }
});

// Alias corto: /api/data/:code
// Alias
router.get('/data/:code', async (req, res) => {
    const code = req.params.code;
    try {
        console.log(`numerosEmergenciaController: alias request for code=${code}, remoteBase=${service.baseRemota}`);
        const remote = await service.getCountry(code);
        console.log(`numerosEmergenciaController: service.getCountry(${code}) returned:`, !!remote);
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.set('X-EM-Source', service.baseRemota);
        if (!remote) return res.status(404).json({ mensaje: MENSAJE, error: 'No encontrado', data: {}, pais: null });
        if (isNoDataCountry(remote)) return res.json({ mensaje: MENSAJE, error: 'Sin datos para este territorio', data: {}, pais: null });
        const pais = await extractPaisInfo(code, remote);
        return res.json({ mensaje: MENSAJE, error: null, data: remote, pais });
    } catch (err) {
        return res.status(502).json({ mensaje: MENSAJE, error: err.message || 'Error en servicio remoto', data: {}, pais: null });
    }
});

export default router;
