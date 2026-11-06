import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AllExceptionsFilter } from './shared/http/filters/all-exceptions.filter';
import { ValidationExceptionFactory } from './shared/http/validation-exception.factory';

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
 * exceptionFactory arma el 400 del contrato (code VALIDATION_ERROR y un
 * detail por campo).
 *
 * AllExceptionsFilter catches whatever the module-level filters let through,
 * so every error leaves the API with the same shape.
 *
 * helmet adds the standard security headers to every response. cookieParser
 * exposes req.cookies: the refresh token travels only in an HttpOnly cookie
 * (D-45), so /auth/refresh and /auth/logout read it from there.
 */
export function configureApp(app: INestApplication): void {
  app.use(helmet());
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => ValidationExceptionFactory.create(errors),
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
}
