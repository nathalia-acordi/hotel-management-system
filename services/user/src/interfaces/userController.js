import { UserRepository } from '../infrastructure/UserRepository.js';
import { publishEvent } from '../infrastructure/rabbitmq.js';
import { UserService } from '../application/UserService.js';
import { User } from '../domain/User.js';

const userRepository = new UserRepository();
const userService = new UserService(userRepository, publishEvent);

export const validate = async (req, res) => {
  const { username, password } = req.body;
  const result = await userService.validateUser(username, password);
  res.json(result);
};

export const register = async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const user = new User(Date.now(), username, password, role || 'user');
    const saved = await userService.createUser(user);
    res.status(201).json(saved);
  } catch (err) {
    console.error('Erro no cadastro de usuário:', err.message);
    res.status(500).json({ error: 'Erro ao cadastrar usuário' });
  }
};