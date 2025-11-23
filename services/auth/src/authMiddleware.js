












import jwt from 'jsonwebtoken';
import { sanitizeCircular } from './utils/sanitize';

export function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token não fornecido.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const secret = process.env.JWT_SECRET || 'segredo_super_secreto';
    const decoded = jwt.verify(token, secret);
    console.log('[DEBUG] Decoded JWT payload:', sanitizeCircular(decoded));

  
    req.user = {
      id: decoded.id,
      role: decoded.role,
      username: decoded.username,
    };
    next();
  } catch (err) {
    console.error('[DEBUG] JWT verification error:', sanitizeCircular(err));
    return res.status(403).json({ message: 'Token inválido.' });
  }
}