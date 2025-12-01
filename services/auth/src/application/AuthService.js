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
    const isEmail = this.isEmail(identifier);
    const validated = await this.userReader.findByEmailOrUsername(identifier, isEmail, password);

    if (!validated) {
      const err = new Error('Credenciais inválidas');
      err.status = 401;
      throw err;
    }

    if (validated.passwordHash) {
      const match = await this.passwordHasher.compare(password, validated.passwordHash);
      if (!match) {
        const err = new Error('Credenciais inválidas');
        err.status = 401;
        throw err;
      }
    }
    
    const roleMap = {
      recepcionista: 'receptionist',
      hospede: 'guest',
      admin: 'admin',
      receptionist: 'receptionist',
      guest: 'guest'
    };

    const normalizedRole = roleMap[validated.role] || validated.role;
    
    const claims = {
      sub: validated.id,
      role: normalizedRole,
      username: validated.username
    };
    
    const token = this.tokenService.sign(claims, { expiresIn: '1h' });
    return {
      token,
      user: {
        id: validated.id,
        username: validated.username,
        email: validated.email || undefined,
        role: validated.role
      },
    };
  }
}
