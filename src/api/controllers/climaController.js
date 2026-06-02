import express from 'express';
import climaService from '../../application/services/climaService.js';

const router = express.Router();
const service = new climaService();

// Controlador de clima. Maneja información meteorológica local y por país.
router.get('/user-info', async (req, res) => {
    try {
        const data = await service.getUserInfoAsync();
        res.status(200).json(data);
    } catch (error) {
        console.log('Error en GET /api/clima/user-info');
        console.log(error);
        res.status(400).json({ error: error.message || 'Error al obtener la información de clima' });
    }
});

router.get('/country', async (req, res) => {
    try {
        const { country } = req.query;
        const data = await service.getWeatherByCountryAsync(country);
        res.status(200).json(data);
    } catch (error) {
        console.log('Error en GET /api/clima/country');
        console.log(error);
        res.status(400).json({ error: error.message || 'Error al obtener el clima del país' });
    }
});

export default router;
