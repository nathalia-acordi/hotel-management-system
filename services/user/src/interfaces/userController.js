import { UserRepositoryImpl } from '../infrastructure/UserRepository.js';
import { publishEvent } from '../infrastructure/rabbitmq.js';
import { UserService } from '../application/UserService.js';
import { registerSchema as baseRegisterSchema } from './dto/userSchemas.js';
import { BcryptPasswordHasher } from '../infrastructure/passwordHasher.js';
import { User } from '../domain/User.js';

// Injeção de dependência (DIP)
const userRepository = new UserRepositoryImpl();
const passwordHasher = new BcryptPasswordHasher();
const userService = new UserService(userRepository, publishEvent, passwordHasher);

export const validate = async (req, res) => {
  const { username, password } = req.body;
  const result = await userService.validateUser(username, password);
  res.json(result);
};

const registerSchema = baseRegisterSchema;

export const register = async (req, res) => {
  try {
  console.log('[USER CONTROLLER] Iniciando registro de usuário');

    const { error, value } = registerSchema.validate(req.body, { abortEarly: false });
    if (error) {
      console.log('[USER CONTROLLER] Falha na validação');
      return res.status(400).json({ erro: 'Dados inválidos', detalhes: error.details.map(d => d.message) });
    }

  // sanitiza entradas
  const username = value.username.trim();
  const email = value.email.trim().toLowerCase();
  const document = value.document.replace(/\D/g, '');
  // Limpeza básica no formato E.164: mantém dígitos e + inicial opcional
  const phone = value.phone.replace(/[^+\d]/g, '');
  const password = value.password;
  const role = value.role;

    console.log('[USER CONTROLLER] Dados validados com sucesso');

  // Cria um objeto de domínio de usuário
  const user = new User({ id: undefined, username, email, document, phone, password, role });

    const saved = await userService.createUser(user);
  console.log('[USER CONTROLLER] Usuário registrado com sucesso:', { id: saved._id?.toString?.() || saved.id, username: saved.username, email: saved.email, role: saved.role });

    const dto = {
      id: saved._id?.toString?.() || saved.id,
      username: saved.username,
      email: saved.email,
      role: saved.role,
      document: saved.document,
      phone: saved.phone,
      active: saved.active,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
    res.status(201).json({ mensagem: 'Usuário criado com sucesso', usuario: dto });
  } catch (err) {
    console.error('[USER CONTROLLER] Erro ao cadastrar usuário:', {
      message: err.message,
      stack: err.stack,
    });
    const status = err.httpStatus || 500;
    res.status(status).json({ erro: err.message || 'Erro ao cadastrar usuário' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { username } = req.params;
    console.log('[USER CONTROLLER] Recebendo requisição para deletar usuário:', username);

    if (!username || typeof username !== 'string' || username.trim() === '') {
  return res.status(400).json({ erro: 'Username é obrigatório e deve ser uma string válida' });
    }

    const deleted = await userService.deleteUser(username);

    if (deleted) {
      console.log('[USER CONTROLLER] Usuário deletado com sucesso:', username);
      res.status(200).json({ mensagem: 'Usuário removido' });
    } else {
      console.warn('[USER CONTROLLER] Usuário não encontrado para deletar:', username);
      res.status(404).json({ erro: 'Usuário não encontrado' });
    }
  } catch (err) {
    console.error('[USER CONTROLLER] Erro ao deletar usuário:', {
      message: err.message,
      stack: err.stack,
    });
    res.status(500).json({ erro: 'Erro ao deletar usuário' });
  }
};