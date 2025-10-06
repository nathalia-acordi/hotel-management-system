import request from 'supertest';
import express from 'express';
import reservationController from '../src/interfaces/reservationController.js';

describe('reservationController PATCH /reservations/:id/amount', () => {
  let app, repo, token;
  beforeEach(() => {
    repo = {
      data: [{ id: 1, amount: 100 }],
      findById: function(id) { return this.data.find(r => r.id === id); },
      update: function(r) { const i = this.data.findIndex(x => x.id === r.id); if (i >= 0) this.data[i] = r; }
    };
    global.__reservationRepository__ = repo;
    app = express();
    app.use(express.json());
    // Mock middlewares de autenticação e papel
    app.use(reservationController({
      authenticateJWT: (req, res, next) => next(),
      isRecepcionista: (req, res, next) => next(),
      isAdmin: (req, res, next) => next()
    }));
    token = 'fake';
  });
  afterEach(() => { delete global.__reservationRepository__; });

  it('atualiza amount com sucesso', async () => {
    const res = await request(app)
      .patch('/reservations/1/amount')
      .send({ amount: 200 })
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.amount).toBe(200);
  });

  it('retorna 400 se amount inválido', async () => {
    const res = await request(app)
      .patch('/reservations/1/amount')
      .send({ amount: -10 })
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(400);
  });

  it('retorna 404 se reserva não encontrada', async () => {
    const res = await request(app)
      .patch('/reservations/999/amount')
      .send({ amount: 100 })
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404);
  });
});
