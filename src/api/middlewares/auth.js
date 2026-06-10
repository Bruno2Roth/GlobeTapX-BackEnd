import jwt from 'jsonwebtoken';

export const optional = (req, res, next) => {
  const encabezadoAutorizacion = req.headers.authorization;

  if (!encabezadoAutorizacion) {
    req.user = null;
    return next();
  }

  const token = encabezadoAutorizacion.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const decodificado = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decodificado;
  } catch (error) {
    req.user = null;
  }

  return next();
};

export const required = (req, res, next) => {
  const encabezadoAutorizacion = req.headers.authorization;

  if (!encabezadoAutorizacion) {
    return res.status(401).json({ success: false, message: 'No se proporcionó token' });
  }

  const token = encabezadoAutorizacion.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'No se proporcionó token' });
  }

  try {
    const decodificado = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decodificado;
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token inválido' });
  }
};

export default {
  optional,
  required,
};
