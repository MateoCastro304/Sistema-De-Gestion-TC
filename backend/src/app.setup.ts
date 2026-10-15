import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './shared/http/filters/all-exceptions.filter';

/**
 * HTTP configuration shared by main.ts and the integration tests, so the
 * tests exercise exactly the same pipes and filters as production.
 *
 * whitelist strips body/query keys that are not declared in the DTO;
 * forbidNonWhitelisted turns that into an explicit 400 so front-end typos
 * and stale clients surface early instead of silently dropping fields.
 * transform enables class-transformer so the payload reaches the controller
 * as a real DTO instance — required for @Type(() => Number) to coerce query
 * params from strings into numbers.
 *
 * AllExceptionsFilter catches whatever the module-level filters let through,
 * so every error leaves the API with the same shape.
 */
export function configureApp(app: INestApplication): void {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
}
