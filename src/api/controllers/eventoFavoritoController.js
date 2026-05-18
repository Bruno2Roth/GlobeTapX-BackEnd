import express from 'express';

const router = express.Router();

router.get('/', async (req, res) => {
	res.json({ message: 'eventoFavorito controller (placeholder)' });
});

export default router;

