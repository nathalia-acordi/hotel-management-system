import { UserRepository } from '../infrastructure/UserRepository.js';
import { publishEvent } from '../infrastructure/rabbitmq.js';

const userRepository = new UserRepository();
const userService = new UserService(userRepository, publishEvent);
import { User } from '../domain/User.js';

export const validate = async (req, res) => {
  const { username, password } = req.body;
  const result = await userService.validateUser(username, password);
  res.json(result);
};

export const register = async (req, res) => {
  const { username, password, role } = req.body;
  const user = new User(Date.now(), username, password, role || 'user');
  const saved = await userService.createUser(user);
  res.status(201).json(saved);
};