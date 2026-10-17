import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { UserDomainError } from '../../../core/domain/errors/user-domain.error';
import { UserValidationError } from '../../../core/domain/errors/user-validation.error';
import { UserNotFound } from '../../../core/domain/errors/user-not-found.error';
import { UsernameAlreadyExists } from '../../../core/domain/errors/username-already-exists.error';
import { EmployeeAlreadyHasUser } from '../../../core/domain/errors/employee-already-has-user.error';
import { EmployeeInactive } from '../../../core/domain/errors/employee-inactive.error';
import { EmployeeNotFoundForUser } from '../../../core/domain/errors/employee-not-found-for-user.error';

/**
 * Turns every UserDomainError raised inside Users into an HTTP response,
 * siguiendo los códigos exactos de docs/openapi/paths/users*.yaml:
 * UserNotFound -> 404 USER_NOT_FOUND, UsernameAlreadyExists / EmployeeAlreadyHasUser
 * -> 409, EmployeeInactive -> 422 EMPLOYEE_INACTIVE, EmployeeNotFoundForUser /
 * UserValidationError -> 400 VALIDATION_ERROR. Un subtipo sin mapear cae a 500
 * y se loguea, para detectar el mapeo faltante en code review.
 *
 * Todo body lleva también `path`/`timestamp`, como exige el schema Error.
 */
@Catch(UserDomainError)
export class DomainErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainErrorFilter.name);

  catch(exception: UserDomainError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const { status, body } = this.mapToHttp(exception);

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(`Unmapped UserDomainError: ${exception.name} - ${exception.message}`, exception.stack);
    }

    response.status(status).json({
      ...body,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private mapToHttp(exception: UserDomainError): { status: HttpStatus; body: object } {
    if (exception instanceof UserNotFound) {
      return {
        status: HttpStatus.NOT_FOUND,
        body: {
          statusCode: HttpStatus.NOT_FOUND,
          error: 'Not Found',
          code: 'USER_NOT_FOUND',
          message: exception.message,
        },
      };
    }

    if (exception instanceof UsernameAlreadyExists) {
      return {
        status: HttpStatus.CONFLICT,
        body: {
          statusCode: HttpStatus.CONFLICT,
          error: 'Conflict',
          code: 'USERNAME_TAKEN',
          message: exception.message,
          details: [{ field: 'username', message: exception.message }],
        },
      };
    }

    if (exception instanceof EmployeeAlreadyHasUser) {
      return {
        status: HttpStatus.CONFLICT,
        body: {
          statusCode: HttpStatus.CONFLICT,
          error: 'Conflict',
          code: 'EMPLOYEE_ALREADY_HAS_USER',
          message: exception.message,
          details: [{ field: 'employeeId', message: exception.message }],
        },
      };
    }

    if (exception instanceof EmployeeInactive) {
      return {
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        body: {
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          error: 'Unprocessable Content',
          code: 'EMPLOYEE_INACTIVE',
          message: exception.message,
        },
      };
    }

    if (exception instanceof EmployeeNotFoundForUser) {
      return {
        status: HttpStatus.BAD_REQUEST,
        body: {
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'Bad Request',
          code: 'VALIDATION_ERROR',
          message: 'Los datos enviados no son válidos.',
          details: [{ field: 'employeeId', message: exception.message }],
        },
      };
    }

    if (exception instanceof UserValidationError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        body: {
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'Bad Request',
          code: 'VALIDATION_ERROR',
          message: 'Los datos enviados no son válidos.',
          details: [{ field: exception.field, message: exception.message }],
        },
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        error: 'Internal Server Error',
        message: 'Unexpected domain error',
      },
    };
  }
}
