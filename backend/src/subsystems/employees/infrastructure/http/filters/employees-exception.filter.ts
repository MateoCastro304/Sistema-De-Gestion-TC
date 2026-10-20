import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { DomainError } from '../../../../../shared/domain/errors/domain.error';
import { EmployeeDniTaken } from '../../../core/domain/errors/employee-dni-taken.error';
import { EmployeeNotFound } from '../../../core/domain/errors/employee-not-found.error';
import { EmployeeValidationError } from '../../../core/domain/errors/employee-validation.error';
import { InvalidEmployeeId } from '../../../core/domain/errors/invalid-employee-id.error';

type FieldError = { field: string; message: string };


@Catch(DomainError)
export class EmployeesExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(EmployeesExceptionFilter.name);

  catch(exception: DomainError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, error, code, message, details } = this.mapToHttp(exception);

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(`Unmapped DomainError: ${exception.name} - ${exception.message}`, exception.stack);
    }

    response.status(status).json({
      statusCode: status,
      error,
      code,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
      ...(details ? { details } : {}),
    });
  }

  private mapToHttp(exception: DomainError): {
    status: HttpStatus;
    error: string;
    code: string;
    message: string;
    details?: FieldError[];
  } {
    if (exception instanceof EmployeeValidationError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        code: 'VALIDATION_ERROR',
        message: exception.message,
        details: exception.details,
      };
    }

    if (exception instanceof InvalidEmployeeId) {
      return {
        status: HttpStatus.BAD_REQUEST,
        error: 'Bad Request',
        code: 'INVALID_PATH_PARAMETER',
        message: exception.message,
        details: [{ field: 'employeeId', message: 'Debe ser un número entero válido.' }],
      };
    }

    if (exception instanceof EmployeeNotFound) {
      return {
        status: HttpStatus.NOT_FOUND,
        error: 'Not Found',
        code: 'EMPLOYEE_NOT_FOUND',
        message: exception.message,
      };
    }

    if (exception instanceof EmployeeDniTaken) {
      return {
        status: HttpStatus.CONFLICT,
        error: 'Conflict',
        code: 'EMPLOYEE_DNI_TAKEN',
        message: exception.message,
        details: [{ field: 'dni', message: exception.message }],
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'Internal Server Error',
      code: 'INTERNAL_ERROR',
      message: 'Unexpected domain error',
    };
  }
}
