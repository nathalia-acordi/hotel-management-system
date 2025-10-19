import { AuthService } from './src/application/AuthService.js';

const JWT_SECRET = 'segredo_super_secreto';

const authService = new AuthService(JWT_SECRET);

const payload = {
  username: 'admin_user',
  role: 'admin',
};

const token = authService.generateToken(payload);

console.log('Generated Token:', token);