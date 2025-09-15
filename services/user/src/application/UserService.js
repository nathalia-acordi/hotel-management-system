// Application Layer: UserService (ES Modules)
export class UserService {
  // Validação simples de CPF (formato e dígito)
  static isValidCPF(cpf) {
    cpf = (cpf || '').replace(/\D/g, '');
    if (!cpf || cpf.length !== 11 || /^([0-9])\1+$/.test(cpf)) return false;
    let sum = 0, rest;
    for (let i = 1; i <= 9; i++) sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    rest = (sum * 10) % 11;
    if (rest === 10 || rest === 11) rest = 0;
    if (rest !== parseInt(cpf.substring(9, 10))) return false;
    sum = 0;
    for (let i = 1; i <= 10; i++) sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    rest = (sum * 10) % 11;
    if (rest === 10 || rest === 11) rest = 0;
    if (rest !== parseInt(cpf.substring(10, 11))) return false;
    return true;
  }

  constructor(userRepository, eventPublisher) {
    this.userRepository = userRepository;
    this.eventPublisher = eventPublisher;
  }

  async validateUser(username, password) {
    const user = await this.userRepository.findByUsername(username);
    if (user && user.password === password) {
      return { valid: true, id: user.id, role: user.role };
    }
    return { valid: false };
  }

  async createUser(user) {
    // Valida username
    if (!user.username || typeof user.username !== 'string' || user.username.trim() === '') {
      throw new Error('Username inválido');
    }
    // Verifica duplicidade
    const existing = await this.userRepository.findByUsername(user.username);
    if (existing) {
      throw new Error('Usuário já existe');
    }
    // Valida senha forte (mínimo 6 caracteres)
    if (!user.password || user.password.length < 6) {
      throw new Error('Senha fraca');
    }
    const saved = await this.userRepository.save(user);
    // Publica evento UserCreated no RabbitMQ, mas não falha se der erro
    try {
      await this.eventPublisher('user.created', { id: saved.id, username: saved.username, role: saved.role });
    } catch (err) {
      console.error('Erro ao publicar evento no RabbitMQ:', err.message);
    }
    return saved;
  }
}