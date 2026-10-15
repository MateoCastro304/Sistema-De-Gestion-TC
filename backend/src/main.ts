import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  configureApp(app);
  // whitelist strips body/query keys that are not declared in the DTO;
  // forbidNonWhitelisted turns that into an explicit 400 so front-end typos
  // and stale clients surface early instead of silently dropping fields.
  // transform enables class-transformer so the payload reaches the controller
  // as a real DTO instance — required for @Type(() => Number) to coerce query
  // params from strings into numbers.

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
