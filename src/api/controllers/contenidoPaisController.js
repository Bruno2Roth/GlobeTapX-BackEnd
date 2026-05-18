import express from 'express';

const router = express.Router();

router.get('/', async (req, res) => {
	res.json({ message: 'contenidoPais controller (placeholder)' });
});

export default router;
