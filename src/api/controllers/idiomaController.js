import express from 'express';
import usuariosService from '../../application/services/usuariosService.js';

const router = express.Router();
const service = new usuariosService();

router.get('/supported', async (req, res) => {
    try {
        const data = service.getIdiomasSoportados();
        res.status(200).json({ success: true, data });
    } catch (error) {
        console.log('Error en GET /idioma/supported');
        console.log(error);
        res.status(500).json({ error: error.message || 'Error al obtener idiomas soportados' });
    }
});

router.get('/preferred', async (req, res) => {
    try {
        const usuarioId = req.query.usuarioId || req.query.id;
        const detectedLanguage = req.query.detectedLanguage || req.headers['accept-language'];

        if (!usuarioId) {
            return res.status(400).json({ error: 'usuarioId es requerido' });
        }

        const data = await service.getIdiomaPreferidoConFallbackAsync(parseInt(usuarioId, 10), detectedLanguage);
        res.status(200).json({ success: true, data });
    } catch (error) {
        console.log('Error en GET /idioma/preferred');
        console.log(error);
        res.status(500).json({ error: error.message || 'Error al obtener idioma preferido' });
    }
});

router.put('/preferred', async (req, res) => {
    try {
        const { usuarioId, codigoIdioma } = req.body;

        if (!usuarioId || !codigoIdioma) {
            return res.status(400).json({ error: 'usuarioId y codigoIdioma son requeridos' });
        }

        const data = await service.cambiarIdiomaAsync(parseInt(usuarioId, 10), codigoIdioma);
        res.status(200).json({ success: true, data });
    } catch (error) {
        console.log('Error en PUT /idioma/preferred');
        console.log(error);
        res.status(500).json({ error: error.message || 'Error al actualizar idioma preferido' });
    }
});

export default router;
