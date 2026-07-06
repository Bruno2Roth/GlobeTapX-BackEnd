import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import usuariosService from '../../application/services/usuariosService.js';
import authMiddleware from '../../api/middlewares/auth.js';

const router = express.Router();
const service = new usuariosService();

// ──────────────────────────────────────────────
// VALIDACIONES DE ENTRADA
// ──────────────────────────────────────────────

const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;

const validatemail = (mail) => {
    if (!mail || typeof mail !== 'string') return null;
    const trimmed = mail.trim();
    const mailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return mailRegex.test(trimmed) ? trimmed : null;
};

// ──────────────────────────────────────────────
// RATE LIMITER — Limita intentos de login
// ──────────────────────────────────────────────
// Clave única por IP + mail: si un atacante prueba
// combinaciones, cada mail diferente tiene su propio
// contador de 10 intentos cada 15 minutos.
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,   // ventana de 15 min
    max: 10,                    // máx 10 intentos por ventana
    message: { error: 'Demasiados intentos de inicio de sesión. Intente de nuevo en 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return ipKeyGenerator(req) + '_' + (req.body?.mail || req.body?.mail || 'unknown');
    },
});

// ──────────────────────────────────────────────
// MIDDLEWARES DE VALIDACIÓN
// ──────────────────────────────────────────────
// Aceptan tanto nombres en inglés como en español
// (mail/mail, contrasena, nombre/nombreCompleto)
// para ser tolerantes con distintos clientes.

const validateLoginBody = (req, res, next) => {
    const body = req.body || {};
    const mail = validatemail(body.mail || body.mail);
    const contrasena = body.contrasena;

    if (!mail) {
        return res.status(400).json({ error: 'mail válido es requerido' });
    }
    if (!isNonEmptyString(contrasena)) {
        return res.status(400).json({ error: 'Contraseña es requerida' });
    }

    req.validatedBody = { mail, contrasena: String(contrasena).trim() };
    return next();
};

const validateRegisterBody = (req, res, next) => {
    const body = req.body || {};
    const nombre = body.nombre || body.nombreCompleto;
    const mail = validatemail(body.mail || body.mail);
    const contrasena = body.contrasena || body.contrasena;

    if (!isNonEmptyString(nombre)) {
        return res.status(400).json({ error: 'El nombre es requerido' });
    }
    if (!mail) {
        return res.status(400).json({ error: 'mail válido es requerido' });
    }
    if (!isNonEmptyString(contrasena)) {
        return res.status(400).json({ error: 'Contraseña es requerida' });
    }

    const optionalFields = {
        nombreCompleto: body.nombreCompleto ? String(body.nombreCompleto).trim() : null,
        numeroContacto: body.numeroContacto ? String(body.numeroContacto).trim() : null,
        idiomaPreferido: body.idiomaPreferido || null,
        paisActual: body.paisActual || null,
        fotoPerfil: body.fotoPerfil || null,
        isAdmin: false,
        esPremium: false,
    };

    req.validatedBody = {
        nombre: String(nombre).trim(),
        mail,
        contrasena: String(contrasena).trim(),
        ...optionalFields,
    };
    return next();
};

// ──────────────────────────────────────────────
// CONSTRUCCIÓN DEL PAYLOAD JWT
// ──────────────────────────────────────────────
// Extrae del usuario de BD los campos que se
// incluirán en el token. Soporta naming tanto
// de BD (mail, contrasena) como de cliente
// (mail, contrasena) mediante fallbacks.

const buildUserPayload = (user) => ({
    id: user.ID,
    mail: user.mail,
    nombre: user.nombre,
    isAdmin: user.isAdmin ?? false,
    esPremium: user.esPremium ?? false,
    paisActual: user.paisActual ?? null,
});


// ──────────────────────────────────────────────
// GET /api/auth/foto/:id — Foto de perfil pública
// ──────────────────────────────────────────────
router.get('/foto/:id', async (req, res) => {
    try {
        const user = await service.getByIdAsync(req.params.id);
        if (!user || !user.fotoPerfil) {
            return res.status(404).json({ error: 'Foto no encontrada' });
        }
        res.json({ fotoPerfil: user.fotoPerfil });
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener la foto' });
    }
});

// ──────────────────────────────────────────────
// GET /api/auth/status — Verifica estado del token
// ──────────────────────────────────────────────
// Útil para que el frontend compruebe si la sesión
// sigue activa al recargar la página. Acepta el
// token por query string o por header Authorization.
router.get('/status', (req, res) => {
    const token = req.query.token || (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);
    if (!token) return res.json({ authenticated: false });
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        return res.json({ authenticated: true, user: payload });
    } catch (err) {
        return res.json({ authenticated: false });
    }
});

// ──────────────────────────────────────────────
// GET /api/auth/me — Devuelve el usuario autenticado
// ──────────────────────────────────────────────
// Requiere token JWT válido en header Authorization.
// authMiddleware.required se encarga de verificar
// el token y poblar req.user antes de llegar aquí.
router.get('/me', authMiddleware.required, (req, res) => {
    return res.status(200).json({ authenticated: true, user: req.user });
});

// ──────────────────────────────────────────────
// POST /api/auth/login — Inicio de sesión
// ──────────────────────────────────────────────
// 1. Pasa por rate limiter (10 intentos/15 min por IP+mail)
// 2. Valida mail y contraseña con validateLoginBody
// 3. Busca el usuario por mail en BD
// 4. Compara contraseña: soporta bcrypt (hash) y texto plano
// 5. Genera JWT con expiración de 7 días
// 6. Devuelve { token, user }
router.post('/login', loginLimiter, validateLoginBody, async (req, res) => {
    console.log('POST /api/auth/login');
    try {
        const { mail, contrasena } = req.validatedBody;

        const user = await service.getBymailAsync(mail);
        if (!user) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        // Comparar contraseña (soporta bcrypt y texto plano)
        const stored = user.contrasena || user.contrasena;
        const coincide = stored.startsWith('$2b$') || stored.startsWith('$2a$') || stored.startsWith('$2y$')
            ? await bcrypt.compare(contrasena, stored)
            : String(stored) === String(contrasena);

        if (!coincide) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 3600;
        const payload = buildUserPayload(user);
        const token = jwt.sign({ ...payload, exp }, process.env.JWT_SECRET, { noTimestamp: true });
        if (token.length > 5000) {
            return res.status(500).json({ error: "Token generado demasiado grande" });
        }

        return res.status(200).json({ token, user: payload });
    } catch (error) {
        console.log('Error en login:', error);
        res.status(500).json({ error: error.message || 'Error en el inicio de sesión' });
    }
});

// ──────────────────────────────────────────────
// POST /api/auth/register — Registro de nuevo usuario
// ──────────────────────────────────────────────
// 1. Valida nombre, mail y contraseña con validateRegisterBody
// 2. Hashea la contraseña con bcrypt (10 rondas)
// 3. Crea el usuario en BD a través de usuariosService.createAsync
// 4. Vuelve a buscar el usuario para obtener el ID generado
// 5. Genera JWT con expiración de 7 días
// 6. Devuelve { token, user, message } con status 201
// Maneja errores de validación (400) y usuario duplicado (409)
router.post('/register', validateRegisterBody, async (req, res) => {
    console.log('POST /api/auth/register');

    try {
        console.log("BODY RECIBIDO:");
        console.log(req.body);

        console.log("BODY VALIDADO:");
        console.log(req.validatedBody);

        const entity = req.validatedBody;
        console.log("ENTITY:");
        console.log(entity);
        entity.contrasena = await bcrypt.hash(entity.contrasena, 10);

        console.log("ENTITY FINAL:");
        console.log(entity);

        await service.createAsync(entity);

        const user = await service.getBymailAsync(entity.mail);

        const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 3600;
        const payload = buildUserPayload(user);
        const token = jwt.sign({ ...payload, exp }, process.env.JWT_SECRET, { noTimestamp: true });
        if (token.length > 5000) {
            return res.status(500).json({ error: "Token generado demasiado grande" });
        }

        return res.status(201).json({
            token,
            user: payload,
            message: "Usuario registrado"
        });

    } catch (error) {
        console.log("ERROR REGISTER:");
        console.log(error);

        if (error.name === "ValidationError")
            return res.status(400).json({ error: error.message });

        if (error.code === "UsuarioDuplicado")
            return res.status(409).json({ error: error.message });

        console.error(error);

        res.status(500).json({
            error: error.message,
            stack: error.stack
        });
    }
});

export default router;
