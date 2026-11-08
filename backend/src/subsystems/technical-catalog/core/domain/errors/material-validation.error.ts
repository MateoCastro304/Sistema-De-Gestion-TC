import { DomainValidationError } from '../../../../../shared/domain/errors/domain-validation.error';

export type MaterialFieldError = { field: string; message: string };

/** Datos del material inválidos: un elemento por campo (contrato, `VALIDATION_ERROR`). */
export class MaterialValidationError extends DomainValidationError {
  readonly code = 'VALIDATION_ERROR';

  constructor(
    readonly details: MaterialFieldError[],
    message = 'Los datos enviados no son válidos.',
  ) {
    super(message);
  }
}
