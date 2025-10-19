import request from 'supertest';
import { jest, describe, it, expect } from '@jest/globals';
import jwt from 'jsonwebtoken';

const token = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'segredo_super_secreto', { expiresIn: '1h' });
};

const { authenticateJWT, authorizeRoles } = await import('../src/interfaces/middlewares/auth.js');
import express from 'express';

function makeApp(handler) {
  const app = express();
  app.get('/admin', authenticateJWT, authorizeRoles('admin'), handler);
  return app;
}

describe('middlewares', () => {
  it('403 when guest accesses admin route', async () => {
    const app = makeApp((req, res) => res.json({ ok: true }));
    const t = token({ sub: 'u1', role: 'guest', username: 'g' });
    const res = await request(app).get('/admin').set('Authorization', `Bearer ${t}`);
    expect(res.status).toBe(403);
  });
});
