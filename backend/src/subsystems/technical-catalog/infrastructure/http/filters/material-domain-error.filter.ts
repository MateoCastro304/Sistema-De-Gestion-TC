import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { MaterialAlreadyExists } from '../../../core/domain/errors/material-already-exists.error';
import { MaterialValidationError } from '../../../core/domain/errors/material-validation.error';

type HandledError = MaterialValidationError | MaterialAlreadyExists;

/**
 * Traduce los errores de dominio de materiales al cuerpo de error del contrato
 * (§5.2): `code`, `message`, `details` donde corresponde, `path` y `timestamp`.
 * Solo atrapa estas clases.
 */
@Catch(MaterialValidationError, MaterialAlreadyExists)
export class MaterialDomainErrorFilter implements ExceptionFilter {
  private static readonly NAMES: Record<number, string> = {
    [HttpStatus.BAD_REQUEST]: 'Bad Request',
    [HttpStatus.CONFLICT]: 'Conflict',
  };

  catch(exception: HandledError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const status = exception instanceof MaterialValidationError ? HttpStatus.BAD_REQUEST : HttpStatus.CONFLICT;

    ctx
      .getResponse<Response>()
      .status(status)
      .json({
        statusCode: status,
        error: MaterialDomainErrorFilter.NAMES[status],
        code: exception.code,
        message: exception.message,
        path: request.url,
        timestamp: new Date().toISOString(),
        details: MaterialDomainErrorFilter.detailsOf(exception),
      });
  }

  private static detailsOf(exception: HandledError): { field: string; message: string }[] {
    if (exception instanceof MaterialValidationError) return exception.details;
    // El error va sobre la calidad: el nombre puede repetirse, lo que no se repite es la calidad dentro de ese nombre.
    return [{ field: 'quality', message: exception.message }];
  }
}
