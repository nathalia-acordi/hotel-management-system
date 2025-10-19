import axios from 'axios';

export default class UserReader {
  constructor(baseUrl) {
    this.baseUrl = baseUrl || process.env.USER_SERVICE_URL || 'http://localhost:3005';
  }
  async findByEmailOrUsername(identifier, isEmail) {
  // Este adaptador pode chamar endpoints do serviço de usuário.
  // Por simplicidade nesta etapa, tenta o endpoint de validação por username apenas quando não for e-mail
    if (isEmail) {
  // Opcional: endpoint de busca de usuário por e-mail; o fallback para validação por username não é adequado para e-mail
  // Retorna null para simular não encontrado, a menos que exista um endpoint real.
      return null;
    }
    try {
      const { data } = await axios.post(`${this.baseUrl}/validate`, { username: identifier, password: '___probe___' });
  // O /validate é baseado em senha; aqui não é possível obter o usuário sem a senha.
  // Em um cenário real, exponha um endpoint de busca de usuário. Por ora, retorne forma mínima ou null.
      return null;
    } catch {
      return null;
    }
  }
}
