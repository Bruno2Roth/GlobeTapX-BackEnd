import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import rateLimit from 'express-rate-limit';
import usuariosService from '../../application/services/usuariosService.js';
import authMiddleware from '../../api/middlewares/auth.js';

const router = express.Router();
const service = new usuariosService();

const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;

const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return null;
  const trimmed = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed) ? trimmed : null;
};

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos de inicio de sesión. Intente de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip + '_' + (req.body?.email || req.body?.mail || 'unknown');
  },
});

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
    const fechaNacimiento = body.fechaNacimiento || body.fecha_nacimiento;

    if (!isNonEmptyString(nombre)) {
        return res.status(400).json({ error: 'El nombre es requerido' });
    }
    if (!email) {
        return res.status(400).json({ error: 'Email válido es requerido' });
    }
    if (!isNonEmptyString(password)) {
        return res.status(400).json({ error: 'Contraseña es requerida' });
    }
    if (!isNonEmptyString(fechaNacimiento)) {
        return res.status(400).json({ error: 'Fecha de nacimiento es requerida' });
    }

    const parsedDate = new Date(String(fechaNacimiento).trim());
    if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({ error: 'Fecha de nacimiento inválida' });
    }

    const optionalFields = {
        nombreCompleto: body.nombreCompleto ? String(body.nombreCompleto).trim() : null,
        numeroContacto: body.numeroContacto ? String(body.numeroContacto).trim() : null,
        idiomaPreferido: (body.idiomaPreferido || body.idioma)
            ? String(body.idiomaPreferido || body.idioma).trim()
            : null,
    };

    req.validatedBody = {
        nombre: String(nombre).trim(),
        email,
        password: String(password).trim(),
        fechaNacimiento: parsedDate.toISOString().split('T')[0],
        ...optionalFields,
    };
    return next();
};

const buildUserPayload = (user) => ({
    id: user.ID || user.id,
    email: user.mail || user.email,
    nombre: user.nombreCompleto || user.nombre,
});

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

router.get('/me', authMiddleware.required, (req, res) => {
    return res.status(200).json({ authenticated: true, user: req.user });
});

router.post('/login', loginLimiter, validateLoginBody, async (req, res) => {
    console.log('POST /api/auth/login');
    try {
        const { email, password } = req.validatedBody;

        const user = await service.getByEmailAsync(email);
        if (!user) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        const stored = user.contrasena || user.password;
        const coincide = stored.startsWith('$2b$') || stored.startsWith('$2a$') || stored.startsWith('$2y$')
            ? await bcrypt.compare(password, stored)
            : String(stored) === String(password);

        if (!coincide) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        const payload = buildUserPayload(user);
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

        return res.status(200).json({ token, user: payload });
    } catch (error) {
        console.log('Error en login:', error);
        res.status(500).json({ error: error.message || 'Error en el inicio de sesión' });
    }
});

router.post('/register', validateRegisterBody, async (req, res) => {
    console.log('POST /api/auth/register');
    try {
        const entity = req.validatedBody;
        entity.password = await bcrypt.hash(entity.password, 10);
        await service.createAsync(entity);
        const user = await service.getByEmailAsync(entity.email);
        const payload = buildUserPayload(user);
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
        return res.status(201).json({ token, user: payload, message: 'Usuario registrado' });
    } catch (error) {
        console.log('Error en register:', error);
        if (error.name === 'ValidationError') return res.status(400).json({ error: error.message });
        if (error.code === 'UsuarioDuplicado') return res.status(409).json({ error: error.message });
        res.status(500).json({ error: error.message || 'Error en el registro' });
    }
});

export default router;
