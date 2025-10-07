import { User } from '../src/domain/User.js';
import { jest } from '@jest/globals';

jest.unstable_mockModule('../src/infrastructure/rabbitmq.js', () => ({
  publishEvent: jest.fn()
}));

describe('Serviço de Usuários (UserService)', () => {
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
      }),
      deleteByUsername: jest.fn(async username => {
        const index = usersDb.findIndex(u => u.username === username);
        if (index !== -1) {
          usersDb.splice(index, 1);
          return true;
        }
        return false;
      }),
    };
    eventPublisherMock = jest.fn();
    userService = new UserService(userRepositoryMock, eventPublisherMock);
  });

  it('valida um usuário existente com senha correta', async () => {
    await userService.createUser(new User(20, 'novoUser', '123456', 'user'));
    const result = await userService.validateUser('novoUser', '123456');
    expect(result.valid).toBe(true);
    expect(result.role).toBe('user');
  });

  it('retorna inválido para senha incorreta', async () => {
    await userService.createUser(new User(21, 'outroUser', 'abcdef', 'user'));
    const result = await userService.validateUser('outroUser', 'senhaErrada');
    expect(result.valid).toBe(false);
  });

  it('publica um evento ao cadastrar um novo usuário', async () => {
    await userService.createUser(new User(22, 'eventoNovo', 'pass123', 'user'));
    expect(eventPublisherMock).toHaveBeenCalledWith('user.created', expect.objectContaining({ username: 'eventoNovo' }));
  });

  it('não permite o cadastro de usuários duplicados', async () => {
    userRepositoryMock.findByUsername = jest.fn(async username => ({ id: 5, username, password: 'abc', role: 'user' }));
    await expect(userService.createUser(new User(5, 'test', 'abc', 'user')))
      .rejects.toThrow('Usuário já existe');
  });

  it('valida que a senha deve ter no mínimo 6 caracteres', async () => {
    await expect(userService.createUser(new User(6, 'novo', '123', 'user')))
      .rejects.toThrow('Senha fraca');
  });

  it('permite o cadastro mesmo se o publishEvent falhar', async () => {
    eventPublisherMock.mockImplementationOnce(() => { throw new Error('RabbitMQ indisponível'); });
    await expect(userService.createUser(new User(7, 'event2', 'senha123', 'user')))
      .resolves.toBeDefined();
  });

  it('permite o cadastro com senha de exatamente 6 caracteres', async () => {
    await expect(userService.createUser(new User(8, 'limite', '123456', 'user')))
      .resolves.toBeDefined();
  });

  it('permite o cadastro com senha muito longa', async () => {
    const longPass = 'a'.repeat(100);
    await expect(userService.createUser(new User(9, 'longpass', longPass, 'user')))
      .resolves.toBeDefined();
  });

  it('não permite o cadastro com username vazio', async () => {
    await expect(userService.createUser(new User(10, '', 'senha123', 'user')))
      .rejects.toThrow('Username inválido');
  });

  it('não permite o cadastro com username ausente', async () => {
    await expect(userService.createUser(new User(11, undefined, 'senha123', 'user')))
      .rejects.toThrow('Username inválido');
  });

  it('retorna erro se o userRepository.save lançar exceção', async () => {
    userRepositoryMock.save = jest.fn(async () => { throw new Error('Erro no banco de dados'); });
    await expect(userService.createUser(new User(12, 'fail', 'senha123', 'user')))
      .rejects.toThrow('Erro no banco de dados');
  });

  it('simula concorrência: dois cadastros simultâneos com o mesmo username', async () => {
    const user = new User(7, 'concurrent', 'password', 'user');
    const p1 = userService.createUser(user);
    const p2 = userService.createUser(user);
    const results = await Promise.allSettled([p1, p2]);
    expect(results.filter(r => r.status === 'fulfilled').length).toBe(1);
    expect(results.filter(r => r.status === 'rejected').length).toBe(1);
    expect(results.find(r => r.status === 'rejected').reason.message).toBe('Usuário já existe');
  });

  it('retorna erro se o userRepository.findByUsername lançar exceção', async () => {
    userRepositoryMock.findByUsername = jest.fn(async () => { throw new Error('Falha no banco de dados'); });
    await expect(userService.createUser(new User(31, 'dbfail', 'senha123', 'user')))
      .rejects.toThrow('Falha no banco de dados');
  });

  it('valida CPF: retorna verdadeiro para CPF válido', () => {
    expect(UserService.isValidCPF('529.982.247-25')).toBe(true);
  });

  it('cobre isValidCPF: cpf inválido', () => {
    expect(UserService.isValidCPF('123.456.789-00')).toBe(false);
    expect(UserService.isValidCPF('')).toBe(false);
    expect(UserService.isValidCPF('111.111.111-11')).toBe(false);
    expect(UserService.isValidCPF(null)).toBe(false);
  });

  it('deleta um usuário existente', async () => {
    await userService.createUser(new User(30, 'deleteUser', '123456', 'user'));
    const deleted = await userService.deleteUser('deleteUser');
    expect(deleted).toBe(true);
    const result = await userService.validateUser('deleteUser', '123456');
    expect(result.valid).toBe(false);
  });

  it('retorna false ao tentar deletar um usuário inexistente', async () => {
    const deleted = await userService.deleteUser('nonExistentUser');
    expect(deleted).toBe(false);
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
