import express from 'express';

const router = express.Router();

router.get('/', async (req, res) => {
	res.json({ message: 'preferenciaUsuario controller (placeholder)' });
});

export default router;
