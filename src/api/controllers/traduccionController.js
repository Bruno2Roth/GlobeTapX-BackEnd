/**
 * Controller de traducción dinámica
 * Endpoint para traducir texto usando MyMemory API.
 */

import express from 'express';
import traduccionService from '../../application/services/traduccionService.js';

const router = express.Router();
const service = new traduccionService();

router.post('/', async (req, res) => {
    try {
        const { text, targetLanguage, sourceLanguage = 'auto' } = req.body;

        if (!text || !targetLanguage) {
            return res.status(400).json({
                success: false,
                error: 'text y targetLanguage son requeridos'
            });
        }

        const result = await service.translateTextAsync(text, targetLanguage, sourceLanguage);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error en POST /api/traduccion', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Error al traducir el texto'
        });
    }
});

router.post('/batch', async (req, res) => {
    try {
        const { texts, targetLanguage, sourceLanguage = 'auto' } = req.body;

        if (!texts || !Array.isArray(texts) || !targetLanguage) {
            return res.status(400).json({
                success: false,
                error: 'texts (array) y targetLanguage son requeridos'
            });
        }

        const result = await service.translateBatchAsync(texts, targetLanguage, sourceLanguage);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error en POST /api/traduccion/batch', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Error al traducir los textos'
        });
    }
});

export default router;
