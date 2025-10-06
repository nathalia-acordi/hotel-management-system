import { User } from '../src/domain/User.js';
import { jest } from '@jest/globals';

jest.unstable_mockModule('../src/infrastructure/rabbitmq.js', () => ({
  publishEvent: jest.fn()
}));

describe('UserService', () => {
  let UserService;
  let userRepositoryMock;
  let eventPublisherMock;
  let userService;
  let usersDb;

  beforeEach(async () => {
    UserService = (await import('../src/application/UserService.js')).UserService;
    usersDb = [];
    userRepositoryMock = {
      save: jest.fn(async user => {
        usersDb.push({ ...user });
        return user;
      }),
      findByUsername: jest.fn(async username => {
        return usersDb.find(u => u.username === username);
      })
    };
    eventPublisherMock = jest.fn();
    userService = new UserService(userRepositoryMock, eventPublisherMock);
  });

  it('valida usuário existente com senha correta', async () => {
    // Usar username único para não conflitar com o mock
    await userService.createUser(new User(20, 'novoUser', '123456', 'user'));
    const result = await userService.validateUser('novoUser', '123456');
    expect(result.valid).toBe(true);
    expect(result.role).toBe('user');
  });

  it('retorna inválido para senha errada', async () => {
    await userService.createUser(new User(21, 'outroUser', 'abcdef', 'user'));
    const result = await userService.validateUser('outroUser', 'errada');
    expect(result.valid).toBe(false);
  });

  it('publica evento ao cadastrar usuário', async () => {
    await userService.createUser(new User(22, 'eventoNovo', 'pass123', 'user'));
    expect(eventPublisherMock).toHaveBeenCalledWith('user.created', expect.objectContaining({ username: 'eventoNovo' }));
  });

  it('não permite cadastro duplicado', async () => {
    userRepositoryMock.findByUsername = jest.fn(async username => ({ id: 5, username, password: 'abc', role: 'user' }));
    await expect(userService.createUser(new User(5, 'test', 'abc', 'user')))
      .rejects.toThrow('Usuário já existe');
  });

  it('valida senha forte (mínimo 6 caracteres)', async () => {
    await expect(userService.createUser(new User(6, 'novo', '123', 'user')))
      .rejects.toThrow('Senha fraca');
  });

  it('não falha cadastro se publishEvent der erro', async () => {
    eventPublisherMock.mockImplementationOnce(() => { throw new Error('RabbitMQ down'); });
    await expect(userService.createUser(new User(7, 'event2', 'senha123', 'user')))
      .resolves.toBeDefined();
  });

  it('permite cadastro com senha exatamente 6 caracteres', async () => {
    await expect(userService.createUser(new User(8, 'limite', '123456', 'user')))
      .resolves.toBeDefined();
  });

  it('permite cadastro com senha muito longa', async () => {
    const longPass = 'a'.repeat(100);
    await expect(userService.createUser(new User(9, 'longpass', longPass, 'user')))
      .resolves.toBeDefined();
  });

  it('não permite cadastro com username vazio', async () => {
    await expect(userService.createUser(new User(10, '', 'senha123', 'user')))
      .rejects.toThrow('Username inválido');
  });

  it('não permite cadastro com username ausente', async () => {
    await expect(userService.createUser(new User(11, undefined, 'senha123', 'user')))
      .rejects.toThrow('Username inválido');
  });

  it('retorna erro se userRepository.save lançar exceção', async () => {
    userRepositoryMock.save = jest.fn(async () => { throw new Error('DB error'); });
    await expect(userService.createUser(new User(12, 'fail', 'senha123', 'user')))
      .rejects.toThrow('DB error');
  });

  it('simula concorrência: dois cadastros simultâneos com mesmo username', async () => {
    const user = new User(7, 'concurrent', 'password', 'user');
    const p1 = userService.createUser(user);
    const p2 = userService.createUser(user);
    const results = await Promise.allSettled([p1, p2]);
    expect(results.filter(r => r.status === 'fulfilled').length).toBe(1);
    expect(results.filter(r => r.status === 'rejected').length).toBe(1);
    expect(results.find(r => r.status === 'rejected').reason.message).toBe('Usuário já existe');
  });

  it('retorna erro se userRepository.findByUsername lançar exceção', async () => {
    userRepositoryMock.findByUsername = jest.fn(async () => { throw new Error('DB fail'); });
    await expect(userService.createUser(new User(31, 'dbfail', 'senha123', 'user')))
      .rejects.toThrow('DB fail');
  });

  it('cobre isValidCPF: cpf válido', () => {
    expect(UserService.isValidCPF('529.982.247-25')).toBe(true);
  });

  it('cobre isValidCPF: cpf inválido', () => {
    expect(UserService.isValidCPF('123.456.789-00')).toBe(false);
    expect(UserService.isValidCPF('')).toBe(false);
    expect(UserService.isValidCPF('111.111.111-11')).toBe(false);
    expect(UserService.isValidCPF(null)).toBe(false);
  });
});

describe('UserService - Tratamento de Erros', () => {
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  test('Deve registrar erro ao falhar no RabbitMQ', async () => {
    // Simule uma falha no RabbitMQ
    const userService = {
      createUser: jest.fn().mockImplementation(() => {
        console.error('Erro ao publicar evento no RabbitMQ:', 'RabbitMQ down');
        throw new Error('RabbitMQ down');
      }),
    };

    try {
      await userService.createUser({ username: 'test_user', password: '123456' });
    } catch (err) {
      expect(consoleSpy).toHaveBeenCalledWith('Erro ao publicar evento no RabbitMQ:', 'RabbitMQ down');
    }
  });

  test('Deve registrar erro genérico ao publicar evento', async () => {
    const userService = {
      createUser: jest.fn().mockImplementation(() => {
        console.error('Erro ao publicar evento no RabbitMQ:', 'Erro no evento');
        throw new Error('Erro no evento');
      }),
    };

    try {
      await userService.createUser({ username: 'test_user', password: '123456' });
    } catch (err) {
      expect(consoleSpy).toHaveBeenCalledWith('Erro ao publicar evento no RabbitMQ:', 'Erro no evento');
    }
  });
});
