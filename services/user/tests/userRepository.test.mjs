import mongoose from 'mongoose';
import { UserRepositoryImpl } from '../src/infrastructure/UserRepository.js';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { describe } from '@jest/globals';

let mongoServer;
let userRepository;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  userRepository = new UserRepositoryImpl();

  await mongoose.connection.models.User.ensureIndexes();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('UserRepository', () => {
  beforeEach(async () => {
    await mongoose.connection.db.dropDatabase();
  });

  it('deve salvar um usuário válido', async () => {
    const user = { username: 'test_user', password: 'securepassword', role: 'user' };
    const savedUser = await userRepository.save(user);
    expect(savedUser).toHaveProperty('_id');
    expect(savedUser.username).toBe(user.username);
    expect(savedUser.role).toBe(user.role);
  });

  it('deve lançar erro ao salvar usuário com username duplicado', async () => {
    const user = { username: 'duplicate_user', password: 'securepassword', role: 'user' };
    await userRepository.save(user);
    await expect(userRepository.save(user)).rejects.toThrow('Username already exists');
  });

  it('deve buscar um usuário pelo username', async () => {
    const user = { username: 'find_user', password: 'securepassword', role: 'user' };
    await userRepository.save(user);
    const foundUser = await userRepository.findByUsername(user.username);
    expect(foundUser).not.toBeNull();
    expect(foundUser.username).toBe(user.username);
  });

  it('deve retornar null ao buscar um username inexistente', async () => {
    const foundUser = await userRepository.findByUsername('nonexistent_user');
    expect(foundUser).toBeNull();
  });

  it('deve retornar todos os usuários cadastrados', async () => {
    const users = [
      { username: 'user1', password: 'pass1', role: 'user' },
      { username: 'user2', password: 'pass2', role: 'admin' },
    ];
    await Promise.all(users.map(user => userRepository.save(user)));
    const allUsers = await userRepository.getAll();
    expect(allUsers).toHaveLength(users.length);
    expect(allUsers.map(u => u.username)).toEqual(expect.arrayContaining(['user1', 'user2']));
  });

  it('deve retornar lista vazia quando não houver usuários', async () => {
    const allUsers = await userRepository.getAll();
    expect(allUsers).toHaveLength(0);
  });
});
