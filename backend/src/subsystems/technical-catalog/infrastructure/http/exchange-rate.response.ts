import { ExchangeRate } from '../../core/domain/entities/exchange-rate.entity';

export type ExchangeRateResponseBody = { rate: number; updatedAt: string };

/** Arma la respuesta de GET /exchange-rate (§3.5): `updatedAt` es el momento de la cotización. */
export class ExchangeRateResponse {
  static from(exchangeRate: ExchangeRate): ExchangeRateResponseBody {
    return { rate: exchangeRate.getRate(), updatedAt: exchangeRate.getQuotedAt().toISOString() };
  }
}
