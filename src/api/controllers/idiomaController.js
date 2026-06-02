import express from 'express';
import usuariosService from '../../application/services/usuariosService.js';
import idiomaService from '../../application/services/idiomaService.js';

const router = express.Router();
const usuarioService = new usuariosService();
const idiomaServiceInstance = new idiomaService();

// Controlador de idioma. Expone rutas para idiomas soportados, idioma por país y preferencias de usuario.
router.get('/supported', async (req, res) => {
    try {
        const data = usuarioService.getIdiomasSoportados();
        res.status(200).json({ success: true, data });
    } catch (error) {
        console.log('Error en GET /idioma/supported');
        console.log(error);
        res.status(500).json({ error: error.message || 'Error al obtener idiomas soportados' });
    }
});

router.get('/byCountry', async (req, res) => {
    try {
        const paisId = req.query.paisId || req.query.countryId || req.query.id;
        const nombre = req.query.nombre || req.query.country || req.query.search;

        if (!paisId && !nombre) {
            return res.status(400).json({ error: 'paisId o nombre de país son requeridos' });
        }

        const countryId = paisId ? Number(paisId) : null;
        if (paisId && (Number.isNaN(countryId) || countryId <= 0)) {
            return res.status(400).json({ error: 'paisId inválido' });
        }

        const data = await idiomaServiceInstance.getIdiomaByCountryAsync({ paisId: countryId, nombre });
        res.status(200).json({ success: true, data });
    } catch (error) {
        console.log('Error en GET /idioma/byCountry');
        console.log(error);
        res.status(500).json({ error: error.message || 'Error al obtener idioma por país' });
    }
});

router.get('/byCountry/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (Number.isNaN(id) || id <= 0) {
            return res.status(400).json({ error: 'ID inválido' });
        }

        const data = await idiomaServiceInstance.getIdiomaByCountryAsync({ paisId: id });
        res.status(200).json({ success: true, data });
    } catch (error) {
        console.log('Error en GET /idioma/byCountry/:id');
        console.log(error);
        res.status(500).json({ error: error.message || 'Error al obtener idioma por país' });
    }
});

router.get('/preferred', async (req, res) => {
    try {
        const usuarioId = req.query.usuarioId || req.query.id;
        const detectedLanguage = req.query.detectedLanguage || req.headers['accept-language'];

        if (!usuarioId) {
            return res.status(400).json({ error: 'usuarioId es requerido' });
        }

        const data = await usuarioService.getIdiomaPreferidoConFallbackAsync(parseInt(usuarioId, 10), detectedLanguage);
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

        const data = await usuarioService.cambiarIdiomaAsync(parseInt(usuarioId, 10), codigoIdioma);
        res.status(200).json({ success: true, data });
    } catch (error) {
        console.log('Error en PUT /idioma/preferred');
        console.log(error);
        res.status(500).json({ error: error.message || 'Error al actualizar idioma preferido' });
    }
});

export default router;
