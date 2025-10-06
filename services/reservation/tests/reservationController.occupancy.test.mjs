import request from 'supertest';
import express from 'express';
import reservationController from '../src/interfaces/reservationController.js';

describe('reservationController GET /rooms/occupancy', () => {
  let app, repo, token;
  beforeEach(() => {
    repo = {
      data: [
        { id: 1, roomId: 101, checkIn: '2025-09-20', checkOut: '2025-09-22' },
        { id: 2, roomId: 102, checkIn: '2025-09-21', checkOut: '2025-09-23' },
        { id: 3, roomId: 101, checkIn: '2025-09-25', checkOut: '2025-09-27' }
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

  it('retorna reservas ocupadas na data', async () => {
    const res = await request(app)
      .get('/rooms/occupancy?date=2025-09-21')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    const roomIds = res.body.map(r => r.roomId);
    expect(roomIds).toContain(101);
    expect(roomIds).toContain(102);
    expect(res.body.length).toBe(2);
  });

  it('retorna 400 se data não for informada', async () => {
    const res = await request(app)
      .get('/rooms/occupancy')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(400);
  });

  it('retorna array vazio se não houver ocupação na data', async () => {
    const res = await request(app)
      .get('/rooms/occupancy?date=2025-09-30')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });
});
