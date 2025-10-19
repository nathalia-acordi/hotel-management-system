export class AuthService {
  constructor({ userReader, tokenService, passwordHasher }) {
    this.userReader = userReader;
    this.tokenService = tokenService;
    this.passwordHasher = passwordHasher;
  }

  isEmail(identifier) {
    return /.+@.+\..+/.test(identifier);
  }

  async login(identifier, password) {
    const user = await this.userReader.findByEmailOrUsername(identifier, this.isEmail(identifier));
    if (!user) {
      const err = new Error('Credenciais inválidas');
      err.status = 401;
      throw err;
    }
    const ok = await this.passwordHasher.compare(password, user.passwordHash || user.password);
    if (!ok) {
      const err = new Error('Credenciais inválidas');
      err.status = 401;
      throw err;
    }
  // Normaliza papéis legados em PT para papéis canônicos em EN antes de emitir o token
  const roleMap = { recepcionista: 'receptionist', hospede: 'guest', admin: 'admin', receptionist: 'receptionist', guest: 'guest' };
  const normalizedRole = roleMap[user.role] || user.role;
  const claims = { sub: user.id, role: normalizedRole, username: user.username };
    const token = this.tokenService.sign(claims, { expiresIn: '1h' });
    return {
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
    };
  }
}
