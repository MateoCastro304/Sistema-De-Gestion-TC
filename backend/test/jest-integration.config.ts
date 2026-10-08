import type { Config } from 'jest';

const config: Config = {
  displayName: 'integration',
  rootDir: process.cwd(),
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/modules/**/*.int.spec.ts'],
  testTimeout: 30000,
  maxWorkers: 1,
  globalSetup: '<rootDir>/test/shared/harness/global-setup.ts',
  globalTeardown: '<rootDir>/test/shared/harness/global-teardown.ts',
  clearMocks: true,
  verbose: true,
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
  transform: {
    '^.+\\.(t|j)sx?$': ['ts-jest', { tsconfig: '<rootDir>/test/tsconfig.json' }],
  },
  transformIgnorePatterns: ['node_modules/(?!(@faker-js/faker)/)'],
};

export default config;
