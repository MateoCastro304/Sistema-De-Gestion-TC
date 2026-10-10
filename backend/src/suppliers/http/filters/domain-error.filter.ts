import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { DomainError } from '../../../shared/domain/errors/domain.error';
import { DomainValidationError } from '../../../shared/domain/errors/domain-validation.error';
import { SupplierAlreadyExists } from '../../domain/errors/supplier-already-exists.error';
import { SupplierNotFound } from '../../domain/errors/supplier-not-found.error';

/**
 * Turns every DomainError raised inside the Suppliers module into an HTTP
 * response the client can act on. Known subclasses map to specific status
 * codes: SupplierNotFound → 404, SupplierAlreadyExists → 409, and any
 * DomainValidationError → 400. An unmapped DomainError subclass falls back
 * to 500 and gets logged so the missing mapping is caught in review.
 *
 * Only DomainError and its subclasses reach this filter (see @Catch);
 * infrastructure bugs surface through Nest's default handling as 500 without
 * touching this code path.
 */
@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainErrorFilter.name);

  catch(exception: DomainError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const { status, body } = this.mapToHttp(exception);

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(`Unmapped DomainError: ${exception.name} - ${exception.message}`, exception.stack);
    }
    response.status(status).json(body);
  }

  private mapToHttp(exception: DomainError): {
    status: HttpStatus;
    body: object;
  } {
    if (exception instanceof SupplierNotFound) {
      return {
        status: HttpStatus.NOT_FOUND,
        body: {
          statusCode: HttpStatus.NOT_FOUND,
          error: 'Not Found',
          message: exception.message,
          id: exception.id,
        },
      };
    }

    if (exception instanceof SupplierAlreadyExists) {
      return {
        status: HttpStatus.CONFLICT,
        body: {
          statusCode: HttpStatus.CONFLICT,
          error: 'Conflict',
          message: exception.message,
          field: exception.field,
          value: exception.value,
        },
      };
    }

    if (exception instanceof DomainValidationError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        body: {
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'Bad Request',
          message: exception.message,
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
