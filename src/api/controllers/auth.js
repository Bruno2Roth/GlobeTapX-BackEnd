import express from 'express';
import jwt from 'jsonwebtoken';
import usuariosService from '../../application/services/usuariosService.js';

const router = express.Router();
const service = new usuariosService();

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

router.post('/login', async (req, res) => {
    console.log('POST /api/auth/login');
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'email y password son requeridos' });
        }

        const user = await service.getByEmailAsync(email);
        if (!user) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        // DB column is "contrasena"
        const stored = user.contrasena || user.password || user.contrasena;
        if (String(stored) !== String(password)) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }

        const payload = { id: user.ID || user.id, email: user.mail || user.email };
        const token = jwt.sign(payload, process.env.JWT_SECRET || 'secreto', { expiresIn: '24h' });

        return res.status(200).json({ token, user: payload });
    } catch (error) {
        console.log('Error login');
        console.log(error);
        res.status(500).json({ error: error.message || 'Error login' });
    }
});

router.post('/register', async (req, res) => {
    console.log('POST /api/auth/register');
    try {
        const entity = req.body;
        const id = await service.createAsync(entity);
        return res.status(201).json({ id, message: 'Usuario registrado' });
    } catch (error) {
        console.log('Error register');
        console.log(error);
        if (error.name === 'ValidationError') return res.status(400).json({ error: error.message });
        if (error.code === 'DUPLICATE_USER') return res.status(409).json({ error: error.message });
        res.status(500).json({ error: error.message || 'Error register' });
    }
});

export default router;