export function makeValidPayload(overrides = {}) {
  return {
    username: 'John',
    email: 'John@Example.com',
    document: '123.456.789-00',
    phone: '(11) 99999-9999',
    password: 'Strong1A',
    ...overrides,
  };
}

export function normalize({ email, document, phone }) {
  const normEmail = (email || '').trim().toLowerCase();
  const normDoc = (document || '').replace(/\D/g, '');
  const normPhone = (phone || '').replace(/[^+\d]/g, '');
  return { email: normEmail, document: normDoc, phone: normPhone };
}

export function fakeUser(overrides = {}) {
  return {
    _id: '507f1f77bcf86cd799439011',
    username: 'John',
    email: 'john@example.com',
    document: '12345678900',
  phone: '+5511999999999',
    role: 'guest',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}
