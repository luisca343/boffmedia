/**
 * Jest configuration for integration tests with real MySQL via Testcontainers.
 * Run via: pnpm --filter api test:integration
 *
 * This is a SEPARATE project from the main test suite (jest.config.ts). The main
 * suite fakes all databases and runs as part of the main test gate. This suite
 * runs against real MySQL and is optional — it skips gracefully if Docker is
 * unavailable, so pnpm test and local dev stay fast.
 */
module.exports = {
  displayName: 'api-integration',
  testEnvironment: 'node',
  rootDir: './',
  setupFiles: ['<rootDir>/jest.setup.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: './tsconfig.spec.json' }],
  },
  modulePaths: ['<rootDir>'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@api/(.*)$': '<rootDir>/src/api/$1',
    '^@repositories/(.*)$': '<rootDir>/src/api/_repositories/$1',
    '^@boffmedia/shared(.*)$': '<rootDir>/../../packages/shared/src$1',
  },
  modulePathIgnorePatterns: ['src/typings'],
  // NOT *.integration.spec.ts — that suffix is already taken by 39 fake-based
  // controller tests in the main suite, and matching it here swept every one of
  // them into this project. `.db.spec.ts` means exactly one thing: it talks to a
  // real database.
  testMatch: ['**/*.db.spec.ts'],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/(coverage|dist|lib|tmp)/'],
  coverageDirectory: 'coverage-integration',
  coverageProvider: 'v8',
  maxWorkers: 1,
  workerIdleMemoryLimit: '512MB',
  coverageReporters: ['text-summary'],
  collectCoverage: false,
  // Increase timeout for container startup
  testTimeout: 60000,
};
