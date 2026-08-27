import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
bootstrap();