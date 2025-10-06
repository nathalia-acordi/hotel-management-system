import axios from 'axios';

// Teste de integração Auth ↔ User Service
// Pré-requisito: ambos os serviços devem estar rodando (ex: via Docker Compose)
describe('Integração Auth ↔ User Service', () => {
  const AUTH_URL = process.env.AUTH_URL || 'http://localhost:3001';
  const USER_URL = process.env.USER_URL || 'http://localhost:3005';

  it('deve autenticar usuário válido via Auth Service (chamando User Service)', async () => {
    // Cria usuário de teste no User Service (ajuste conforme sua API)
    await axios.post(`${USER_URL}/register`, {
      username: 'integration',
      password: '123',
      role: 'user'
    });

    // Tenta login via Auth Service
    const res = await axios.post(`${AUTH_URL}/login`, {
      username: 'integration',
      password: '123'
    });
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
      expect(err.response.status).toBe(401);
    }
  });
});
