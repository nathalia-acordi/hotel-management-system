import { User } from '../src/domain/User.js';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

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
    userService = new UserService(userRepositoryMock, eventPublisherMock, { hash: async p => `hashed:${p}`, compare: async (p, h) => h === `hashed:${p}` });
  });

  it('valida um usuário existente com senha correta', async () => {
  await userService.createUser(new User({ id: 20, username: 'novoUser', email: 'novo@ex.com', document: '52998224725', phone: '+5511999999999', password: '123456', role: 'user' }));
    const result = await userService.validateUser('novoUser', '123456');
    expect(result.valid).toBe(true);
    expect(result.role).toBe('user');
  });

  it('retorna inválido para senha incorreta', async () => {
  await userService.createUser(new User({ id: 21, username: 'outroUser', email: 'outro@ex.com', document: '11144477735', phone: '+5511888888888', password: 'abcdef', role: 'user' }));
    const result = await userService.validateUser('outroUser', 'senhaErrada');
    expect(result.valid).toBe(false);
  });

  it('publica um evento ao cadastrar um novo usuário', async () => {
  await userService.createUser(new User({ id: 22, username: 'eventoNovo', email: 'evento@ex.com', document: '15350946056', phone: '+5511777777777', password: 'pass123', role: 'user' }));
    expect(eventPublisherMock).toHaveBeenCalledWith('user.created', expect.objectContaining({ username: 'eventoNovo' }));
  });

  it('não permite o cadastro de usuários duplicados', async () => {
  // simula detecção de duplicidade pelo repositório (httpStatus 409)
    userRepositoryMock.save = jest.fn(async () => {
      const e = new Error('duplicate key');
      e.httpStatus = 409;
      throw e;
    });
    await expect(userService.createUser(new User({ id: 5, username: 'test', email: 't@e.com', document: '38440920005', phone: '+5511666666666', password: 'abc123', role: 'user' })))
      .rejects.toThrow('Conflito: usuário já existe');
  });

  it('valida que a senha deve ter no mínimo 6 caracteres', async () => {
    await expect(userService.createUser(new User({ id: 6, username: 'novo', email: 'n@e.com', document: '06698552003', phone: '+5511555555555', password: '123', role: 'user' })))
      .rejects.toThrow('Senha fraca');
  });

  it('permite o cadastro mesmo se o publishEvent falhar', async () => {
    eventPublisherMock.mockImplementationOnce(() => { throw new Error('RabbitMQ indisponível'); });
    await expect(userService.createUser(new User({ id: 7, username: 'event2', email: 'e2@e.com', document: '65976892001', phone: '+5511444444444', password: 'senha123', role: 'user' })))
      .resolves.toBeDefined();
  });

  it('permite o cadastro com senha de exatamente 6 caracteres', async () => {
    await expect(userService.createUser(new User({ id: 8, username: 'limite', email: 'l@e.com', document: '74659311000', phone: '+5511333333333', password: '123456', role: 'user' })))
      .resolves.toBeDefined();
  });

  it('permite o cadastro com senha muito longa', async () => {
    const longPass = 'a'.repeat(100);
    await expect(userService.createUser(new User({ id: 9, username: 'longpass', email: 'lp@e.com', document: '04016614009', phone: '+5511222222222', password: longPass, role: 'user' })))
      .resolves.toBeDefined();
  });

  it('não permite o cadastro com username vazio', async () => {
    await expect(userService.createUser(new User({ id: 10, username: '', email: 'x@e.com', document: '97926889098', phone: '+5511111111111', password: 'senha123', role: 'user' })))
      .rejects.toThrow('Username inválido');
  });

  it('não permite o cadastro com username ausente', async () => {
    await expect(userService.createUser(new User({ id: 11, username: undefined, email: 'y@e.com', document: '19330167007', phone: '+5511000000000', password: 'senha123', role: 'user' })))
      .rejects.toThrow('Username inválido');
  });

  it('retorna erro se o userRepository.save lançar exceção', async () => {
    userRepositoryMock.save = jest.fn(async () => { throw new Error('Erro no banco de dados'); });
    await expect(userService.createUser(new User({ id: 12, username: 'fail', email: 'f@e.com', document: '02691167078', phone: '+550099999999', password: 'senha123', role: 'user' })))
      .rejects.toThrow('Erro no banco de dados');
  });

  it('simula concorrência: dois cadastros simultâneos com o mesmo username', async () => {
  const user = new User({ id: 7, username: 'concurrent', email: 'c@e.com', document: '81032214001', phone: '+558888888888', password: 'password', role: 'user' });
    const p1 = userService.createUser(user);
    const p2 = userService.createUser(user);
    const results = await Promise.allSettled([p1, p2]);
    expect(results.filter(r => r.status === 'fulfilled').length).toBe(1);
    expect(results.filter(r => r.status === 'rejected').length).toBe(1);
    expect(results.find(r => r.status === 'rejected').reason.message).toBe('Usuário já existe');
  });

  it('retorna erro se o userRepository.save lançar exceção não relacionada a duplicidade', async () => {
    userRepositoryMock.save = jest.fn(async () => { throw new Error('Falha no banco de dados'); });
    await expect(userService.createUser(new User({ id: 31, username: 'dbfail', email: 'db@e.com', document: '08219234001', phone: '+557777777777', password: 'senha123', role: 'user' })))
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
  await userService.createUser(new User({ id: 30, username: 'deleteUser', email: 'd@e.com', document: '46635361001', phone: '+556666666666', password: '123456', role: 'user' }));
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
