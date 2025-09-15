import request from 'supertest';

import { createApp } from '../src/index.mjs';

// Middlewares mockados para testes sem autenticação real
const mockAuth = (req, res, next) => { req.user = { role: 'admin' }; next(); };
const mockIsAdmin = (req, res, next) => { next(); };
const appMock = createApp({ authenticateJWT: mockAuth, isAdmin: mockIsAdmin });

describe('Room Business Rules (sem autenticação real)', () => {
  it('deve criar um quarto válido', async () => {
  const res = await request(appMock)
      .post('/rooms')
      .send({ number: 101, type: 'single', price: 200 });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.number).toBe(101);
  });

  it('deve rejeitar criação de quarto sem campos obrigatórios', async () => {
  const res = await request(appMock)
      .post('/rooms')
      .send({ type: 'double' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('deve listar quartos criados', async () => {
    await request(appMock)
      .post('/rooms')
      .send({ number: 102, type: 'double', price: 300 });
    const res = await request(appMock).get('/rooms');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('deve rejeitar número de quarto duplicado', async () => {
    await request(appMock)
      .post('/rooms')
      .send({ number: 200, type: 'single', price: 150 });
    const res = await request(appMock)
      .post('/rooms')
      .send({ number: 200, type: 'double', price: 180 });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('deve rejeitar preço negativo ou zero', async () => {
    let res = await request(appMock)
      .post('/rooms')
      .send({ number: 201, type: 'single', price: -50 });
    expect(res.status).toBe(400);
    res = await request(appMock)
      .post('/rooms')
      .send({ number: 202, type: 'double', price: 0 });
    expect(res.status).toBe(400);
  });

  it('deve rejeitar tipo de quarto inválido', async () => {
    const res = await request(appMock)
      .post('/rooms')
      .send({ number: 203, type: 'invalid', price: 100 });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('deve rejeitar número de quarto negativo ou zero', async () => {
    let res = await request(appMock)
      .post('/rooms')
      .send({ number: -1, type: 'single', price: 100 });
    expect(res.status).toBe(400);
    res = await request(appMock)
      .post('/rooms')
      .send({ number: 0, type: 'double', price: 100 });
    expect(res.status).toBe(400);
  });
});

// Teste de fluxo completo com JWT real
import jwt from 'jsonwebtoken';
import { authenticateJWT, isAdmin } from '../src/authMiddleware.js';
const appReal = createApp({ authenticateJWT, isAdmin });

describe('Room Business Rules (com autenticação real)', () => {
  const JWT_SECRET = 'supersecret';
  const token = jwt.sign({ id: 1, role: 'admin', username: 'admin' }, JWT_SECRET);
  it('cria quarto com JWT válido', async () => {
    const res = await request(appReal)
      .post('/rooms')
      .set('Authorization', `Bearer ${token}`)
      .send({ number: 301, type: 'suite', price: 500 });
    expect([201, 400]).toContain(res.status); // 201 se novo, 400 se já existe
  });
  it('rejeita sem JWT', async () => {
    const res = await request(appReal)
      .post('/rooms')
      .send({ number: 302, type: 'suite', price: 500 });
    expect(res.status).toBe(401);
  });
  it('rejeita com JWT inválido', async () => {
    const res = await request(appReal)
      .post('/rooms')
      .set('Authorization', 'Bearer tokeninvalido')
      .send({ number: 303, type: 'suite', price: 500 });
    expect([401, 403]).toContain(res.status);
  });
});
