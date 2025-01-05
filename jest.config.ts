module.exports = {
    testEnvironment: 'node',
    preset: 'ts-jest',
    rootDir: './',
    modulePaths: ['<rootDir>'],
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/src/$1', // Update this line to map the '@' alias correctly
    },
    modulePathIgnorePatterns: ['src/typings'],
    testPathIgnorePatterns: [
      '/node_modules./',
      '<rootDir>/(coverage|dist|lib|tmp)./',
    ],
  };