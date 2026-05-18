import express from 'express';

const router = express.Router();

router.get('/', async (req, res) => {
	res.json({ message: 'categoriaEmergencia controller (placeholder)' });
});

export default router;

