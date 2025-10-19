import request from 'supertest';
import { jest, describe, it, expect } from '@jest/globals';

// Faz mock antes de importar createApp
jest.unstable_mockModule('../src/application/UserReader.js', () => ({
  default: class MockUserReader {
    async findByEmailOrUsername(identifier) {
      if (identifier === 'admin@example.com' || identifier === 'admin') {
        return { id: 'u1', username: 'admin', email: 'admin@example.com', role: 'admin', passwordHash: 'hash' };
      }
      return null;
    }
  }
}));

jest.unstable_mockModule('../src/infrastructure/passwordHasher.js', () => ({
  default: class MockHasher {
    async compare(plain, hash) { return plain === 'Secret123!' && !!hash; }
  }
}));

const { createApp } = await import('../src/interfaces/server.js');
const app = createApp();

describe('POST /login', () => {
  it('200 when identifier (email) + password are valid', async () => {
    const res = await request(app).post('/login').send({ identifier: 'admin@example.com', password: 'Secret123!' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      mensagem: expect.any(String),
      token: expect.any(String),
      usuario: { id: 'u1', username: 'admin', email: 'admin@example.com', role: 'admin' }
    });
  });

  it('401 when user does not exist', async () => {
    const res = await request(app).post('/login').send({ identifier: 'ghost', password: 'Secret123!' });
    expect(res.status).toBe(401);
  });

  it('401 when password is wrong', async () => {
    const res = await request(app).post('/login').send({ identifier: 'admin', password: 'WrongPass1' });
    expect(res.status).toBe(401);
  });
});

describe('GET /validate', () => {
  it('200 with valid token', async () => {
    const login = await request(app).post('/login').send({ identifier: 'admin', password: 'Secret123!' });
    const token = login.body.token;
    const res = await request(app).get('/validate').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ isValid: true, role: 'admin' });
  });

  it('401 when missing token', async () => {
    const res = await request(app).get('/validate');
    expect(res.status).toBe(401);
  });
});
