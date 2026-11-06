import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../../src/app.module';
import { configureApp } from '../../../src/app.setup';
import { PrismaService } from '../../../src/shared/infrastructure/prisma/prisma.service';
import { clearIdentityTables } from '../factories/identity-cleanup';

let app: INestApplication;

/** Reemplazo de un proveedor del módulo, p. ej. un servicio externo por un fake. */
export type ProviderOverride = { provide: unknown; useValue: unknown };

export async function startTestApp(overrides: ProviderOverride[] = []): Promise<INestApplication> {
  let builder = Test.createTestingModule({ imports: [AppModule] });
  for (const { provide, useValue } of overrides) {
    builder = builder.overrideProvider(provide as never).useValue(useValue);
  }
  const moduleRef = await builder.compile();

  app = moduleRef.createNestApplication();
  configureApp(app);

  await app.init();
  await getPrisma().$connect();

  return app;
}

export async function stopTestApp(): Promise<void> {
  // Todas las suites comparten una base: las sesiones y usuarios que dejó una
  // (`signInAs`) harían fallar la limpieza de otra que borra usuarios.
  await clearIdentityTables(getPrisma());
  await getPrisma().$disconnect();
  await app.close();
}

export function getPrisma(): PrismaService {
  return app.get(PrismaService);
}
