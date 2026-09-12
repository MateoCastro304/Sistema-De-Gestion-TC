import type { Config } from 'jest';
import { join } from 'path';

const config: Config = {
  displayName: 'integration',
  rootDir: join(__dirname, '..'),
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/modules/**/int/**/*.int.spec.ts'],
  testTimeout: 30000,
  maxWorkers: '50%',
  clearMocks: true,
  verbose: true,
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/test/tsconfig.json' }],
  },
};

export default config;
