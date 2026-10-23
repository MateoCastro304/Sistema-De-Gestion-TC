import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { ChangeAuthorUnknown } from '../../../core/domain/errors/change-author-unknown.error';
import { ExchangeRateUnavailable } from '../../../core/domain/errors/exchange-rate-unavailable.error';
import { ProcessTypeNotFound } from '../../../core/domain/errors/process-type-not-found.error';
import { ProcessTypeNameTaken } from '../../../core/domain/errors/process-type-name-taken.error';
import { ProcessTypeValidationError } from '../../../core/domain/errors/process-type-validation.error';

type HandledError =
  | ProcessTypeValidationError
  | ProcessTypeNameTaken
  | ProcessTypeNotFound
  | ChangeAuthorUnknown
  | ExchangeRateUnavailable;

/**
 * Traduce los errores de dominio de tipos de proceso y tipo de cambio al
 * cuerpo de error del contrato (§5.2): `code`, `message`, `details` donde
 * corresponde, `path` y `timestamp`. Solo atrapa estas clases.
 */
@Catch(
  ProcessTypeValidationError,
  ProcessTypeNameTaken,
  ProcessTypeNotFound,
  ChangeAuthorUnknown,
  ExchangeRateUnavailable,
)
export class TechnicalCatalogDomainErrorFilter implements ExceptionFilter {
  private static readonly NAMES: Record<number, string> = {
    [HttpStatus.BAD_REQUEST]: 'Bad Request',
    [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
    [HttpStatus.NOT_FOUND]: 'Not Found',
    [HttpStatus.CONFLICT]: 'Conflict',
    [HttpStatus.BAD_GATEWAY]: 'Bad Gateway',
  };

  catch(exception: HandledError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const status = TechnicalCatalogDomainErrorFilter.statusOf(exception);

    ctx
      .getResponse<Response>()
      .status(status)
      .json({
        statusCode: status,
        error: TechnicalCatalogDomainErrorFilter.NAMES[status],
        code: exception.code,
        message: exception.message,
        path: request.url,
        timestamp: new Date().toISOString(),
        ...TechnicalCatalogDomainErrorFilter.detailsOf(exception),
      });
  }

  private static statusOf(exception: HandledError): number {
    if (exception instanceof ProcessTypeValidationError) return HttpStatus.BAD_REQUEST;
    if (exception instanceof ChangeAuthorUnknown) return HttpStatus.UNAUTHORIZED;
    if (exception instanceof ProcessTypeNotFound) return HttpStatus.NOT_FOUND;
    if (exception instanceof ProcessTypeNameTaken) return HttpStatus.CONFLICT;
    return HttpStatus.BAD_GATEWAY;
  }

  private static detailsOf(exception: HandledError): { details?: { field: string; message: string }[] } {
    if (exception instanceof ProcessTypeValidationError) {
      // Sin campo que señalar (cuerpo vacío), el contrato solo trae el mensaje.
      return exception.details.length > 0 ? { details: exception.details } : {};
    }
    if (exception instanceof ProcessTypeNameTaken) return { details: [{ field: 'name', message: exception.message }] };
    return {};
  }
}
