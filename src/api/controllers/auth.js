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

const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return null;
  const trimmed = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed) ? trimmed : null;
};

// ──────────────────────────────────────────────
// RATE LIMITER — Limita intentos de login
// ──────────────────────────────────────────────
// Clave única por IP + email: si un atacante prueba
// combinaciones, cada email diferente tiene su propio
// contador de 10 intentos cada 15 minutos.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // ventana de 15 min
  max: 10,                    // máx 10 intentos por ventana
  message: { error: 'Demasiados intentos de inicio de sesión. Intente de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return ipKeyGenerator(req) + '_' + (req.body?.email || req.body?.mail || 'unknown');
  },
});

// ──────────────────────────────────────────────
// MIDDLEWARES DE VALIDACIÓN
// ──────────────────────────────────────────────
// Aceptan tanto nombres en inglés como en español
// (email/mail, password/contrasena, nombre/nombreCompleto)
// para ser tolerantes con distintos clientes.

const validateLoginBody = (req, res, next) => {
    const body = req.body || {};
    const email = validateEmail(body.email || body.mail);
    const password = body.password || body.contrasena;

    if (!email) {
        return res.status(400).json({ error: 'Email válido es requerido' });
    }
    if (!isNonEmptyString(password)) {
        return res.status(400).json({ error: 'Contraseña es requerida' });
    }

    req.validatedBody = { email, password: String(password).trim() };
    return next();
};

const validateRegisterBody = (req, res, next) => {
    const body = req.body || {};
    const nombre = body.nombre || body.nombreCompleto;
    const email = validateEmail(body.email || body.mail);
    const password = body.password || body.contrasena;

    if (!isNonEmptyString(nombre)) {
        return res.status(400).json({ error: 'El nombre es requerido' });
    }
    if (!email) {
        return res.status(400).json({ error: 'Email válido es requerido' });
    }
    if (!isNonEmptyString(password)) {
        return res.status(400).json({ error: 'Contraseña es requerida' });
    }

    const optionalFields = {
        nombreCompleto: body.nombreCompleto ? String(body.nombreCompleto).trim() : null,
        numeroContacto: body.numeroContacto ? String(body.numeroContacto).trim() : null,
        idiomaPreferido: body.idiomaPreferido || body.idiomapreferido || null,
        paisActual: body.paisActual || null,
        fotoPerfil: body.fotoPerfil || null,
        IsAdmin: false,
        ESPremium: false,
    };

    req.validatedBody = {
        nombre: String(nombre).trim(),
        email,
        password: String(password).trim(),
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
// (email, password) mediante fallbacks.

const buildUserPayload = (user) => ({
    id: user.ID,
    email: user.mail,
    nombre: user.nombre,
    IsAdmin: user.IsAdmin ?? false,
    ESPremium: user.esPremium ?? false,
    paisActual: user.paisActual ?? null, 
    fotoPerfil: user.fotoPerfil ?? null,
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
// 1. Pasa por rate limiter (10 intentos/15 min por IP+email)
// 2. Valida email y contraseña con validateLoginBody
// 3. Busca el usuario por email en BD
// 4. Compara contraseña: soporta bcrypt (hash) y texto plano
// 5. Genera JWT con expiración de 7 días
// 6. Devuelve { token, user }
router.post('/login', loginLimiter, validateLoginBody, async (req, res) => {
    console.log('POST /api/auth/login');
    try {
        const { email, password } = req.validatedBody;

        const user = await service.getByEmailAsync(email);
        if (!user) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        // Comparar contraseña (soporta bcrypt y texto plano)
        const stored = user.contrasena || user.password;
        const coincide = stored.startsWith('$2b$') || stored.startsWith('$2a$') || stored.startsWith('$2y$')
            ? await bcrypt.compare(password, stored)
            : String(stored) === String(password);

        if (!coincide) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 3600;
        const payload = buildUserPayload(user);
        const token = jwt.sign({ ...payload, exp }, process.env.JWT_SECRET, { noTimestamp: true });

        return res.status(200).json({ token, user: payload });
    } catch (error) {
        console.log('Error en login:', error);
        res.status(500).json({ error: error.message || 'Error en el inicio de sesión' });
    }
});

// ──────────────────────────────────────────────
// POST /api/auth/register — Registro de nuevo usuario
// ──────────────────────────────────────────────
// 1. Valida nombre, email y contraseña con validateRegisterBody
// 2. Hashea la contraseña con bcrypt (10 rondas)
// 3. Crea el usuario en BD a través de usuariosService.createAsync
// 4. Vuelve a buscar el usuario para obtener el ID generado
// 5. Genera JWT con expiración de 7 días
// 6. Devuelve { token, user, message } con status 201
// Maneja errores de validación (400) y usuario duplicado (409)
router.post('/register', validateRegisterBody, async (req, res) => {
    console.log('POST /api/auth/register');
    try {
        const entity = req.validatedBody;
        entity.password = await bcrypt.hash(entity.password, 10);
        await service.createAsync(entity);
        const user = await service.getByEmailAsync(entity.email);
        const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 3600;
        const payload = buildUserPayload(user);
        const token = jwt.sign({ ...payload, exp }, process.env.JWT_SECRET, { noTimestamp: true });
        return res.status(201).json({ token, user: payload, message: 'Usuario registrado' });
    } catch (error) {
        console.log('Error en register:', error);
        if (error.name === 'ValidationError') return res.status(400).json({ error: error.message });
        if (error.code === 'UsuarioDuplicado') return res.status(409).json({ error: error.message });
        res.status(500).json({ error: error.message || 'Error en el registro' });
    }
});

export default router;
