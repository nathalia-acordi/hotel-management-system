import { jest } from '@jest/globals';
import mongoose from 'mongoose';

if (process.env.JEST_INTEGRATION === '1') {
  jest.setTimeout(30000);
}

afterAll(async () => {
  try {
    if (mongoose.connection && mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  } catch {}
  jest.useRealTimers();
});
