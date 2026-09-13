import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
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

  // The OpenAPI bundle is produced by `npm run bundle` in tooling/openapi and
  // dropped at build/openapi.yaml. Serving Swagger UI is a nicety — if the
  // bundle is missing we still boot the app and warn on stderr.
  const specPath = path.resolve(process.cwd(), '../build/openapi.yaml');
  if (fs.existsSync(specPath)) {
    const spec = yaml.load(fs.readFileSync(specPath, 'utf8')) as Record<string, unknown>;
    SwaggerModule.setup('docs', app, spec as any);
    console.log(`Swagger UI available at http://localhost:${process.env.PORT ?? 3000}/docs`);
  } else {
    console.warn(`OpenAPI bundle not found at ${specPath}. Run 'npm run bundle' in tooling/openapi.`);
  }

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch((err) => {
  console.error('BOOTSTRAP FAILED:', err);
  process.exit(1);
});
