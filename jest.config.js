/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/packages'],
  // packages/root/ui holds the built dashboard, not tests
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/build/', '/packages/root/ui/'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.build.json', diagnostics: false }],
  },
};
