import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  configureApp(app);

  const config = app.get(ConfigService);
  const allowedOrigins = config.get<string>('ALLOWED_ORIGINS');

  if (allowedOrigins) {
    app.enableCors({
      origin: allowedOrigins.split(',').map((origin) => origin.trim()),
    });
  }

  app.enableShutdownHooks();

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch((err) => {
  console.error('BOOTSTRAP FAILED:', err);
  process.exit(1);
});
