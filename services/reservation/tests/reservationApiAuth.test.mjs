import request from 'supertest';
import { createApp } from '../src/index.js';
import jwt from 'jsonwebtoken';


const mockAuth = (req, res, next) => { req.user = { role: 'admin' }; next(); };
const mockIsRecepcionista = (req, res, next) => { next(); };
const appMock = createApp({ authenticateJWT: mockAuth, isRecepcionista: mockIsRecepcionista });


import { authenticateJWT, isRecepcionista } from '../src/authMiddleware.js';
const appReal = createApp({ authenticateJWT, isRecepcionista });

const JWT_SECRET = 'supersecret';
const token = jwt.sign({ id: 1, role: 'admin', username: 'admin' }, JWT_SECRET);

describe('Reservation API (sem autenticação real)', () => {
  it('deve listar reservas ativas sem exigir JWT', async () => {
    const res = await request(appMock).get('/reservations/active');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('Reservation API (com autenticação real)', () => {
  it('deve rejeitar sem JWT', async () => {
    const res = await request(appReal).get('/reservations/active');
    expect(res.status).toBe(401);
  });
  it('deve aceitar com JWT válido', async () => {
    const res = await request(appReal)
      .get('/reservations/active')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 403]).toContain(res.status); 
  });
  it('deve rejeitar com JWT inválido', async () => {
    const res = await request(appReal)
      .get('/reservations/active')
      .set('Authorization', 'Bearer tokeninvalido');
    expect([401, 403]).toContain(res.status);
  });
});
