import express from 'express';
import traduccionService from '../../application/services/traduccionService.js';
import { logInternalError, sendPublicError } from '../errors.js';

const router = express.Router();
const service = new traduccionService();

const hasValue = value => value !== undefined && value !== null && String(value).trim() !== '';

router.post('/', async (req, res) => {
    try {
        const body = req.body || {};
        const reference = body.tagId ?? body.text;
        const targetLanguage = body.idiomaId ?? body.targetLanguage ?? body.codigoIdioma;

        if (!hasValue(reference) || !hasValue(targetLanguage)) {
            return res.status(400).json({
                success: false,
                message: 'Solicitud no válida',
            });
        }

        const text = body.tagId !== undefined
            ? { tagId: body.tagId, text: body.text ?? body.tagId }
            : body.text;
        const result = await service.translateTextAsync(
            text,
            targetLanguage,
            body.sourceLanguage || 'auto',
        );

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        logInternalError('POST /api/traduccion', error);
        return sendPublicError(res, error, 'No se pudo obtener el texto');
    }
});

router.post('/batch', async (req, res) => {
    try {
        const body = req.body || {};
        const targetLanguage = body.idiomaId ?? body.targetLanguage ?? body.codigoIdioma;
        let texts = body.texts;

        if (!Array.isArray(texts) && Array.isArray(body.tagIds)) {
            texts = body.tagIds.map(tagId => ({ tagId }));
        }

        if (!Array.isArray(texts) || !texts.length || !hasValue(targetLanguage)) {
            return res.status(400).json({
                success: false,
                message: 'Solicitud no válida',
            });
        }

        const result = await service.translateBatchAsync(
            texts,
            targetLanguage,
            body.sourceLanguage || 'auto',
        );

        return res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        logInternalError('POST /api/traduccion/batch', error);
        return sendPublicError(res, error, 'No se pudieron obtener los textos');
    }
});

export default router;
