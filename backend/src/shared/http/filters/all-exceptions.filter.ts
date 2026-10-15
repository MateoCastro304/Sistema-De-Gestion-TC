import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorDetail {
  field: string;
  message: string;
}

const STATUS_NAMES: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  500: 'Internal Server Error',
  503: 'Service Unavailable',
};

/**
 * Red de seguridad global: todo lo que no atrapó el filtro de un módulo
 * (errores del ValidationPipe, ParseIntPipe, rutas inexistentes, 401/403,
 * bugs) sale con el mismo formato que exige components/schemas/Error.yaml.
 *
 * `message` queda siempre como string: el frontend lee `message` y `field`
 * del cuerpo (shared/api/http.ts).
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Unexpected error.';
    let details: ErrorDetail[] | undefined;
    let extra: Record<string, unknown> = {};

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const body = exception.getResponse();

      if (typeof body === 'string') {
        message = body;
      } else {
        const bodyObj = body as Record<string, unknown>;
        const { message: rawMessage, details: rawDetails, error: _error, statusCode: _status, ...rest } = bodyObj;
        extra = rest;

        if (Array.isArray(rawMessage)) {
          // ValidationPipe por defecto: ["limit must not be greater than 1000", ...]
          const messages = rawMessage.map(String);
          message = messages[0] ?? exception.message;
          details = messages.map((m) => ({ field: m.split(' ')[0], message: m }));
        } else if (typeof rawMessage === 'string') {
          message = rawMessage;
        } else {
          message = exception.message;
        }

        if (Array.isArray(rawDetails)) details = rawDetails as ErrorDetail[];
      }
    } else {
      // Bug o fallo de infraestructura: el detalle va al log, no al cliente.
      this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    }

    response.status(statusCode).json({
      statusCode,
      error: STATUS_NAMES[statusCode] ?? 'Error',
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
      ...(details ? { details } : {}),
      ...extra,
    });
  }
}
