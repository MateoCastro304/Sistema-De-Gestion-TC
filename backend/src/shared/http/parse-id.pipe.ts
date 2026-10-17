import { BadRequestException, ParseIntPipe } from '@nestjs/common';

/**
 * ParseIntPipe de Nest, reusado tal cual: solo le agrega un
 * exceptionFactory que arma el 400 INVALID_PATH_PARAMETER que piden varios
 * contratos (categories, employees, factories, process-types, users) para
 * un :id de la ruta que no es un entero. `field` y `message` los define
 * quien lo usa, porque el texto es específico del recurso ("el
 * identificador del usuario", "del empleado", etc.).
 *
 * Por ahora lo usa únicamente `users` (ver controller). Que otros
 * subsystems lo adopten es decisión de quien los toque, no algo que este
 * cambio imponga.
 */
export function parseIdPipe(field: string, message: string): ParseIntPipe {
  return new ParseIntPipe({
    exceptionFactory: () =>
      new BadRequestException({
        code: 'INVALID_PATH_PARAMETER',
        message,
        details: [{ field, message }],
      }),
  });
}
