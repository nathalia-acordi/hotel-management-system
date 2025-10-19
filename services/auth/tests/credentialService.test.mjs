import { jest } from '@jest/globals';
import { createCredentialService } from '../src/domain/credentialService.js';

const post = jest.fn(async (url, data) => {
  if (url.endsWith('/validate') && data.username === 'usuario' && data.password === 'senha') {
    return { valid: true, id: '123', role: 'user' };
  }
  if (url.endsWith('/validate') && data.password === 'wrong-password') {
    return { valid: false };
  }
  throw new Error('Erro na comunicação com o User Service');
});

const { validateCredentials } = createCredentialService({ post });

describe('Credential Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    post.mockImplementation(async (url, data) => {
      if (url.endsWith('/validate') && data.username === 'usuario' && data.password === 'senha') {
        return { valid: true, id: '123', role: 'user' };
      }
      if (url.endsWith('/validate') && data.password === 'wrong-password') {
        return { valid: false };
      }
      throw new Error('Erro na comunicação com o User Service');
    });
  });

  it('Deve validar credenciais com sucesso', async () => {
    const result = await validateCredentials('usuario', 'senha');
  expect(post).toHaveBeenCalledTimes(1);
  const [calledUrl, calledBody] = post.mock.calls[0];
    expect(calledUrl.endsWith('/validate')).toBe(true);
    expect(calledBody).toEqual({ username: 'usuario', password: 'senha' });
    expect(result).toEqual({ valid: true, id: '123', role: 'user' });
  });

  it('Deve lançar erro ao falhar na validação', async () => {
    post.mockImplementationOnce(async () => {
      throw new Error('Erro ao validar credenciais');
    });

  await expect(validateCredentials('usuario', 'senha')).rejects.toThrow('Erro ao validar credenciais');

  expect(post).toHaveBeenCalledTimes(1);
  const [url2, body2] = post.mock.calls[0];
    expect(url2.endsWith('/validate')).toBe(true);
    expect(body2).toEqual({ username: 'usuario', password: 'senha' });
  });
});