import Joi from 'joi';
import { AuthService } from '../application/AuthService.js';
import { JwtTokenService } from '../infrastructure/JwtTokenService.js';
import UserReader from '../application/UserReader.js';
import PasswordHasher from '../infrastructure/passwordHasher.js';
import { publishLogin } from '../domain/eventService.js';

const loginSchema = Joi.object({
  identifier: Joi.string().min(3).max(100).required().messages({
    'string.base': 'Identifier deve ser uma string',
    'string.min': 'Identifier deve ter ao menos 3 caracteres',
    'any.required': 'Identifier é obrigatório'
  }),
  password: Joi.string()
    .min(8)
    .pattern(/[a-z]/, 'minúscula')
    .pattern(/[A-Z]/, 'maiúscula')
    .pattern(/[0-9]/, 'dígito')
    .required()
    .messages({
      'string.min': 'Senha deve conter ao menos 8 caracteres',
      'any.required': 'Senha é obrigatória'
    }),
});

// Dependências padrão (podem ser sobrescritas em testes)
const defaultAuthService = new AuthService({
  userReader: new UserReader(),
  tokenService: new JwtTokenService(),
  passwordHasher: new PasswordHasher(),
});

export const login = (authService = defaultAuthService) => async (req, res) => {
  const { error, value } = loginSchema.validate(req.body || {}, { abortEarly: false });
  if (error) {
    return res.status(400).json({ erro: 'Dados inválidos', detalhes: error.details.map(d => d.message) });
  }

  try {
  const result = await authService.login(value.identifier, value.password);
  if (!result) return res.status(401).json({ erro: 'Credenciais inválidas' });

  // Dispara evento de login sem aguardar retorno (não bloqueante)
    try { await publishLogin(result.user.id, result.user.username); } catch {}
    return res.status(200).json({ mensagem: 'Login realizado com sucesso', token: result.token, usuario: result.user });
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ erro: err.message });
    if (err.status === 401) return res.status(401).json({ erro: 'Credenciais inválidas' });
    console.error('[AUTH] Erro inesperado ao autenticar:', err.message);
    return res.status(500).json({ erro: 'Erro interno do servidor' });
  }
};