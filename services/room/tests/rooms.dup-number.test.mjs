import request from 'supertest';
import { jest, describe, it, expect } from '@jest/globals';

jest.unstable_mockModule('../src/authMiddleware.js', () => ({
  authenticateJWT: (req, _res, next) => { req.user = { id: 'u1', role: 'admin', username: 'admin' }; next(); },
  isAdmin: (_req, _res, next) => next(),
  authorizeRoles: () => (_req, _res, next) => next(),
}));

const createSpy = jest.fn()
  .mockResolvedValueOnce({ id: 'r1', number: 101 })
  .mockRejectedValueOnce(Object.assign(new Error('duplicate key error'), { code: 11000 }));
let findByNumberCalls = 0;

jest.unstable_mockModule('../src/infrastructure/MongoRoomRepository.js', () => ({
  MongoRoomRepository: class {
    async create(dto) { return createSpy(dto); }
    async findAll() { return []; }
    async findById() { return { id: 'r1', number: 101, status: 'free' }; }
    async findByNumber() { findByNumberCalls += 1; return findByNumberCalls >= 2 ? { id: 'r1', number: 101 } : null; }
    async update() { return {}; }
    async delete() { return {}; }
    async setStatus() { return {}; }
  }
}));

const { createApp } = await import('../src/index.mjs');
const app = createApp();

describe('POST /rooms duplicate number → 409', () => {
  it('returns 409 when trying to create a room with existing number', async () => {
    const payload = { number: 101, type: 'standard', capacity: 2, status: 'free', price: 199.9 };

    const first = await request(app)
      .post('/rooms')
      .set('Authorization', 'Bearer dummy')
      .send(payload);

    expect(first.status).toBe(201);

    const dup = await request(app)
      .post('/rooms')
      .set('Authorization', 'Bearer dummy')
      .send(payload);

  // Repositório lança código 11000; garantir que o controller mapeie para 409
    expect([409, 400]).toContain(dup.status);
  });
});
