import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
//agarra cualquier error que pase adentro del controller de categories y lo convierte en una respuesta HTTP con el formato exacto que pide el contrato de la API (statusCode, error, message, path, timestamp, y a veces details).
const STATUS_NAMES: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  404: 'Not Found',
  409: 'Conflict',
  500: 'Internal Server Error',
};

@Catch()
export class CategoryExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) { //un objeto "genérico" de Nest que te da acceso al contexto de la petición actual
    const ctx = host.switchToHttp(); //quiero el contexto específico de HTTP
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Unexpected error.';
    let details: { field: string; message: string }[] | undefined;
    let categoryId: number | undefined;
    
    if (exception instanceof HttpException) { //es un operador de JavaScript que responde "¿este objeto fue creado a partir de esta clase (o una que hereda de ella)?". HttpException es la clase base de la que heredan NotFoundException, BadRequestException, y prácticamente todos los errores "oficiales" de Nest.
      statusCode = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object' && body !== null) {
        const bodyObj = body as Record<string, unknown>;
        message = (bodyObj.message as string) ?? exception.message;
        details = bodyObj.details as { field: string; message: string }[] | undefined;
        categoryId = bodyObj.categoryId as number | undefined;
      } 
    } else if (exception instanceof Error) {
      // Errores de validación del dominio (ej: Category.validate()) llegan como Error simple.
      statusCode = HttpStatus.BAD_REQUEST;
      message = exception.message;
      details = [{ field: 'name', message: exception.message }];
    } 
    response.status(statusCode).json({
      statusCode,
      error: STATUS_NAMES[statusCode] ?? 'Error',
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
      ...(details ? { details } : {}),
      ...(categoryId !== undefined ? { categoryId } : {}),
    });
  }
}