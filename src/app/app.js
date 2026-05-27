const express = require('express');
const cors = require('cors');
const auth = require('../api/middlewares/auth');
const authRoute = require('../api/routes/auth');
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoute);

app.get('/', auth.optional, (req, res) => {
  if (req.user) {
    return res.send('Página principal: estás logueado');
  }

  return res.redirect('/registro');
});

app.get('/registro', (req, res) => {
  res.send('Página de registro: por favor regístrate o inicia sesión');
});

// Error

module.exports = app;