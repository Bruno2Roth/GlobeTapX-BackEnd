import express from 'express';
import paisInfoService from '../../application/services/paisInfoService.js';

// Controlador para exponer los datos de PaisInfo.
// Esta ruta permite buscar por país y también seleccionar campos específicos.
const router = express.Router();
const service = new paisInfoService();

// Normaliza los parámetros de campos solicitados.
// Acepta valores como ?fields=reglas,vidaDiaria o ?field=reglas.
const normalizeFields = (value) => {
    if (!value) {
        return [];
    }

    const rawValues = Array.isArray(value)
        ? value
        : String(value).split(',');

    const canonical = {
        reglas: 'reglas',
        vidaDiaria: 'vidaDiaria',
        vida_diaria: 'vidaDiaria',
        documentacion: 'documentacion',
        documenta: 'documentacion',
        paisNombre: 'paisNombre',
        paisnombre: 'paisNombre',
        id: 'ID',
        idpais: 'IDPais',
        paisid: 'IDPais'
    };

    return Array.from(new Set(rawValues
        .map(v => String(v).trim())
        .filter(v => v.length > 0)
        .map((v) => canonizeField(v, canonical))
        .filter((v) => v !== null)));
};

function canonizeField(value, canonical) {
    const key = value.toString().trim();
    if (Object.prototype.hasOwnProperty.call(canonical, key)) {
        return canonical[key];
    }

    const lower = key.toLowerCase();
    return canonical[lower] || null;
}

const pickFields = (row, fields) => {
    if (!fields || fields.length === 0) {
        return row;
    }

    const result = {};
    fields.forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(row, field)) {
            result[field] = row[field];
        }
    });
    return result;
};

const parsePaisId = (value) => {
    const paisId = Number(value);
    return Number.isInteger(paisId) && paisId > 0 ? paisId : null;
};

const sendDocumentation = (res, data) => {
    if (!data) {
        return res.status(404).json({
            success: false,
            error: 'País no encontrado'
        });
    }

    return res.status(200).json({
        success: true,
        data
    });
};

// Las rutas de documentación deben declararse antes de /:id.
router.get('/:paisId/documentacion', async (req, res, next) => {
    try {
        const paisId = parsePaisId(req.params.paisId);
        if (!paisId) {
            return res.status(400).json({ success: false, error: 'paisId inválido' });
        }

        const data = await service.getDocumentacionByPaisIdAsync(paisId);
        return sendDocumentation(res, data);
    } catch (error) {
        next(error);
    }
});

router.get('/documentacion', async (req, res, next) => {
    try {
        const { paisId, nombre } = req.query;

        if (paisId !== undefined) {
            const parsedPaisId = parsePaisId(paisId);
            if (!parsedPaisId) {
                return res.status(400).json({ success: false, error: 'paisId inválido' });
            }

            const data = await service.getDocumentacionByPaisIdAsync(parsedPaisId);
            return sendDocumentation(res, data);
        }

        if (nombre !== undefined && String(nombre).trim()) {
            const data = await service.getDocumentacionByPaisNameAsync(String(nombre).trim());
            return sendDocumentation(res, data);
        }

        const data = await service.getTodaLaDocumentacionAsync();
        return res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
});

// GET /api/paisInfo
// - sin parámetros devuelve todos los registros de PaisInfo
// - con paisId devuelve los registros para ese país
// - con nombre/country/search permite buscar por nombre de país
// - con fields selecciona solo los campos solicitados
router.get('/', async (req, res, next) => {
    try {
        const { paisId, country, nombre, name, search, fields, field, info } = req.query;
        const normalizedFields = normalizeFields(fields || field || info);

        const getRowsByQuery = async () => {
            if (paisId) {
                return await service.getByPaisIdAsync(paisId);
            }

            const queryText = country || nombre || name || search;
            if (queryText) {
                return await service.getByPaisNameAsync(queryText);
            }

            return await service.getAllAsync();
        };

        const rows = await getRowsByQuery();
        if (normalizedFields.length > 0) {
            return res.json(rows.map((row) => pickFields(row, normalizedFields)));
        }

        return res.json(rows);
    } catch (error) {
        next(error);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const paisInfo = await service.getByIdAsync(req.params.id);
        if (!paisInfo) {
            return res.status(404).json({ message: 'PaisInfo no encontrado' });
        }
        return res.json(paisInfo);
    } catch (error) {
        next(error);
    }
});

export default router;
