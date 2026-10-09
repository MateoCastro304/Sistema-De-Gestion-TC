import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { execSync } from 'child_process';
import { setContainer } from './container-registry';

/**
 * AppModule valida el entorno al arrancar (src/config/env.validation.ts), asi
 * que el harness tiene que proveer todas las variables obligatorias y no solo
 * DATABASE_URL: sin esto, cualquier spec que levante la app falla antes de
 * ejecutar su primer caso.
 *
 * Son valores de descarte para los tests. Los secretos JWT no los usa nadie
 * todavia (no hay modulo de auth), pero la validacion los exige con un minimo
 * de 32 caracteres.
 */
const TEST_ENV = {
  NODE_ENV: 'test',
  PORT: '3000',
  JWT_SECRET: 'test-only-jwt-secret-not-a-real-credential',
  JWT_REFRESH_SECRET: 'test-only-jwt-refresh-secret-not-a-real-credential',
};

export default async function globalSetup(): Promise<void> {
  const container = await new PostgreSqlContainer('postgres:16').start();
  setContainer(container);

  Object.assign(process.env, TEST_ENV);
  process.env.DATABASE_URL = container.getConnectionUri();

  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: container.getConnectionUri() },
  });
}
