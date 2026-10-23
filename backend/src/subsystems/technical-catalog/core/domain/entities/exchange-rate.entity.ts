/** Cotización tal como la informa la fuente externa. */
export type ExchangeQuote = { rate: number; quotedAt: Date; source: string };

/**
 * Último tipo de cambio (pesos por dólar) que obtuvo el backend (D-48).
 * `quotedAt` es el momento que informa la fuente; `fetchedAt`, cuándo lo
 * consultó el backend.
 */
export class ExchangeRate {
  private constructor(
    private readonly rate: number,
    private readonly quotedAt: Date,
    private readonly source: string,
    private readonly fetchedAt: Date,
  ) {}

  static fromQuote(quote: ExchangeQuote, fetchedAt: Date): ExchangeRate {
    return new ExchangeRate(quote.rate, quote.quotedAt, quote.source, fetchedAt);
  }

  static reconstruct(data: { rate: number; quotedAt: Date; source: string; fetchedAt: Date }): ExchangeRate {
    return new ExchangeRate(data.rate, data.quotedAt, data.source, data.fetchedAt);
  }

  /** Si se consultó la fuente hace menos de `maxAgeMs`, no hace falta volver a hacerlo. */
  isFresh(now: Date, maxAgeMs: number): boolean {
    return now.getTime() - this.fetchedAt.getTime() < maxAgeMs;
  }

  getRate(): number {
    return this.rate;
  }
  getQuotedAt(): Date {
    return this.quotedAt;
  }
  getSource(): string {
    return this.source;
  }
  getFetchedAt(): Date {
    return this.fetchedAt;
  }
}
