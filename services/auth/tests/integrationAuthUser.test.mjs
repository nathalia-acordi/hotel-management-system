import axios from 'axios';

// Teste de integração Auth ↔ User Service
// - Pré-requisito: ambos os serviços devem estar rodando (ex: via Docker Compose)
// - Sincroniza startup dos serviços para evitar race conditions
// - Cobre fluxo de sucesso (token) e erro (credenciais inválidas)

import { jest } from '@jest/globals';
jest.setTimeout(20000); // Timeout maior para ambiente Docker

// Aguarda User Service ficar disponível (útil em ambientes orquestrados)
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

describe('Integração Auth ↔ User Service', () => {
  // Lê variáveis de ambiente para URLs
  const AUTH_URL = process.env.AUTH_URL || 'http://localhost:3001';
  const USER_URL = process.env.USER_URL || 'http://localhost:3005';

  beforeAll(async () => {
    // Aguarda User Service subir (em Docker Compose pode demorar)
    await waitForUserService(`${USER_URL}/health`);
  });

  it('deve autenticar usuário válido via Auth Service (chamando User Service)', async () => {
    // Cria usuário de teste no User Service
    await axios.post(`${USER_URL}/register`, {
      username: 'integration2',
      password: '123456',
      role: 'user'
    });
    // Aguarda persistência
    await new Promise(r => setTimeout(r, 1000));

    // Health check explícito antes do login
    try {
      await axios.get(`${USER_URL}/health`);
    } catch (e) {
      // Loga erro mas não falha
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
      // Loga erro detalhado
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
    // Testa fluxo de erro: credenciais inválidas
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
