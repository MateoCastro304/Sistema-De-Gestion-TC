import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { DomainValidationError } from '../../../shared/domain/errors/domain-validation.error';

const STATUS_NAMES: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  404: 'Not Found',
  409: 'Conflict',
  500: 'Internal Server Error',
};

@Catch()
export class CustomerExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(CustomerExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Unexpected error.';
    let details: { field: string; message: string }[] | undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object' && body !== null) {
        const bodyObj = body as Record<string, unknown>;
        message = (bodyObj.message as string) ?? exception.message;
        details = bodyObj.details as { field: string; message: string }[] | undefined;
      }
    } else if (exception instanceof DomainValidationError) {
      statusCode = HttpStatus.BAD_REQUEST;
      message = exception.message;
      const lower = message.toLowerCase();
      const field = lower.includes('lastname')
        ? 'lastName'
        : lower.includes('mail')
          ? 'mail'
          : lower.includes('phone')
            ? 'phone'
            : lower.includes('factory')
              ? 'factoryId'
              : 'name';
      details = [{ field, message: exception.message }];
    } else {
      // Bug o fallo de infraestructura: no se expone el mensaje interno.
      this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    }

    response.status(statusCode).json({
      statusCode,
      error: STATUS_NAMES[statusCode] ?? 'Error',
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
      ...(details ? { details } : {}),
    });
  }
}
