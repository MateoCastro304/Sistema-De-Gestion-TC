import { DomainError } from '../../../../../shared/domain/errors/domain.error';

export class ExchangeRateUnavailable extends DomainError {
  readonly code = 'EXCHANGE_RATE_UNAVAILABLE';

  constructor() {
    super('No se pudo obtener la cotización del dólar. Ingresá el tipo de cambio a mano.');
  }
}
