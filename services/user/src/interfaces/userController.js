// Interface Layer: userController (ES Modules)
import { UserService } from '../application/UserService.js';
import { User } from '../domain/User.js';

const userService = new UserService();

export const validate = async (req, res) => {
  const { username, password } = req.body;
  const result = await userService.validateUser(username, password);
  res.json(result);
};

export const register = async (req, res) => {
  const { username, password, role } = req.body;
  // Cria novo usuário (id simples para exemplo)
  const user = new User(Date.now(), username, password, role || 'user');
  const saved = await userService.createUser(user);
  res.status(201).json(saved);
};