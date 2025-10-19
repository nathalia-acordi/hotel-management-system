// Importa explicitamente o Jest (solução temporária)
import { jest } from '@jest/globals';

// Suprime logs e erros do console durante os testes
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});