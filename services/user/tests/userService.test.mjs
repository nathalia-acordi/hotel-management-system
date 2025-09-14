import { jest } from '@jest/globals';
import { User } from '../src/domain/User.js';

// Mock do publishEvent para não precisar de RabbitMQ real
jest.unstable_mockModule('../src/infrastructure/rabbitmq.js', () => ({
  publishEvent: jest.fn()
}));

describe('UserService', () => {
  let UserService;
  let userService;

  beforeEach(async () => {
    // Garante que o mock está ativo antes de importar UserService
    await jest.unstable_mockModule('../src/infrastructure/rabbitmq.js', () => ({
      publishEvent: jest.fn()
    }));
    UserService = (await import('../src/application/UserService.js')).UserService;
    userService = new UserService();
  });

  it('valida usuário existente com senha correta', async () => {
    await userService.createUser(new User(2, 'test', '123', 'user'));
    const result = await userService.validateUser('test', '123');
    expect(result.valid).toBe(true);
    expect(result.role).toBe('user');
  });

  it('retorna inválido para senha errada', async () => {
    await userService.createUser(new User(3, 'test2', 'abc', 'user'));
    const result = await userService.validateUser('test2', 'errada');
    expect(result.valid).toBe(false);
  });

  it('publica evento ao cadastrar usuário', async () => {
    const rabbit = await import('../src/infrastructure/rabbitmq.js');
    await userService.createUser(new User(4, 'event', 'pass', 'user'));
    expect(rabbit.publishEvent).toHaveBeenCalledWith('user.created', expect.objectContaining({ username: 'event' }));
  });
});
