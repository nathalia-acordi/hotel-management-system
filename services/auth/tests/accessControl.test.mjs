import request from 'supertest';
import { createApp } from '../src/interfaces/server.js';
import { sign } from '../src/infrastructure/tokenAdapter.js';

const app = createApp();

const adminToken = sign({ role: 'admin' });
const recepcionistaToken = sign({ role: 'receptionist' });
const hospedeToken = sign({ role: 'guest' });

describe('Middleware de Controle de Acesso', () => {
  it('Deve permitir acesso para um papel com permissão', async () => {
    const res = await request(app)
      .post('/cadastrar-hospede')
      .set('Authorization', `Bearer ${adminToken}`)
      .send();

    expect(res.statusCode).toBe(200);
    expect(res.body.mensagem).toBe('Hóspede cadastrado com sucesso!');
  });

  it('Deve negar acesso para um papel sem permissão', async () => {
    const res = await request(app)
      .post('/cadastrar-hospede')
      .set('Authorization', `Bearer ${hospedeToken}`)
      .send();

    expect(res.statusCode).toBe(403);
    expect(res.body.erro).toBe('Acesso negado: permissão insuficiente');
  });

  it('Deve retornar erro 403 se o papel não for encontrado', async () => {
    const res = await request(app)
      .post('/cadastrar-hospede')
      .send();

    expect(res.statusCode).toBe(403);
    expect(res.body.erro).toBe('Acesso negado: token não fornecido');
  });
});