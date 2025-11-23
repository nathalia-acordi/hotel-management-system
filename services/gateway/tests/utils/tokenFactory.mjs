import jwt from 'jsonwebtoken';





const SECRET = process.env.JWT_SECRET || 'segredo_super_secreto';

export function createToken(role = 'admin', overrides = {}) {
  const payload = {
    id: overrides.id || 'test-user-id',
    sub: overrides.sub || overrides.id || 'test-user-id',
    username: overrides.username || (role + '_user'),
    role,
    ...overrides.extra
  };
  return jwt.sign(payload, SECRET, { expiresIn: '1h' });
}

export const tokens = {
  admin: createToken('admin'),
  receptionist: createToken('receptionist'),
  guest: createToken('guest')
};

export default { createToken, tokens };