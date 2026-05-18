import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import usuariosService from '../../application/services/usuariosService.js';

const router = express.Router();

const service = new usuariosService();

router.post('/login', async (req, res) => {

    console.log('POST /api/auth/login');

    try {

        const { email, password } = req.body;

        console.log('Body:', req.body);

        const usuario = await service.getByEmailAsync(email);

        console.log('Usuario encontrado:', usuario);

        if (!usuario) {

            return res.status(404).json({
                error: 'Usuario no encontrado'
            });
        }

        const hash = crypto.createHash('sha256').update(password).digest('hex');

        if (usuario.password !== hash) {

            return res.status(401).json({
                error: 'Password incorrecta'
            });
        }

        const token = jwt.sign(
            {
                id: usuario.ID,
                email: usuario.email
            },
            'secreto',
            {
                expiresIn: '24h'
            }
        );

        console.log('Login correcto');

        res.status(200).json({
            login: true,
            token,
            usuario
        });

    } catch (error) {

        console.log('Error login');
        console.log(error);

        res.status(500).json({
            error: 'Error login'
        });
    }
});

router.post('/register', async (req, res) => {
    console.log('POST /api/auth/register');

    try {
        const { nombre, apellido, email, password, fechaNacimiento } = req.body;

        if (!email || !password || !nombre) {
            return res.status(400).json({ error: 'Faltan datos requeridos' });
        }

        const existing = await service.getByEmailAsync(email);
        if (existing) {
            return res.status(409).json({ error: 'Email ya registrado' });
        }

        const hash = crypto.createHash('sha256').update(password).digest('hex');

        const newId = await service.createAsync({
            nombre,
            apellido,
            email,
            password: hash,
            fechaNacimiento
        });

        res.status(201).json({ id: newId });

    } catch (error) {
        console.log('Error register');
        console.log(error);
        res.status(500).json({ error: 'Error register' });
    }
});

export default router;