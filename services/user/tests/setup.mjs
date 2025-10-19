import { jest } from '@jest/globals';
import mongoose from 'mongoose';

if (process.env.JEST_INTEGRATION === '1') {
  jest.setTimeout(30000);
}

const origWarn = console.warn;
console.warn = (...args) => {
  if (process.env.NODE_ENV === 'test') return; 
  return origWarn(...args);
};

afterAll(async () => {
  try {
    if (mongoose.connection && mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  } catch {}
  jest.useRealTimers();
});
