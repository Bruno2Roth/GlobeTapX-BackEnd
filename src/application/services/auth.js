const jwt = require('jsonwebtoken');

const authenticateUser = ({ username, password }) => {
  // Aquí puedes reemplazar con lógica real de base de datos.
  if (username === 'admin' && password === 'admin') {
    return { username: 'admin' };
  }

  return null;
};

const createToken = (user) => {
  return jwt.sign({ username: user.username }, process.env.JWT_SECRET || 'secreto', { expiresIn: '1h' });
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET || 'secreto');
};

module.exports = {
  authenticateUser,
  createToken,
  verifyToken,
};
