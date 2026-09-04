console.log('HITO 1: script empezó');

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

console.log('HITO 2: imports OK');

async function bootstrap() {
  console.log('HITO 3: bootstrap arrancó');
  const app = await NestFactory.create(AppModule);
  console.log('HITO 4: Nest creado');

  if (process.env.NODE_ENV === 'development') {
    const { setupSwagger } = await import('./swagger.js');
    setupSwagger(app);
  }

  console.log('HITO 5: por llamar listen');
  await app.listen(process.env.PORT ?? 3000);
  console.log('HITO 6: listen OK');
}

bootstrap().catch((err) => {
  console.error('BOOTSTRAP FAILED:', err);
  process.exit(1);
});
