import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { AUTHOR_ID_KEY } from './provisional-author.guard';

/** Id del usuario que hace el pedido, (provisorio hasta tener sesión). */
export const AuthorId = createParamDecorator((_data: unknown, context: ExecutionContext): number => {
  return context.switchToHttp().getRequest<Request & { [AUTHOR_ID_KEY]: number }>()[AUTHOR_ID_KEY];
});
