export default {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  globalSetup: '<rootDir>/src/jestGlobalSetup.mjs',
  globalTeardown: '<rootDir>/src/jestGlobalTeardown.mjs',
  setupFiles: ['<rootDir>/src/jestSetupEnv.mjs'],
};
