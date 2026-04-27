const { authenticateUser, createToken, verifyToken } = require('../../application/services/auth');

const login = (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Se requieren usuario y contraseña' });
  }

  const user = authenticateUser({ username, password });

  if (!user) {
    return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
  }

  const token = createToken(user);

  return res.json({ success: true, data: { user, token } });
};

const register = (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Se requieren usuario y contraseña' });
  }

  const user = { username };
  const token = createToken(user);

  return res.status(201).json({ success: true, data: { user, token } });
};

const status = (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'No se proporcionó token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const user = verifyToken(token);
    return res.json({ success: true, data: { user } });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token inválido' });
  }
};

module.exports = {
  login,
  register,
  status,
};
