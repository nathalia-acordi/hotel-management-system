import { jest } from '@jest/globals';


if (process.env.JEST_INTEGRATION === '1') {
  jest.setTimeout(30000);
}


const origError = console.error;
console.error = (...args) => {
  if (process.env.NODE_ENV === 'test') {
  
    const redacted = args.map(a =>
      typeof a === 'string' ? a.replace(/[A-Za-z0-9-_]{10,}\.[A-Za-z0-9-_]{10,}\.[A-Za-z0-9-_]{10,}/g, '[REDACTED]') : a
    );
    return origError(...redacted);
  }
  return origError(...args);
};


afterAll(async () => {
  jest.useRealTimers();
});
