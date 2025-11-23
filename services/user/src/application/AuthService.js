import jwt from 'jsonwebtoken';
import { getSecret } from '../interfaces/config/secrets.js';

export class AuthService {
  constructor(secret) {
    this.secret = secret || getSecret('JWT_SECRET', 'JWT_SECRET_FILE') || 'segredo_super_secreto';
  }

  validateRole(token, roles) {
    try {
  
      const actualToken = token?.startsWith('Bearer ') ? token.slice(7) : token;
      const decoded = jwt.verify(actualToken, this.secret);
  
      const allowed = roles.includes(decoded.role);
      if (allowed) {
        return { valid: true, isValid: true, user: decoded, status: 200 };
      }
      return { valid: false, isValid: false, message: 'Role not authorized', status: 403 };
    } catch (error) {
      console.error('[AuthService] Token validation error');
      return { valid: false, isValid: false, message: error.message, status: 401 };
    }
  }

  generateToken(payload) {
    return jwt.sign(payload, this.secret, { expiresIn: '1h' });
  }
}