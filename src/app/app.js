import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  return res.send('Página principal');
});

app.get('/registro', (req, res) => {
  res.send('Página de registro: por favor regístrate o inicia sesión');
});

export default app;