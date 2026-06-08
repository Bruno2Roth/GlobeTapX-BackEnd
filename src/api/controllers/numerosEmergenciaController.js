import express from 'express';
import numerosEmergenciaService from '../../application/services/numerosEmergenciaService.js';

const router = express.Router();
const service = new numerosEmergenciaService();

const DISCLAIMER = 'Emergency numbers provided as-is; verify locally.';

function setExpires(res, ms) {
    res.set('Expires', new Date(Date.now() + ms).toUTCString());
}

function isNoDataCountry(obj) {
    if (!obj) return true;
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
        const remote = await service.getCountry(code);
        setExpires(res, 24 * 3600 * 1000);
        if (!remote) return res.status(404).json({ disclaimer: DISCLAIMER, error: 'Not Found', data: {} });
        if (isNoDataCountry(remote)) return res.json({ disclaimer: DISCLAIMER, error: 'No Data for this Territory', data: {} });
        return res.json({ disclaimer: DISCLAIMER, error: null, data: remote });
    } catch (err) {
        return res.status(502).json({ disclaimer: DISCLAIMER, error: err.message || 'Remote Service Error', data: {} });
    }
});

router.get('/data/all', async (req, res) => {
    try {
        const allRemote = await service.getAll();
        setExpires(res, 7 * 24 * 3600 * 1000);
        return res.json({ disclaimer: DISCLAIMER, error: null, data: allRemote });
    } catch (err) {
        return res.status(502).json({ disclaimer: DISCLAIMER, error: err.message || 'Remote Service Error', data: [] });
    }
});

// Alias corto: /api/data/:code
// Alias
router.get('/data/:code', async (req, res) => {
    const code = req.params.code;
    try {
        const remote = await service.getCountry(code);
        setExpires(res, 24 * 3600 * 1000);
        if (!remote) return res.status(404).json({ disclaimer: DISCLAIMER, error: 'Not Found', data: {} });
        if (isNoDataCountry(remote)) return res.json({ disclaimer: DISCLAIMER, error: 'No Data for this Territory', data: {} });
        return res.json({ disclaimer: DISCLAIMER, error: null, data: remote });
    } catch (err) {
        return res.status(502).json({ disclaimer: DISCLAIMER, error: err.message || 'Remote Service Error', data: {} });
    }
});

export default router;
