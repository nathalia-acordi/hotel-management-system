import { post as httpPost } from '../infrastructure/httpAdapter.js';

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3000';

export function createCredentialService({ post = httpPost } = {}) {
  return {
    async validateCredentials(username, password) {
      try {
        const data = await post(`${USER_SERVICE_URL}/validate`, { username, password });
        return data;
      } catch (err) {
        if (err.response?.status === 401) {
          return { valid: false };
        }
        throw new Error('Erro ao validar credenciais');
      }
    },
  };
}

export async function validateCredentials(username, password) {
  return createCredentialService().validateCredentials(username, password);
}