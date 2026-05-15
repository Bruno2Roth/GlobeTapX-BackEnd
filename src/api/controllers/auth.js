import express from 'express';
import jwt from 'jsonwebtoken';
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

        if (usuario.password !== password) {

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

export default router;