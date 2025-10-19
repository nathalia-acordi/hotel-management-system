import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/interfaces/server.js';

const SECRET = process.env.JWT_SECRET || 'segredo_super_secreto';

describe('Auth Service - GET /validate', () => {
  const app = createApp();

  it('deve retornar 401 quando não enviar Authorization', async () => {
    const res = await request(app).get('/validate');
    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ isValid: false, erro: 'Token ausente ou inválido' });
  });

  it('deve retornar 200 e dados do token quando token válido', async () => {
    const token = jwt.sign({ id: 'u1', username: 'alice', role: 'guest' }, SECRET, { expiresIn: '1h' });
    const res = await request(app).get('/validate').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.isValid).toBe(true);
    expect(res.body.role).toBe('guest');
    expect(res.body.username).toBe('alice');
    expect(res.body.sub || res.body.id).toBeDefined();
  });

  it('deve retornar 401 quando token inválido', async () => {
    const res = await request(app).get('/validate').set('Authorization', 'Bearer invalid.token.here');
    expect(res.statusCode).toBe(401);
    expect(res.body.isValid).toBe(false);
  });
});
