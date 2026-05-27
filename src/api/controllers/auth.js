import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import usuariosService from '../../application/services/usuariosService.js';

const router = express.Router();

const service = new usuariosService();

router.get('/status', (req, res) => {
    const token = req.query.token || req.headers['authorization'] && req.headers['authorization'].split(' ')[1];
    if (!token) return res.json({ authenticated: false });
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'secreto');
        return res.json({ authenticated: true, user: payload });
    } catch (err) {
        return res.json({ authenticated: false });
    }
});

router.post('/login', async (req, res) => {

    console.log('POST /api/auth/login (hardcoded)');

    try {
        const { email, password } = req.body;

        console.log('Body:', req.body);

        // Hardcoded credentials: usuario = 'a', contraseña = 'a'
        if (email === 'a' && password === 'a') {
            const token = jwt.sign({ id: 1, email: 'a' }, process.env.JWT_SECRET || 'secreto', { expiresIn: '24h' });
            console.log('Login correcto (hardcoded)');
            // Redirect to index; token included as query param for convenience
            return res.redirect('/?token=' + token);
        }

        return res.status(401).json({ error: 'Credenciales incorrectas' });

    } catch (error) {
        console.log('Error login');
        console.log(error);
        res.status(500).json({ error: 'Error login' });
    }
});

router.post('/register', async (req, res) => {
    console.log('POST /api/auth/register (hardcoded/no-op)');

    try {
        // For testing we accept any register and return a fake id
        return res.status(201).json({ id: 1, message: 'Usuario registrado (modo test)' });
    } catch (error) {
        console.log('Error register');
        console.log(error);
        res.status(500).json({ error: 'Error register' });
    }
});

export default router;