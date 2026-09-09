import { INestApplication } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

export function setupSwagger(app: INestApplication) {
  const specPath = path.resolve(process.cwd(), '../build/openapi.yaml');

  if (!fs.existsSync(specPath)) {
    console.warn(`OpenAPI spec not found: ${specPath}`);
    return;
  }

  const spec = yaml.load(fs.readFileSync(specPath, 'utf8')) as Record<
    string,
    unknown
  >;

  SwaggerModule.setup('docs', app, spec as any);
}
