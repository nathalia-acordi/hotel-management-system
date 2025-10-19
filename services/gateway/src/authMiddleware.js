import jwt from 'jsonwebtoken';
import fs from 'fs';
function readFromFileVar(varName){const p=process.env[varName];if(!p) return null; try{return fs.readFileSync(p,'utf8').trim();}catch{return null}}
function getSecret(key,fileKey){return process.env[key] || readFromFileVar(fileKey)}

export function authenticateJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token não fornecido.' });
  }
  const token = authHeader.split(' ')[1];
  try {
  const secret = getSecret('JWT_SECRET','JWT_SECRET_FILE') || 'segredo_super_secreto';
    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Token inválido.' });
  }
}
