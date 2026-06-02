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
        'vida diaria': 'vidaDiaria',
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
