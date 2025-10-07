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
    console.log('[USER CONTROLLER] Recebendo requisição de registro:', req.body);
    console.log('[USER CONTROLLER] Dados recebidos no corpo da requisição:', req.body);

    // Validações explícitas
    if (!username || typeof username !== 'string' || username.trim() === '') {
      return res.status(400).json({ error: 'Username é obrigatório e deve ser uma string válida' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password é obrigatório e deve ter pelo menos 6 caracteres' });
    }

    if (role && typeof role !== 'string') {
      return res.status(400).json({ error: 'Role deve ser uma string válida' });
    }

    // Create a user object without manually setting the _id
    const user = new User(undefined, username, password, role || 'user');
    const saved = await userService.createUser(user);

    console.log('[USER CONTROLLER] Usuário registrado com sucesso:', saved);
    res.status(201).json(saved);
  } catch (err) {
    console.error('[USER CONTROLLER] Erro ao cadastrar usuário:', {
      message: err.message,
      stack: err.stack,
    });
    res.status(500).json({ error: 'Erro ao cadastrar usuário' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { username } = req.params;
    console.log('[USER CONTROLLER] Recebendo requisição para deletar usuário:', username);

    if (!username || typeof username !== 'string' || username.trim() === '') {
      return res.status(400).json({ error: 'Username é obrigatório e deve ser uma string válida' });
    }

    const deleted = await userService.deleteUser(username);

    if (deleted) {
      console.log('[USER CONTROLLER] Usuário deletado com sucesso:', username);
      res.status(200).json({ message: 'Usuário deletado com sucesso' });
    } else {
      console.warn('[USER CONTROLLER] Usuário não encontrado para deletar:', username);
      res.status(404).json({ error: 'Usuário não encontrado' });
    }
  } catch (err) {
    console.error('[USER CONTROLLER] Erro ao deletar usuário:', {
      message: err.message,
      stack: err.stack,
    });
    res.status(500).json({ error: 'Erro ao deletar usuário' });
  }
};