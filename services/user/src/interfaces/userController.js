import { UserRepositoryImpl } from '../infrastructure/UserRepository.js';
import { publishEvent } from '../infrastructure/rabbitmq.js';
import { UserService } from '../application/UserService.js';
import { User } from '../domain/User.js';

// Injeção de dependência (DIP)
const userRepository = new UserRepositoryImpl();
const userService = new UserService(userRepository, publishEvent);

export const validate = async (req, res) => {
  const { username, password } = req.body;
  const result = await userService.validateUser(username, password);
  res.json(result);
};

export const register = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // Create a user object without manually setting the _id
    const user = new User(undefined, username, password, role || 'user');
    const saved = await userService.createUser(user);

    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao cadastrar usuário' });
  }
};