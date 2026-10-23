import { DomainValidationError } from '../../../../../shared/domain/errors/domain-validation.error';

export type FieldError = { field: string; message: string };

/** Datos del tipo de proceso inválidos: un elemento por campo (contrato, `VALIDATION_ERROR`). */
export class ProcessTypeValidationError extends DomainValidationError {
  readonly code = 'VALIDATION_ERROR';

  constructor(readonly details: FieldError[]) {
    super('Los datos enviados no son válidos.');
  }
}
