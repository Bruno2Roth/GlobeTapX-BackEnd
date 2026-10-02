import express from 'express';
import climaService from '../../application/services/climaService.js';
import { logInternalError, sendPublicError } from '../errors.js';

const router = express.Router();
const service = new climaService();

// Controlador de clima. Maneja información meteorológica local y por país.
router.get('/user-info', async (req, res) => {
    try {
        const data = await service.getUserInfoAsync();
        res.status(200).json(data);
    } catch (error) {
        logInternalError('GET /api/clima/user-info', error);
        return sendPublicError(res, error, 'Error al obtener la información de clima');
    }
});

router.get('/country', async (req, res) => {
    try {
        const { country } = req.query;
        const data = await service.getWeatherByCountryAsync(country);
        res.status(200).json(data);
    } catch (error) {
        logInternalError('GET /api/clima/country', error);
        return sendPublicError(res, error, 'Error al obtener el clima del país');
    }
});

export default router;
