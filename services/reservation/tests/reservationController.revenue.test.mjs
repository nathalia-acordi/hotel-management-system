import request from 'supertest';
import express from 'express';
import reservationController from '../src/interfaces/reservationController.js';

describe('reservationController GET /reports/revenue', () => {
  let app, repo, token;
  beforeEach(() => {
    repo = {
      data: [
        { id: 1, paymentStatus: 'pago', checkIn: '2025-09-20', checkOut: '2025-09-22', amount: 100 },
        { id: 2, paymentStatus: 'pendente', checkIn: '2025-09-21', checkOut: '2025-09-23', amount: 200 },
        { id: 3, paymentStatus: 'pago', checkIn: '2025-09-25', checkOut: '2025-09-27', amount: 300 }
      ],
      findAll: function() { return this.data; }
    };
    global.__reservationRepository__ = repo;
    app = express();
    app.use(express.json());
    app.use(reservationController({
      authenticateJWT: (req, res, next) => next(),
      isRecepcionista: (req, res, next) => next(),
      isAdmin: (req, res, next) => next()
    }));
    token = 'fake';
  });
  afterEach(() => { delete global.__reservationRepository__; });

  it('retorna total e count de reservas pagas no período', async () => {
    const res = await request(app)
      .get('/reports/revenue?start=2025-09-19&end=2025-09-23')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.total).toBe(100);
    expect(res.body.count).toBe(1);
  });

  it('retorna 400 se faltar start ou end', async () => {
    const res = await request(app)
      .get('/reports/revenue?start=2025-09-19')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(400);
  });

  it('retorna total 0 se não houver reservas pagas no período', async () => {
    const res = await request(app)
      .get('/reports/revenue?start=2025-09-28&end=2025-09-30')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.total).toBe(0);
    expect(res.body.count).toBe(0);
  });
});
