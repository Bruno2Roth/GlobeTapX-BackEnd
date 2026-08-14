import jwt from 'jsonwebtoken';

const getBearerToken = (req) => {
  const header = req.headers.authorization;
  if (typeof header !== 'string') return null;

  const match = header.match(/^Bearer\s+([^\s]+)$/i);
  return match ? match[1] : null;
};

const verifyToken = (token) => {
  if (!token || !process.env.JWT_SECRET) return null;

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
    });
    const id = Number(payload?.id ?? payload?.ID ?? payload?.userId);
    if (!Number.isInteger(id) || id <= 0) return null;
    return { ...payload, id };
  } catch {
    return null;
  }
};

export const optional = (req, res, next) => {
  req.user = verifyToken(getBearerToken(req));
  return next();
};

export const required = (req, res, next) => {
  const user = verifyToken(getBearerToken(req));
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'No autorizado',
    });
  }

  req.user = user;
  return next();
};

export const extractBearerToken = getBearerToken;
export const verifyBearerToken = verifyToken;

export default {
  optional,
  required,
  extractBearerToken,
  verifyBearerToken,
};
