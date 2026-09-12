import type { Config } from 'jest';
import { join } from 'path';

const config: Config = {
  displayName: 'api',
  rootDir: join(__dirname, '..'),
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/modules/**/api/**/*.api.spec.ts'],
  testTimeout: 15000,
  maxWorkers: '50%',
  clearMocks: true,
  verbose: true,
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/test/tsconfig.json' }],
  },
};

export default config;
