import jwt from 'jsonwebtoken';
import { getSecret } from '../config/secrets.js';

const SECRET = getSecret('JWT_SECRET', 'JWT_SECRET_FILE') || 'segredo_super_secreto';

export function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token ausente ou inválido' });
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = { id: decoded.sub || decoded.id, role: decoded.role, username: decoded.username };
    return next();
  } catch (e) {
    return res.status(401).json({ erro: 'Token ausente ou inválido' });
  }
}

export function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ erro: 'Acesso negado' });
    }
    next();
  };
}
