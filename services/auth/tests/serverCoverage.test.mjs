import { jest } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../src/interfaces/server.js';

describe('server.js - cobertura total', () => {
  it('deve responder / com mensagem padrão', async () => {
    const app = createApp();
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('Auth Service running');
  });

  it('deve responder /health com status ok', async () => {
    const app = createApp();
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('service', 'auth');
  });

  it('deve usar loginMiddleware customizado se fornecido', async () => {
    const mockLogin = (req, res) => res.json({ token: 'custom' });
    const app = createApp({ loginMiddleware: mockLogin });
    const res = await request(app).post('/login').send({ username: 'a', password: 'b' });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBe('custom');
  });

  it('deve usar login padrão se não passar loginMiddleware', async () => {
    // Mocka dependências do login padrão
    process.env.USER_SERVICE_URL = 'http://localhost:3000';
    process.env.JWT_SECRET = 'test';
    jest.unstable_mockModule && jest.unstable_mockModule('axios', () => ({ default: { post: jest.fn().mockResolvedValue({ data: { valid: false } }) } }));
    const { login } = await import('../src/interfaces/authController.js');
    const app = createApp();
    const res = await request(app).post('/login').send({ username: 'fail', password: 'fail' });
    expect(res.statusCode).toBe(401);
    expect(res.body.token).toBeUndefined();
  });
});
