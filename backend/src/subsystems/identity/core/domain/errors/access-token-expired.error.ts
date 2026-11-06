import { DomainError } from '../../../../../shared/domain/errors/domain.error';

/** El access token cumplió sus 15 minutos: el cliente renueva con `POST /auth/refresh`. */
export class AccessTokenExpired extends DomainError {
  readonly code = 'ACCESS_TOKEN_EXPIRED';

  constructor() {
    super('El token de acceso venció.');
  }
}
