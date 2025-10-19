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
  // coverageThreshold: { global: { statements: 70, branches: 50, functions: 50, lines: 70 } },
};
