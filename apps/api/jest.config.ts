module.exports = {
    testEnvironment: 'node',
    preset: 'ts-jest',
    rootDir: './',
    modulePaths: ['<rootDir>'],
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/src/$1',
      '^@api/(.*)$': '<rootDir>/src/api/$1',
    },
    modulePathIgnorePatterns: ['src/typings'],
    testPathIgnorePatterns: [
      '/node_modules./',
      '<rootDir>/(coverage|dist|lib|tmp)./',
    ],
  };