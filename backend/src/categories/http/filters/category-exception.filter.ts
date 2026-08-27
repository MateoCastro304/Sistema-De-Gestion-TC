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

    if (exception instanceof HttpException) { //es un operador de JavaScript que responde "¿este objeto fue creado a partir de esta clase (o una que hereda de ella)?". HttpException es la clase base de la que heredan NotFoundException, BadRequestException, y prácticamente todos los errores "oficiales" de Nest.
      statusCode = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object' && body !== null) {
        const bodyObj = body as Record<string, unknown>;
        message = (bodyObj.message as string) ?? exception.message;
        details = bodyObj.details as { field: string; message: string }[] | undefined;
      } 
    } else if (exception instanceof Error) {
      // Errores de validación del dominio (ej: Category.validate()) llegan como Error simple.
      statusCode = HttpStatus.BAD_REQUEST;
      message = exception.message;
      details = [{ field: 'name', message: exception.message }];
    } //Puede ser un objeto, como el que arma categoryValidationExceptionFactory más abajo en el controller: { message: 'Invalid request data.', details: [...] }. En ese caso, se saca message y details de ese objeto.
//(bodyObj.message as string) ?? exception.message — el operador ?? ("nullish coalescing") dice: "usá lo de la izquierda, pero si es null o undefined, usá lo de la derecha en su lugar". Es una red de seguridad por si bodyObj.message no viniera

    response.status(statusCode).json({
      statusCode,
      error: STATUS_NAMES[statusCode] ?? 'Error',
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
      ...(details ? { details } : {}), //Si details tiene algo (details ? ...), se "expande" { details } adentro del objeto — o sea, agrega la propiedad details al JSON final.
//Si details es undefined, se expande {} (un objeto vacío) — o sea, no agrega nada.
//Esto es lo que logra que un 404 no tenga details en el JSON (porque nunca se le asignó), pero un 400 de validación sí lo tenga — tal como pide el contrato ("details solo aparece en errores 400").

    });
  }
}