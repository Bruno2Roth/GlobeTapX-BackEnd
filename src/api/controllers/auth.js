import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import usuariosService from '../../application/services/usuariosService.js';
import authMiddleware from '../../api/middlewares/auth.js';
import {
    toPublicUser,
} from '../../application/dtos/userProfile.js';
import { resolveLanguageForWrite } from '../../idiomas/index.js';
import {
    BadRequestError,
    ServiceUnavailableError,
    sendPublicError,
    logInternalError,
} from '../errors.js';

const router = express.Router();
const service = new usuariosService();

const isNonEmptyString = value => typeof value === 'string' && value.trim().length > 0;
const validateMail = (mail) => {
    if (!isNonEmptyString(mail)) return null;
    const normalized = mail.trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : null;
};

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, message: 'Demasiados intentos de inicio de sesión' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: req => `${ipKeyGenerator(req.ip)}_${req.body?.mail || req.body?.email || 'unknown'}`,
});

const validateLoginBody = (req, res, next) => {
    const body = req.body || {};
    const mail = validateMail(body.mail || body.email);
    const password = body.contrasena ?? body.password;

    if (!mail || !isNonEmptyString(password)) {
        return res.status(400).json({ success: false, message: 'Solicitud no válida' });
    }

    req.validatedBody = { mail, contrasena: String(password).trim() };
    return next();
};

const validateRegisterBody = (req, res, next) => {
    const body = req.body || {};
    const nombre = body.nombre || body.nombreCompleto;
    const mail = validateMail(body.mail || body.email);
    const password = body.contrasena ?? body.password;
    const language = body.idiomaId
        ?? body.idiomaPreferido
        ?? body.codigoIdioma
        ?? body.language
        ?? 'es';
    const photo = body.fotoPerfil ?? body.foto ?? body.photo ?? body.image ?? body.profileImage;

    if (!isNonEmptyString(nombre) || !mail || !isNonEmptyString(password)) {
        return res.status(400).json({ success: false, message: 'Solicitud no válida' });
    }
    const languageInfo = resolveLanguageForWrite(language);
    if (!languageInfo) {
        return res.status(400).json({ success: false, message: 'Solicitud no válida' });
    }
    // Las fotos se reciben únicamente por PUT multipart/form-data.
    if (photo !== undefined && photo !== null && String(photo).trim() !== '') {
        return res.status(400).json({ success: false, message: 'La foto debe enviarse como multipart/form-data' });
    }

    req.validatedBody = {
        nombre: String(nombre).trim(),
        nombreCompleto: String(body.nombreCompleto || nombre).trim(),
        mail,
        contrasena: String(password).trim(),
        numeroContacto: body.numeroContacto ? String(body.numeroContacto).trim() : null,
        // Se persiste el ID estable; la API pública sigue exponiendo el código.
        idiomaPreferido: String(languageInfo.id),
        paisActual: body.paisActual ?? null,
        fotoPerfil: null,
        isAdmin: false,
        esPremium: false,
    };
    return next();
};

const tokenClaims = (user) => {
    const id = Number(user?.ID ?? user?.id);
    if (!Number.isInteger(id) || id <= 0) {
        throw new BadRequestError('Solicitud no válida');
    }

    return {
        id,
        isAdmin: user?.isAdmin === true || user?.isAdmin === 'true' || user?.isAdmin === 'TRUE',
        esPremium: user?.esPremium === true || user?.esPremium === 'true' || user?.esPremium === 'TRUE',
    };
};

const signToken = (user) => {
    if (!process.env.JWT_SECRET) {
        throw new ServiceUnavailableError('Servicio temporalmente no disponible', {
            code: 'AUTH_CONFIG_UNAVAILABLE',
            internalMessage: 'JWT_SECRET no está configurado',
        });
    }

    return jwt.sign(tokenClaims(user), process.env.JWT_SECRET, {
        expiresIn: '7d',
        algorithm: 'HS256',
    });
};

const publicUserOrError = (user, req) => {
    const result = toPublicUser(user, req);
    if (!result?.id) throw new BadRequestError('Solicitud no válida');
    return result;
};

router.get('/foto/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ success: false, message: 'Solicitud no válida' });
    }

    try {
        const record = await service.getProfilePhotoByIdAsync(id);
        const storedPath = record?.fotoPath && !/^data:/i.test(String(record.fotoPath))
            ? record.fotoPath
            : null;
        const fotoPerfil = storedPath ? await service.getFotoPerfilUrlAsync(storedPath) : null;
        return res.status(200).json({
            success: true,
            fotoPerfil,
            fotoPath: storedPath,
        });
    } catch (error) {
        logInternalError('GET /api/auth/foto/:id', error);
        return sendPublicError(res, error, 'No se pudo obtener la foto');
    }
});

router.get('/status', (req, res) => {
    const headerToken = authMiddleware.extractBearerToken(req);
    const queryToken = typeof req.query.token === 'string' ? req.query.token : null;
    const payload = authMiddleware.verifyBearerToken(headerToken || queryToken);

    if (!payload) return res.status(200).json({ authenticated: false });
    return res.status(200).json({
        authenticated: true,
        user: { id: payload.id },
    });
});

router.get('/me', authMiddleware.required, async (req, res) => {
    try {
        const user = await service.getProfileByIdAsync(req.user.id);
        if (!user) {
            return res.status(401).json({ success: false, message: 'No autorizado' });
        }

        return res.status(200).json({
            success: true,
            user: publicUserOrError(user, req),
        });
    } catch (error) {
        logInternalError('GET /api/auth/me', error);
        return sendPublicError(res, error, 'No se pudo obtener el perfil');
    }
});

router.post('/login', loginLimiter, validateLoginBody, async (req, res) => {
    try {
        const { mail, contrasena } = req.validatedBody;
        const user = await service.getBymailAsync(mail);
        if (!user) return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });

        const stored = user.contrasena ?? user.password;
        const isBcryptHash = typeof stored === 'string' && /^\$2[aby]\$\d{2}\$/.test(stored);
        const matches = isBcryptHash
            ? await bcrypt.compare(contrasena, stored)
            : typeof stored === 'string' && stored.trim() === contrasena;

        if (!matches) return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });

        const token = signToken(user);
        return res.status(200).json({
            success: true,
            token,
            user: publicUserOrError(user, req),
        });
    } catch (error) {
        logInternalError('POST /api/auth/login', error);
        return sendPublicError(res, error, 'No se pudo iniciar sesión');
    }
});

router.post('/register', validateRegisterBody, async (req, res) => {
    try {
        const entity = req.validatedBody;
        entity.contrasena = await bcrypt.hash(entity.contrasena, 10);
        await service.createAsync(entity);

        const user = await service.getBymailAsync(entity.mail);
        const token = signToken(user);

        return res.status(201).json({
            success: true,
            token,
            user: publicUserOrError(user, req),
        });
    } catch (error) {
        logInternalError('POST /api/auth/register', error);
        if (error?.name === 'DuplicateError' || error?.code === 'UsuarioDuplicado') {
            return res.status(400).json({ success: false, message: 'Solicitud no válida' });
        }
        return sendPublicError(res, error, 'No se pudo registrar el usuario');
    }
});

export default router;
