module.exports = {
    testEnvironment: 'node',
    rootDir: './',
    transform: {
      '^.+\\.tsx?$': ['ts-jest', { tsconfig: './tsconfig.spec.json' }],
    },
    modulePaths: ['<rootDir>'],
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/src/$1',
      '^@api/(.*)$': '<rootDir>/src/api/$1',
      '^@boffmedia/shared(.*)$': '<rootDir>/../../packages/shared/src$1',
    },
    modulePathIgnorePatterns: ['src/typings'],
    testPathIgnorePatterns: [
      '/node_modules./',
      '<rootDir>/(coverage|dist|lib|tmp)./',
    ],
    collectCoverageFrom: [
      'src/**/*.ts',
      '!src/**/*.spec.ts',
      '!src/**/*.e2e-spec.ts',
      '!src/main.ts',
      '!src/**/*.entity.ts',
      '!src/**/*.dto.ts',
      '!src/**/*.enum.ts',
      '!src/**/*.module.ts',
      '!src/**/*.interface.ts',
    ],
    coverageThreshold: {
      global: {
        branches: 40,
        functions: 50,
        lines: 50,
        statements: 50,
      },
    },
  };