import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { CategoryDomainError } from '../../../core/domain/errors/category-domain.error';
import { CategoryValidationError } from '../../../core/domain/errors/category-validation.error';
import { CategoryNotFound } from '../../../core/domain/errors/category-not-found.error';
import { CategoryNameAlreadyExists } from '../../../core/domain/errors/category-already-exists.error';
import { CategoryInactive } from '../../../core/domain/errors/category-inactive.error';

/**
 * Turns every CategoryDomainError raised inside the Categories module into an
 * HTTP response the client can act on. Known subclasses map to specific
 * status codes: CategoryNotFound -> 404, CategoryNameAlreadyExists /
 * CategoryInactive -> 409, CategoryValidationError -> 400. An unmapped
 * subclass falls back to 500 and gets logged so the missing mapping is
 * caught in review.
 *
 * Only CategoryDomainError and its subclasses reach this filter (see
 * @Catch). CategoryHasActiveFactories deliberately stays outside this
 * hierarchy (see its own file) and is thrown wrapped in a ConflictException,
 * so it is handled by Nest's default HttpException handling instead.
 */
@Catch(CategoryDomainError)
export class DomainErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainErrorFilter.name);

  catch(exception: CategoryDomainError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const { status, body } = this.mapToHttp(exception);

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(`Unmapped CategoryDomainError: ${exception.name} - ${exception.message}`, exception.stack);
    }

    response.status(status).json({
      ...body,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private mapToHttp(exception: CategoryDomainError): {
    status: HttpStatus;
    body: object;
  } {
    if (exception instanceof CategoryNotFound) {
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

    if (exception instanceof CategoryNameAlreadyExists) {
      return {
        status: HttpStatus.CONFLICT,
        body: {
          statusCode: HttpStatus.CONFLICT,
          error: 'Conflict',
          message: exception.message,
        },
      };
    }

    if (exception instanceof CategoryInactive) {
      return {
        status: HttpStatus.CONFLICT,
        body: {
          statusCode: HttpStatus.CONFLICT,
          error: 'Conflict',
          message: exception.message,
        },
      };
    }

    if (exception instanceof CategoryValidationError) {
      return {
        status: HttpStatus.BAD_REQUEST,
        body: {
          statusCode: HttpStatus.BAD_REQUEST,
          error: 'Bad Request',
          message: exception.message,
          details: [{ field: 'name', message: exception.message }],
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
