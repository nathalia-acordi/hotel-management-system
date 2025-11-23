export default {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/tests/**/*.test.mjs'],
  transform: {},
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  setupFilesAfterEnv: ['<rootDir>/tests/setup.mjs'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/interfaces/docs/**',
    '!**/tests/**'
  ],
  
  
};
