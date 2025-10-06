// Application Layer: UserService (ES Modules)
export class UserService {
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
    if (!user.username || typeof user.username !== 'string' || user.username.trim() === '') {
      throw new Error('Username inválido');
    }

    const existingUser = await this.userRepository.findByUsername(user.username);
    if (existingUser) {
      throw new Error('Usuário já existe');
    }

    if (!user.password || user.password.length < 6) {
      throw new Error('Senha fraca');
    }

    // Simulando controle de concorrência com um lock
    const lockKey = `lock:${user.username}`;
    if (global[lockKey]) {
      throw new Error('Usuário já existe');
    }
    global[lockKey] = true;

    try {
      const savedUser = await this.userRepository.save(user);

      try {
        await this.eventPublisher('user.created', { id: savedUser.id, username: savedUser.username, role: savedUser.role });
      } catch (err) {
        // Log de erro removido para evitar ruído nos testes
      }

      return savedUser;
    } finally {
      delete global[lockKey];
    }
  }

  static isValidCPF(cpf) {
    cpf = (cpf || '').replace(/\D/g, '');
    if (!cpf || cpf.length !== 11 || /^([0-9])\1+$/.test(cpf)) return false;
    let sum = 0,
      rest;
    for (let i = 1; i <= 9; i++)
      sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    rest = (sum * 10) % 11;
    if (rest === 10 || rest === 11) rest = 0;
    if (rest !== parseInt(cpf.substring(9, 10))) return false;
    sum = 0;
    for (let i = 1; i <= 10; i++)
      sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    rest = (sum * 10) % 11;
    if (rest === 10 || rest === 11) rest = 0;
    if (rest !== parseInt(cpf.substring(10, 11))) return false;
    return true;
  }
}
