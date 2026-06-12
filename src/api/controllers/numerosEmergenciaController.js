import express from 'express';
import numerosEmergenciaService from '../../application/services/numerosEmergenciaService.js';
import { extractPaisInfo } from '../../helpers/emergencyPaisHelper.js';

const router = express.Router();
const service = new numerosEmergenciaService();

const MENSAJE = 'Números de emergencia provistos tal cual; verifique localmente.';

function setExpires(res, ms) {
    res.set('Expires', new Date(Date.now() + ms).toUTCString());
}

function isNoDataCountry(obj) {
    if (!obj) return true;
    // Chequear formato nuevo (minúsculas)
    if (obj.ambulance && Array.isArray(obj.ambulance) && obj.ambulance.length) return false;
    if (obj.fire && Array.isArray(obj.fire) && obj.fire.length) return false;
    if (obj.police && Array.isArray(obj.police) && obj.police.length) return false;
    if (obj.dispatch && Array.isArray(obj.dispatch) && obj.dispatch.length) return false;
    // Chequear formato antiguo (mayúsculas)
    const keys = ['Fire', 'Ambulance', 'Police', 'Dispatch'];
    for (const k of keys) {
        const v = obj[k];
        if (!v) continue;
        if (Array.isArray(v.All) && v.All.length) return false;
        if (Array.isArray(v.GSM) && v.GSM.length) return false;
        if (Array.isArray(v.Fixed) && v.Fixed.length) return false;
        if (k === 'Police' && Array.isArray(v.Special) && v.Special.length) return false;
    }
    return true;
}

router.get('/country/:code', async (req, res) => {
    const code = req.params.code;
    try {
        console.log(`numerosEmergenciaController: request for code=${code}, remoteBase=${service.baseRemota}`);
        const remote = await service.getCountry(code);
        console.log(`numerosEmergenciaController: service.getCountry(${code}) returned:`, !!remote);
        setExpires(res, 24 * 3600 * 1000);
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
        setExpires(res, 7 * 24 * 3600 * 1000);
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
        setExpires(res, 24 * 3600 * 1000);
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
