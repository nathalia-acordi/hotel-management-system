import { jest } from '@jest/globals';

// Aumenta o timeout para execuções de integração
if (process.env.JEST_INTEGRATION === '1') {
  jest.setTimeout(30000);
}

// Evita logs ruidosos e vazamento de segredos nos testes
const origError = console.error;
console.error = (...args) => {
  if (process.env.NODE_ENV === 'test') {
  // redige qualquer string parecida com token
    const redacted = args.map(a =>
      typeof a === 'string' ? a.replace(/[A-Za-z0-9-_]{10,}\.[A-Za-z0-9-_]{10,}\.[A-Za-z0-9-_]{10,}/g, '[REDACTED]') : a
    );
    return origError(...redacted);
  }
  return origError(...args);
};

// Fecha timers abertos de forma adequada
afterAll(async () => {
  jest.useRealTimers();
});
