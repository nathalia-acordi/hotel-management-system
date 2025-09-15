


import axios from 'axios';

// Aumenta timeout global para testes de integração em Docker
import { jest } from '@jest/globals';
jest.setTimeout(20000);

// Aguarda User Service ficar disponível (para rodar em Docker Compose)
async function waitForUserService(url, timeout = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await axios.get(url);
      if (res.status === 200) return;
    } catch (e) {
      // Ignora erro, tenta de novo
    }
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error('User Service não respondeu em tempo hábil');
}

// Teste de integração Auth ↔ User Service
// Pré-requisito: ambos os serviços devem estar rodando (ex: via Docker Compose)

describe('Integração Auth ↔ User Service', () => {
  console.log('ENV AUTH_URL:', process.env.AUTH_URL);
  console.log('ENV USER_URL:', process.env.USER_URL);
  console.log('ENV USER_SERVICE_URL:', process.env.USER_SERVICE_URL);
  const AUTH_URL = process.env.AUTH_URL || 'http://localhost:3001';
  const USER_URL = process.env.USER_URL || 'http://localhost:3005';

  beforeAll(async () => {
    // Aguarda User Service subir (em Docker Compose pode demorar)
    await waitForUserService(`${USER_URL}/health`);
  });

  it('deve autenticar usuário válido via Auth Service (chamando User Service)', async () => {
    // Cria usuário de teste no User Service (ajuste conforme sua API)
    await axios.post(`${USER_URL}/register`, {
      username: 'integration2',
      password: '123456',
      role: 'user'
    });
  // Aguarda 1s para garantir persistência
  await new Promise(r => setTimeout(r, 1000));

    // Health check explícito antes do login
    try {
      await axios.get(`${USER_URL}/health`);
      console.log('Health check do User Service OK antes do login.');
    } catch (e) {
      console.error('Health check do User Service FALHOU antes do login:', e?.message);
    }
    // Delay extra para garantir propagação de DNS/rede
    await new Promise(r => setTimeout(r, 2000));
    // Tenta login via Auth Service
    let res;
    try {
      res = await axios.post(`${AUTH_URL}/login`, {
        username: 'integration2',
        password: '123456'
      });
    } catch (err) {
      console.error('Erro no login via Auth Service:', {
        status: err?.response?.status,
        data: err?.response?.data,
        message: err?.message,
        stack: err?.stack
      });
      throw err;
    }
    expect(res.status).toBe(200);
    expect(res.data.token).toBeDefined();
  });

  it('deve rejeitar login inválido', async () => {
    try {
      await axios.post(`${AUTH_URL}/login`, {
        username: 'integration',
        password: 'errada'
      });
      throw new Error('Deveria ter falhado');
    } catch (err) {
      // Evita serialização circular
      const status = err?.response?.status;
      const msg = err?.message || String(err);
      expect([401, 400]).toContain(status);
      expect(msg).toBeDefined();
      // Nunca propague objeto de erro complexo
      if (!status) throw new Error(msg);
    }
  });
});
