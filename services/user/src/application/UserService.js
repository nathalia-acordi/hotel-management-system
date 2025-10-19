// Camada de Aplicação: UserService (ES Modules)
export class UserService {
  static inProgress = new Set();
  constructor(userRepository, eventPublisher, passwordHasher) {
    this.userRepository = userRepository;
    this.eventPublisher = eventPublisher;
    this.passwordHasher = passwordHasher;
  }

  async validateUser(username, password) {
    const user = await this.userRepository.findByUsername(username);
    if (user && (await this.passwordHasher.compare(password, user.password))) {
      return { valid: true, id: user.id || user._id?.toString(), role: user.role, username: user.username };
    }
    return { valid: false };
  }

  async createUser(user) {
    console.log('[USER SERVICE] Iniciando criação de usuário:', { ...user, password: '***' });
  // Validações básicas; a camada de interface deve ter feito a validação detalhada
    if (!user.username || typeof user.username !== 'string' || user.username.trim() === '') {
      const err = new Error('Username inválido');
      err.httpStatus = 400;
      throw err;
    }
    if (!user.email || !/^([^\s@]+)@([^\s@]+)\.[^\s@]+$/.test(user.email)) {
      const err = new Error('Email inválido');
      err.httpStatus = 400;
      throw err;
    }
    if (!user.document || typeof user.document !== 'string') {
      const err = new Error('Documento inválido');
      err.httpStatus = 400;
      throw err;
    }
    if (!user.phone || typeof user.phone !== 'string') {
      const err = new Error('Telefone inválido');
      err.httpStatus = 400;
      throw err;
    }
    if (!user.password || user.password.length < 6) {
      const err = new Error('Senha fraca');
      err.httpStatus = 400;
      throw err;
    }

  // Proteção contra concorrência e pré-checagem de duplicidade
    const key = user.username.trim();
    if (UserService.inProgress.has(key)) {
      const err = new Error('Usuário já existe');
      err.httpStatus = 409;
      throw err;
    }
    UserService.inProgress.add(key);

    try {
      const existing = await this.userRepository.findByUsername(user.username);
      if (existing) {
        const err = new Error('Usuário já existe');
        err.httpStatus = 409;
        throw err;
      }
      const hashed = await this.passwordHasher.hash(user.password);
      const toSave = { ...user, password: hashed, role: user.role || 'guest' };
      console.log('[USER SERVICE] Salvando usuário no repositório:', { ...toSave, password: '***' });
      const savedUser = await this.userRepository.save(toSave);

      try {
        await this.eventPublisher('user.created', { id: savedUser.id || savedUser._id?.toString(), username: savedUser.username, role: savedUser.role });
      } catch (err) {
        console.error('[USER SERVICE] Erro ao publicar evento user.created:', err?.message || err);
      }
      return savedUser;
    } catch (error) {
      if (error.httpStatus === 409 || error?.code === 11000) {
        const err = new Error('Conflito: usuário já existe');
        err.httpStatus = 409;
        throw err;
      }
      throw error;
    } finally {
      UserService.inProgress.delete(key);
    }
  }

  // Deleta usuário por username, retornando booleano
  async deleteUser(username) {
    if (!username || typeof username !== 'string' || username.trim() === '') {
      const err = new Error('Username inválido');
      err.httpStatus = 400;
      throw err;
    }
    return await this.userRepository.deleteByUsername(username);
  }

  // Utilitário estático para validar CPF
  static isValidCPF(cpf) {
    if (!cpf || typeof cpf !== 'string') return false;
    const digits = cpf.replace(/\D/g, '');
    if (digits.length !== 11 || /^([0-9])\1{10}$/.test(digits)) return false;
    const calcCheck = (base) => {
      let sum = 0;
      for (let i = 0; i < base.length; i++) sum += parseInt(base[i], 10) * (base.length + 1 - i);
      const mod = (sum * 10) % 11;
      return mod === 10 ? 0 : mod;
    };
    const d1 = calcCheck(digits.slice(0, 9));
    const d2 = calcCheck(digits.slice(0, 9) + d1);
    return d1 === parseInt(digits[9], 10) && d2 === parseInt(digits[10], 10);
  }
}
