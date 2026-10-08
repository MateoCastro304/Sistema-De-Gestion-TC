import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../../src/app.module';
import { configureApp } from '../../../src/app.setup';
import { PrismaService } from '../../../src/shared/infrastructure/prisma/prisma.service';

let app: INestApplication;

export async function startTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

  app = moduleRef.createNestApplication();
  configureApp(app);

  await app.init();
  await getPrisma().$connect();

  return app;
}

export async function stopTestApp(): Promise<void> {
  await getPrisma().$disconnect();
  await app.close();
}

export function getPrisma(): PrismaService {
  return app.get(PrismaService);
}
