import express from 'express';
import currencyService from '../../application/services/currencyService.js';

const router = express.Router();
const service = new currencyService();

router.get('/country', async (req, res) => {
    try {
        const { country } = req.query;
        if (!country) {
            return res.status(400).json({ error: 'Parámetro country es obligatorio' });
        }
        const data = await service.getCurrencyByCountryAsync(country);
        res.status(200).json(data);
    } catch (error) {
        console.log('Error en GET /api/currency/country');
        console.log(error);
        res.status(400).json({ error: error.message || 'Error al obtener moneda del país' });
    }
});

router.get('/convert', async (req, res) => {
    try {
        const { from, to, amount } = req.query;
        const data = await service.convertAsync(from, to, amount);
        res.status(200).json(data);
    } catch (error) {
        console.log('Error en GET /api/currency/convert');
        console.log(error);
        res.status(400).json({ error: error.message || 'Error al convertir moneda' });
    }
});

export default router;
