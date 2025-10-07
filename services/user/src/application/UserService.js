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
    console.log('[USER SERVICE] Iniciando criação de usuário:', user);
    if (!user.username || typeof user.username !== 'string' || user.username.trim() === '') {
      console.error('[USER SERVICE] Username inválido:', user.username);
      throw new Error('Username inválido');
    }

    const existingUser = await this.userRepository.findByUsername(user.username);
    if (existingUser) {
      console.error('[USER SERVICE] Usuário já existe:', user.username);
      throw new Error('Usuário já existe');
    }

    if (!user.password || user.password.length < 6) {
      console.error('[USER SERVICE] Senha fraca:', user.password);
      throw new Error('Senha fraca');
    }

    const lockKey = `lock:${user.username}`;
    if (global[lockKey]) {
      console.error('[USER SERVICE] Lock detectado para usuário:', user.username);
      throw new Error('Usuário já existe');
    }
    global[lockKey] = true;

    try {
      console.log('[USER SERVICE] Salvando usuário no repositório:', user);
      const savedUser = await this.userRepository.save(user);
      console.log('[USER SERVICE] Usuário salvo com sucesso:', savedUser);

      try {
        console.log('[USER SERVICE] Publicando evento user.created para:', savedUser);
        await this.eventPublisher('user.created', { id: savedUser.id, username: savedUser.username, role: savedUser.role });
      } catch (err) {
        console.error('[USER SERVICE] Erro ao publicar evento user.created:', err);
      }

      return savedUser;
    } finally {
      console.log('[USER SERVICE] Liberando lock para usuário:', user.username);
      delete global[lockKey];
    }
  }

  async deleteUser(username) {
    console.log('[USER SERVICE] Iniciando deleção de usuário:', username);
    try {
      const deleted = await this.userRepository.deleteByUsername(username);
      if (deleted) {
        console.log('[USER SERVICE] Usuário deletado com sucesso:', username);
        return true;
      } else {
        console.warn('[USER SERVICE] Usuário não encontrado para deleção:', username);
        return false;
      }
    } catch (err) {
      console.error('[USER SERVICE] Erro ao deletar usuário:', {
        message: err.message,
        stack: err.stack,
      });
      throw err;
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
