import type { Config } from 'jest';

const config: Config = {
  displayName: 'api',
  rootDir: process.cwd(),
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/modules/**/api/**/*.api.spec.ts'],
  testTimeout: 15000,
  maxWorkers: '50%',
  clearMocks: true,
  verbose: true,
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.(t|j)sx?$': ['ts-jest', { tsconfig: '<rootDir>/test/tsconfig.json' }],
  },
  transformIgnorePatterns: ['node_modules/(?!(@faker-js/faker)/)'],
};

export default config;
