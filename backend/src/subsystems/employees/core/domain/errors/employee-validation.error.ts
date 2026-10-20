import { DomainError } from '../../../../../shared/domain/errors/domain.error';

export type EmployeeFieldError = { field: string; message: string };


export class EmployeeValidationError extends DomainError {
  constructor(
    message: string,
    public readonly details: EmployeeFieldError[],
  ) {
    super(message);
  }
}
