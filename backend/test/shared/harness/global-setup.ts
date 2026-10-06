import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { execSync } from 'child_process';
import { setContainer } from './container-registry';

export default async function globalSetup(): Promise<void> {
  const container = await new PostgreSqlContainer('postgres:16').start();
  setContainer(container);

  process.env.DATABASE_URL = container.getConnectionUri();

  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: container.getConnectionUri() },
  });
}
