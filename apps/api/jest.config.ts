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
  };