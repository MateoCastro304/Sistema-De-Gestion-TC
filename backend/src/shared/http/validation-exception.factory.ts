import { BadRequestException, ValidationError } from '@nestjs/common';

/**
 * Convierte los errores de class-validator en el 400 del contrato (§5.2):
 * `code: VALIDATION_ERROR` y un elemento de `details` por campo, con el campo
 * tomado de la propiedad y el mensaje del primer decorador que falló.
 */
export class ValidationExceptionFactory {
  static create(errors: ValidationError[]): BadRequestException {
    const details = errors.map((error) => ({
      field: error.property,
      message: Object.values(error.constraints ?? {})[0] ?? 'Valor inválido',
    }));
    return new BadRequestException({
      statusCode: 400,
      error: 'Bad Request',
      code: 'VALIDATION_ERROR',
      message: 'Los datos enviados no son válidos.',
      details,
    });
  }
}
