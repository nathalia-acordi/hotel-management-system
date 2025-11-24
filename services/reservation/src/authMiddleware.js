import jwt from 'jsonwebtoken';
import fs from 'fs';
function readFromFileVar(varName){const p=process.env[varName];if(!p) return null; try{return fs.readFileSync(p,'utf8').trim();}catch{return null}}
function getSecret(key,fileKey){return process.env[key] || readFromFileVar(fileKey)}

export function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  try {
  const decoded = jwt.verify(token, getSecret('JWT_SECRET','JWT_SECRET_FILE') || 'supersecret');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido' });
  }
}

export function isAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ error: 'Acesso restrito a administradores' });
}

export function isReceptionist(req, res, next) {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'receptionist')) {
    return next();
  }
  return res.status(403).json({ error: 'Acesso restrito a recepcionistas ou administradores' });
}

// Alias em Português para compatibilidade com testes/consumo existente
export const isRecepcionista = isReceptionist;

// Also provide an explicit function export (forwarder) to avoid potential ESM linkage issues
export function isRecepcionistaFunc(req, res, next) {
  return isReceptionist(req, res, next);
}
