import express from 'express';
import usuariosService from '../../application/services/usuariosService.js';
import idiomaService from '../../application/services/idiomaService.js';
import traduccionService from '../../application/services/traduccionService.js';
import authMiddleware from '../middlewares/auth.js';
import { sendPublicError } from '../errors.js';
import { resolveUserIdFromToken } from '../middlewares/authorization.js';

const router = express.Router();
const usuarioService = new usuariosService();
const idiomaServiceInstance = new idiomaService();
const traduccionServiceInstance = new traduccionService();

router.get('/supported', async (req, res) => {
    try {
        const data = await idiomaServiceInstance.getIdiomasSoportadosAsync();
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return sendPublicError(res, error, 'No se pudieron obtener los idiomas');
    }
});

router.get('/translations', async (req, res) => {
    try {
        const lang = req.query.idiomaId || req.query.lang || req.query.codigoIdioma || 'es';
        const data = await traduccionServiceInstance.getTraduccionesPorIdiomaAsync(lang);
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return sendPublicError(res, error, 'No se pudieron obtener las traducciones');
    }
});

router.get('/catalogo', async (req, res) => {
    try {
        const data = await idiomaServiceInstance.getIdiomasSoportadosAsync();
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return sendPublicError(res, error, 'No se pudieron obtener los idiomas');
    }
});

router.get('/catalogo/:idiomaId/tag/:tagId', async (req, res) => {
    try {
        const data = traduccionServiceInstance.getTagIdioma(
            req.params.idiomaId,
            req.params.tagId,
        );
        return res.status(200).json({ success: true, ...data });
    } catch (error) {
        return sendPublicError(res, error, 'No se pudo obtener el texto');
    }
});

router.get('/catalogo/:idiomaId', async (req, res) => {
    try {
        const idioma = traduccionServiceInstance.getCatalogoIdioma(req.params.idiomaId);
        return res.status(200).json({ success: true, idioma });
    } catch (error) {
        return sendPublicError(res, error, 'No se pudo obtener el catalogo');
    }
});

router.get('/byCountry', async (req, res) => {
    const paisId = req.query.paisId || req.query.countryId || req.query.id;
    const nombre = req.query.nombre || req.query.country || req.query.search;
    if (!paisId && !nombre) {
        return res.status(400).json({ success: false, message: 'Solicitud no valida' });
    }

    const countryId = paisId ? Number(paisId) : null;
    if (paisId && (!Number.isInteger(countryId) || countryId <= 0)) {
        return res.status(400).json({ success: false, message: 'Solicitud no valida' });
    }

    try {
        const data = await idiomaServiceInstance.getIdiomaByCountryAsync({ paisId: countryId, nombre });
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return sendPublicError(res, error, 'No se pudo obtener el idioma del pais');
    }
});

router.get('/byCountry/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ success: false, message: 'Solicitud no valida' });
    }

    try {
        const data = await idiomaServiceInstance.getIdiomaByCountryAsync({ paisId: id });
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return sendPublicError(res, error, 'No se pudo obtener el idioma del pais');
    }
});

// El usuario normal siempre queda ligado al ID del token. Un administrador
// puede consultar otra cuenta únicamente porque el JWT verificado lo permite.
router.get('/preferred', authMiddleware.required, async (req, res) => {
    const id = resolveUserIdFromToken(
        req,
        res,
        req.query.usuarioId || req.query.id,
        { allowAdminTarget: true },
    );
    if (!id) return null;

    try {
        const data = await usuarioService.getIdiomaPreferidoConFallbackAsync(
            id,
            req.query.detectedLanguage || req.headers['accept-language'],
        );
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return sendPublicError(res, error, 'No se pudo obtener el idioma preferido');
    }
});

router.put('/preferred', authMiddleware.required, async (req, res) => {
    const id = resolveUserIdFromToken(
        req,
        res,
        req.body?.usuarioId,
        { allowAdminTarget: true },
    );
    if (!id) return null;

    const idiomaId = req.body?.idiomaId;
    const codigoIdioma = req.body?.codigoIdioma;
    const languageReference = idiomaId ?? codigoIdioma;
    const validLanguageReference = (
        typeof languageReference === 'string' && languageReference.trim().length > 0
    ) || (
        Number.isInteger(languageReference) && languageReference > 0
    );

    if (!validLanguageReference) {
        return res.status(400).json({ success: false, message: 'Solicitud no valida' });
    }

    try {
        const data = await usuarioService.cambiarIdiomaAsync(id, codigoIdioma, idiomaId);
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return sendPublicError(res, error, 'No se pudo actualizar el idioma preferido');
    }
});

export default router;
