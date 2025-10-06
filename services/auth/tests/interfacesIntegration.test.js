import { jest } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../src/interfaces/server.js';

describe('Auth Service - Integração de interfaces', () => {
  let app;
  let mockLogin;

  beforeEach(() => {
    mockLogin = jest.fn(async (req, res) => res.json({ token: 'fake' }));
    app = createApp({ loginMiddleware: mockLogin });
  });

  it('GET / deve retornar mensagem padrão', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('Auth Service running');
  });

  it('POST /login deve usar loginMiddleware e retornar token', async () => {
    const res = await request(app).post('/login').send({ username: 'a', password: 'b' });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBe('fake');
    expect(mockLogin).toHaveBeenCalled();
  });

  it('GET /health deve retornar status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('service', 'auth');
  });
});

// Testa fluxo de erro ao publicar evento no login real
import * as rabbit from '../src/infrastructure/rabbitmq.js';
describe('Auth Controller - Erro ao publicar evento', () => {
  let app, requestLib;
  beforeAll(async () => {
    process.env.USER_SERVICE_URL = 'http://localhost:3000';
    process.env.JWT_SECRET = 'test';
    requestLib = (await import('supertest')).default;
    const { login } = await import('../src/interfaces/authController.js');
    app = (await import('express')).default();
    app.use((await import('express')).default.json());
    app.post('/login', login);
  });
  it('deve retornar token mesmo se publishLoginEvent falhar', async () => {
    jest.spyOn(rabbit, 'publishLoginEvent').mockRejectedValue(new Error('erro rabbit'));
    jest.spyOn(rabbit, 'createLoginEvent').mockReturnValue({ type: 'auth.login' });
    // Mock axios
    jest.unstable_mockModule && jest.unstable_mockModule('axios', () => ({ default: { post: jest.fn().mockResolvedValue({ data: { valid: true, id: 1, role: 'user' } }) } }));
    const res = await requestLib(app).post('/login').send({ username: 'test', password: '123' });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });
});
