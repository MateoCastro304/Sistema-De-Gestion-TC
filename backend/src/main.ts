import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  configureApp(app);

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
