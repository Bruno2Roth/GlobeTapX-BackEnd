const express = require('express');
const { login, register, status } = require('../controllers/auth');

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.get('/status', status);

module.exports = router;
