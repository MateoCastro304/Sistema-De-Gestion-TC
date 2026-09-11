
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { execSync } from 'child_process';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from '../../../src/shared/infrastructure/prisma/prisma.service';

let container: StartedPostgreSqlContainer;
let app: INestApplication;

export async function startTestApp(): Promise<INestApplication> {
  container = await new PostgreSqlContainer('postgres:16').start();
  process.env.DATABASE_URL = container.getConnectionUri();

  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: container.getConnectionUri() },
  });

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  // cualquier otro pipe/filter/interceptor global de main.ts va acá también
  await app.init();
  return app;
}

export async function stopTestApp(): Promise<void> {
  await app.close();
  await container.stop();
}

export function getPrisma(): PrismaService {
  return app.get(PrismaService);
}