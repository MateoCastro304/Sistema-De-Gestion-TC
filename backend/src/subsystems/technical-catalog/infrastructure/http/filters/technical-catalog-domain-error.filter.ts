import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { ExchangeRateUnavailable } from '../../../core/domain/errors/exchange-rate-unavailable.error';
import { ProcessTypeNameTaken } from '../../../core/domain/errors/process-type-name-taken.error';
import { ProcessTypeValidationError } from '../../../core/domain/errors/process-type-validation.error';

type HandledError = ProcessTypeValidationError | ProcessTypeNameTaken | ExchangeRateUnavailable;

/**
 * Traduce los errores de dominio de tipos de proceso y tipo de cambio al
 * cuerpo de error del contrato (§5.2): `code`, `message`, `details` donde
 * corresponde, `path` y `timestamp`. Solo atrapa estas tres clases.
 */
@Catch(ProcessTypeValidationError, ProcessTypeNameTaken, ExchangeRateUnavailable)
export class TechnicalCatalogDomainErrorFilter implements ExceptionFilter {
  private static readonly NAMES: Record<number, string> = {
    [HttpStatus.BAD_REQUEST]: 'Bad Request',
    [HttpStatus.CONFLICT]: 'Conflict',
    [HttpStatus.BAD_GATEWAY]: 'Bad Gateway',
  };

  catch(exception: HandledError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const status = TechnicalCatalogDomainErrorFilter.statusOf(exception);

    ctx.getResponse<Response>().status(status).json({
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
    if (exception instanceof ProcessTypeNameTaken) return HttpStatus.CONFLICT;
    return HttpStatus.BAD_GATEWAY;
  }

  private static detailsOf(exception: HandledError): { details?: { field: string; message: string }[] } {
    if (exception instanceof ProcessTypeValidationError) return { details: exception.details };
    if (exception instanceof ProcessTypeNameTaken) return { details: [{ field: 'name', message: exception.message }] };
    return {};
  }
}
