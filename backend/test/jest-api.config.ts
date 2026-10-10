import type { Config } from 'jest';

const config: Config = {
  displayName: 'api',
  rootDir: process.cwd(),
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/test/modules/**/api/**/*.api.spec.ts'],
  testTimeout: 15000,
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
  // No se transforma nada de node_modules. La excepcion anterior para
  // @faker-js/faker lo convertia a CJS, y como el paquete es ESM puro y estos
  // configs corren con --experimental-vm-modules (lo exige el compilador WASM
  // de Prisma 7), al cargarlo fallaba con "exports is not defined".
  transformIgnorePatterns: ['/node_modules/'],
};

export default config;
