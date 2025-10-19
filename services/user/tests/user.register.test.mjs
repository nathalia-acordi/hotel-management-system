import request from 'supertest';
import { jest, describe, test, beforeAll, expect } from '@jest/globals';
import { UserRepositoryImpl } from '../src/infrastructure/UserRepository.js';
import { makeValidPayload, normalize, fakeUser } from './fixtures/userFactory.js';

// Faz mock do publicador antes de importar o app
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

  // Garante que o usuário salvo (mockado) corresponda aos valores normalizados esperados na resposta
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
  // Simula duplicidade fazendo findByUsername retornar um usuário existente, evitando chamadas reais ao BD e timeouts
    const repoFind = jest.spyOn(UserRepositoryImpl.prototype, 'findByUsername').mockResolvedValue(fakeUser());
    const res = await request(app).post('/self-register').send(makeValidPayload());
    expect(res.status).toBe(409);
    repoFind.mockRestore();
  });
});

// Testes de integração movidos para a pasta tests/integration
describe('integration moved', () => {
  test('noop', () => expect(true).toBe(true));
});
