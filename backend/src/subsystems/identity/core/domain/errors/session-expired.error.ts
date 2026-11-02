import { DomainError } from '../../../../../shared/domain/errors/domain.error';

/**
 * La sesión se cerró por inactividad o por llegar a su duración máxima. El
 * mensaje cambia según el motivo, porque el cliente lo muestra en la pantalla de
 * ingreso.
 */
export class SessionExpired extends DomainError {
  readonly code = 'SESSION_EXPIRED';

  constructor(readonly reason: 'INACTIVITY' | 'EXPIRED') {
    super(reason === 'INACTIVITY' ? 'Tu sesión expiró por inactividad' : 'Tu sesión expiró. Volvé a ingresar.');
  }
}
