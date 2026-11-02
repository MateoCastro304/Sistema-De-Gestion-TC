import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Pipes y filtros globales: ver app.setup.ts (lo comparten los tests).
  configureApp(app);

  const config = app.get(ConfigService);

  // Detras de nginx, req.ip seria la IP del proxy. El bloqueo de ingreso cuenta
  // por usuario+IP, asi que necesita la del cliente (un salto: nginx).
  if (config.get<string>('TRUST_PROXY') === 'true') {
    app.set('trust proxy', 1);
  }

  const allowedOrigins = config.get<string>('ALLOWED_ORIGINS');

  if (allowedOrigins) {
    // credentials: la cookie refresh_token de /auth tiene que viajar desde
    // Swagger UI (otro origen) para poder probar la sesión.
    app.enableCors({
      origin: allowedOrigins.split(',').map((origin) => origin.trim()),
      credentials: true,
    });
  }

  app.enableShutdownHooks();

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch((err) => {
  console.error('BOOTSTRAP FAILED:', err);
  process.exit(1);
});
