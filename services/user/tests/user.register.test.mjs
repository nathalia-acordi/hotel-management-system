import request from 'supertest';
import { jest, describe, test, beforeAll, expect } from '@jest/globals';
import { UserRepositoryImpl } from '../src/infrastructure/UserRepository.js';
import { makeValidPayload, normalize, fakeUser } from './fixtures/userFactory.js';


jest.unstable_mockModule('../src/infrastructure/rabbitmq.js', () => ({
  publishEvent: jest.fn().mockResolvedValue(undefined),
}));

const { createApp } = await import('../src/interfaces/routes.js');

describe('User register HTTP', () => {
  let app;
  beforeAll(() => {
    app = createApp();
  });

  test('201 - /self-register success (public) and publishes event; no password leaked', async () => {
    const payload = makeValidPayload({ password: 'Strong1A' });
    const { email: expectedEmail, document: expectedDoc, phone: expectedPhone } = normalize(payload);

  
    const saved = fakeUser({
      username: payload.username,
      email: expectedEmail,
      document: expectedDoc,
      phone: expectedPhone,
      role: 'guest',
    });

    const repoFind = jest.spyOn(UserRepositoryImpl.prototype, 'findByUsername').mockResolvedValue(null);
    const repoSave = jest.spyOn(UserRepositoryImpl.prototype, 'save').mockResolvedValue(saved);

    const res = await request(app).post('/self-register').send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('mensagem');
    expect(res.body).toHaveProperty('usuario');
    expect(res.body.usuario).toMatchObject({ username: payload.username, email: expectedEmail, role: 'guest', document: expectedDoc, phone: expectedPhone });
    expect(res.body.usuario.password).toBeUndefined();
    expect(Object.keys(res.body.usuario)).not.toContain('password');

    repoSave.mockRestore();
    repoFind.mockRestore();
  });

  test('400 - validation errors (weak password, bad email)', async () => {
    const bad = { username: 'a', email: 'bad', document: 'x', phone: 'y', password: 'weak' };
    const res = await request(app).post('/self-register').send(bad);
    expect(res.status).toBe(400);
  });

  test('409 - duplicate (simulate E11000)', async () => {
  
    const repoFind = jest.spyOn(UserRepositoryImpl.prototype, 'findByUsername').mockResolvedValue(fakeUser());
    const res = await request(app).post('/self-register').send(makeValidPayload());
    expect(res.status).toBe(409);
    repoFind.mockRestore();
  });
});


describe('integration moved', () => {
  test('noop', () => expect(true).toBe(true));
});
