const jwt = require('jsonwebtoken');
const env = require('../../config/env');

const authenticateUser = ({ username, password }) => {
  // Aquí puedes reemplazar con lógica real de base de datos.
  if (username === 'admin' && password === 'admin') {
    return { username: 'admin' };
  }

  return null;
};

const createToken = (user) => {
  return jwt.sign({ username: user.username }, env.jwtSecret, { expiresIn: '1h' });
};

const verifyToken = (token) => {
  return jwt.verify(token, env.jwtSecret);
};

module.exports = {
  authenticateUser,
  createToken,
  verifyToken,
};
