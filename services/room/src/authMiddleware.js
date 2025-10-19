export function isReceptionist(req, res, next) {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'receptionist')) {
    return next();
  }
  return res.status(403).json({ erro: 'Acesso restrito a recepcionistas ou administradores' });
}
import jwt from 'jsonwebtoken';
import { getSecret } from './interfaces/config/secrets.js';

export function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ erro: 'Não autenticado' });
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ erro: 'Não autenticado' });
  }
  try {
  const decoded = jwt.verify(token, getSecret('JWT_SECRET', 'JWT_SECRET_FILE') || 'segredo_super_secreto');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ erro: 'Acesso negado' });
  }
}

export function isAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ erro: 'Acesso restrito a administradores' });
}

export function authorizeRoles(...roles) {
  return (req, res, next) => {
    const userRole = req.user?.role;
    if (!userRole) return res.status(401).json({ erro: 'Não autenticado' });
    if (!roles.includes(userRole)) return res.status(403).json({ erro: 'Acesso negado' });
    return next();
  };
}
