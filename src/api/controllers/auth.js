import express from 'express';
import jwt from 'jsonwebtoken';
import usuariosService from '../../application/services/usuariosService.js';
import authMiddleware from '../../api/middlewares/auth.js';

const router = express.Router();
const service = new usuariosService();

const normalizeEmail = (value) => {
    if (!value) return null;
    const email = String(value).trim().toLowerCase();
    const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
    return emailRegex.test(email) ? email : null;
};

const isRequiredString = (value) => typeof value === 'string' && value.trim().length > 0;

const validateLoginBody = (req, res, next) => {
    const body = req.body || {};
    const email = normalizeEmail(body.email || body.mail);
    const password = body.password || body.contrasena;

    if (!email) {
        return res.status(400).json({ error: 'Email válido es requerido' });
    }
    if (!isRequiredString(password)) {
        return res.status(400).json({ error: 'Password es requerido' });
    }

    req.validatedBody = { email, password: String(password).trim() };
    return next();
};

const validateRegisterBody = (req, res, next) => {
    const body = req.body || {};
    const nombre = body.nombre || body.nombreCompleto;
    const email = normalizeEmail(body.email || body.mail);
    const password = body.password || body.contrasena;
    const fechaNacimiento = body.fechaNacimiento || body.fecha_nacimiento;

    if (!isRequiredString(nombre)) {
        return res.status(400).json({ error: 'El nombre es requerido' });
    }
    if (!email) {
        return res.status(400).json({ error: 'Email válido es requerido' });
    }
    if (!isRequiredString(password)) {
        return res.status(400).json({ error: 'Password es requerido' });
    }
    if (!isRequiredString(fechaNacimiento)) {
        return res.status(400).json({ error: 'Fecha de nacimiento es requerida' });
    }

    const parsedDate = new Date(String(fechaNacimiento).trim());
    if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({ error: 'Fecha de nacimiento inválida' });
    }

    req.validatedBody = {
        nombre: String(nombre).trim(),
        email,
        password: String(password).trim(),
        fechaNacimiento: parsedDate.toISOString().split('T')[0],
        nombreCompleto: body.nombreCompleto ? String(body.nombreCompleto).trim() : null,
        numeroContacto: body.numeroContacto ? String(body.numeroContacto).trim() : null,
        idiomaPreferido: body.idiomaPreferido || body.idioma ? String(body.idiomaPreferido || body.idioma).trim() : null,
    };
    return next();
};

router.get('/status', (req, res) => {
    const token = req.query.token || (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);
    if (!token) return res.json({ authenticated: false });
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'secreto');
        return res.json({ authenticated: true, user: payload });
    } catch (err) {
        return res.json({ authenticated: false });
    }
});

router.get('/me', authMiddleware.required, (req, res) => {
    return res.status(200).json({ authenticated: true, user: req.user });
});

router.post('/login', validateLoginBody, async (req, res) => {
    console.log('POST /api/auth/login');
    try {
        const { email, password } = req.validatedBody;

        const user = await service.getByEmailAsync(email);
        if (!user) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        // DB column is "contrasena"
        const stored = user.contrasena || user.password || user.contrasena;
        if (String(stored) !== String(password)) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        const payload = {
            id: user.ID || user.id,
            email: user.mail || user.email,
            nombre: user.nombreCompleto || user.nombre,
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET || 'secreto', { expiresIn: '24h' });

        return res.status(200).json({ token, user: payload });
    } catch (error) {
        console.log('Error login');
        console.log(error);
        res.status(500).json({ error: error.message || 'Error login' });
    }
});

router.post('/register', validateRegisterBody, async (req, res) => {
    console.log('POST /api/auth/register');
    try {
        const entity = req.validatedBody;
        const id = await service.createAsync(entity);
        const user = await service.getByEmailAsync(entity.email || entity.mail);
        const payload = {
            id: user?.ID || user?.id,
            email: user?.mail || user?.email,
            nombre: user?.nombreCompleto || user?.nombre,
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET || 'secreto', { expiresIn: '24h' });
        return res.status(201).json({ token, user: payload, message: 'Usuario registrado' });
    } catch (error) {
        console.log('Error register');
        console.log(error);
        if (error.name === 'ValidationError') return res.status(400).json({ error: error.message });
        if (error.code === 'DUPLICATE_USER') return res.status(409).json({ error: error.message });
        res.status(500).json({ error: error.message || 'Error register' });
    }
});

export default router;