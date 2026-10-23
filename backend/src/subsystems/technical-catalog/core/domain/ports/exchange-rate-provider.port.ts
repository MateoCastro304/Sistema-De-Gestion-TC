import { ExchangeQuote } from '../entities/exchange-rate.entity';

/** Fuente externa de la cotización del dólar (D-48). */
export abstract class ExchangeRateProvider {
  /** La cotización actual, o `null` si la fuente no respondió o respondió algo inválido. */
  abstract fetchCurrent(): Promise<ExchangeQuote | null>;
}
