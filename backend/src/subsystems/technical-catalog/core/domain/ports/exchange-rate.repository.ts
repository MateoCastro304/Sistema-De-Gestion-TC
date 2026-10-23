import { ExchangeRate } from '../entities/exchange-rate.entity';

export abstract class ExchangeRateRepository {
  /** La única cotización guardada, o `null` si nunca se obtuvo una. */
  abstract find(): Promise<ExchangeRate | null>;

  /** Reemplaza la cotización guardada. */
  abstract save(exchangeRate: ExchangeRate): Promise<ExchangeRate>;
}
