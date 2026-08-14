import multer from 'multer';
import { sendPublicError } from '../errors.js';
import { MIME_EXTENSIONS, MAX_PROFILE_PHOTO_BYTES } from '../../application/services/storageService.js';

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: MAX_PROFILE_PHOTO_BYTES,
        files: 1,
        fields: 0,
        parts: 1,
    },
    fileFilter: (req, file, callback) => {
        if (file.fieldname !== 'fotoPerfil') {
            return callback(new Error('INVALID_PHOTO_FIELD'));
        }

        if (!Object.prototype.hasOwnProperty.call(MIME_EXTENSIONS, file.mimetype)) {
            return callback(new Error('INVALID_PHOTO_TYPE'));
        }

        return callback(null, true);
    },
});

export const parseProfilePhoto = (req, res, next) => {
    if (!req.is('multipart/form-data')) {
        return res.status(400).json({
            success: false,
            message: 'La foto debe enviarse como multipart/form-data',
        });
    }

    return upload.single('fotoPerfil')(req, res, (error) => {
        if (error) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    message: 'La foto no puede superar los 5 MB',
                });
            }

            if (
                error.code === 'LIMIT_UNEXPECTED_FILE'
                || error.code === 'LIMIT_FIELD_COUNT'
                || error.message === 'INVALID_PHOTO_FIELD'
                || error.message === 'INVALID_PHOTO_TYPE'
            ) {
                return res.status(400).json({
                    success: false,
                    message: error.message === 'INVALID_PHOTO_TYPE'
                        ? 'Formato de foto no válido'
                        : 'La foto debe enviarse en el campo fotoPerfil',
                });
            }

            return sendPublicError(res, error, 'Formato de foto no válido');
        }

        return next();
    });
};

export const getUploadedPhoto = (req) => req.file || null;
