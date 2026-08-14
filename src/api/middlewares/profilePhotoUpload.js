import multer from 'multer';

/**
 * Parser común para fotos de perfil.
 *
 * Se usa memoryStorage porque el archivo se envía directamente a Supabase;
 * no se dejan archivos temporales en el disco del backend.
 */
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, callback) => {
        if (!file.mimetype || !file.mimetype.startsWith('image/')) {
            return callback(new Error('Solo se permiten archivos de imagen'));
        }
        return callback(null, true);
    },
});

/** Acepta los nombres usados por clientes antiguos y nuevos. */
export const parseProfilePhoto = (req, res, next) => {
    upload.fields([
        { name: 'fotoPerfil', maxCount: 1 },
        { name: 'foto', maxCount: 1 },
        { name: 'photo', maxCount: 1 },
        { name: 'image', maxCount: 1 },
    ])(req, res, (error) => {
        if (error) {
            return res.status(400).json({ error: error.message || 'Foto inválida' });
        }
        return next();
    });
};

/** Extrae el primer archivo recibido del campo que haya usado el frontend. */
export const getUploadedPhoto = (req) => {
    const files = Object.values(req.files || {}).flat();
    return files[0] || null;
};
