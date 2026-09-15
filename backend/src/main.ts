import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // whitelist strips body/query keys that are not declared in the DTO;
  // forbidNonWhitelisted turns that into an explicit 400 so front-end typos
  // and stale clients surface early instead of silently dropping fields.
  // transform enables class-transformer so the payload reaches the controller
  // as a real DTO instance — required for @Type(() => Number) to coerce query
  // params from strings into numbers.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger UI is a development-only nicety, wired via the dedicated
  // swagger.ts module so main.ts stays focused on bootstrap.
  if (process.env.NODE_ENV === 'development') {
    const { setupSwagger } = await import('./swagger.js');
    setupSwagger(app);
  }

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch((err) => {
  console.error('BOOTSTRAP FAILED:', err);
  process.exit(1);
});
