import { jest, describe, it, beforeEach, expect } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../../src/interfaces/server.js';

describe('Auth Service - Integração de interfaces', () => {
  if (process.env.JEST_INTEGRATION !== '1') {
    it('integration skipped (set JEST_INTEGRATION=1 to enable)', () => {
      expect(true).toBe(true);
    });
    return;
  }

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
