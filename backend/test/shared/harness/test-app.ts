
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../../src/app.module';
import { PrismaService } from '../../../src/shared/infrastructure/prisma/prisma.service';

let app: INestApplication;

// El container y la migración corren una sola vez por ejecución en
// global-setup.ts / global-teardown.ts. DATABASE_URL ya apunta a esa DB
// migrada cuando este módulo se importa dentro de un test.
export async function startTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  // cualquier otro pipe/filter/interceptor global de main.ts va acá también
  await app.init();
  return app;
}

export async function stopTestApp(): Promise<void> {
  await app.close();
}

export function getPrisma(): PrismaService {
  return app.get(PrismaService);
}