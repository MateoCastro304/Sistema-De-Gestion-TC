import { ExchangeRate } from '../../../core/domain/entities/exchange-rate.entity';
import { ExchangeRateRepository } from '../../../core/domain/ports/exchange-rate.repository';

/** Fake para los specs de los casos de uso; no se usa en runtime. */
export class InMemoryExchangeRateRepository extends ExchangeRateRepository {
  constructor(private current: ExchangeRate | null = null) {
    super();
  }

  async find(): Promise<ExchangeRate | null> {
    return this.current;
  }

  async save(exchangeRate: ExchangeRate): Promise<ExchangeRate> {
    this.current = exchangeRate;
    return exchangeRate;
  }
}
