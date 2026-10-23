import { Injectable } from '@nestjs/common';
import { ClockPort } from '../../../../../shared/clock/clock.port';
import { ExchangeRate } from '../../domain/entities/exchange-rate.entity';
import { ExchangeRateUnavailable } from '../../domain/errors/exchange-rate-unavailable.error';
import { ExchangeRateProvider } from '../../domain/ports/exchange-rate-provider.port';
import { ExchangeRateRepository } from '../../domain/ports/exchange-rate.repository';

/** Mientras la cotización guardada sea más nueva que esto, no se vuelve a consultar la fuente. */
export const EXCHANGE_RATE_MAX_AGE_MS = 15 * 60 * 1000;

/**
 * Devuelve la cotización actual del dólar (D-48). Usa la guardada si es
 * reciente; si no, consulta la fuente y la reemplaza. Si la fuente falla y
 * hay una anterior, devuelve esa con su fecha real; si nunca hubo ninguna,
 * {@link ExchangeRateUnavailable}.
 */
@Injectable()
export class GetExchangeRate {
  constructor(
    private readonly repository: ExchangeRateRepository,
    private readonly provider: ExchangeRateProvider,
    private readonly clock: ClockPort,
  ) {}

  async execute(): Promise<ExchangeRate> {
    const now = this.clock.now();
    const stored = await this.repository.find();
    if (stored?.isFresh(now, EXCHANGE_RATE_MAX_AGE_MS)) return stored;

    const quote = await this.provider.fetchCurrent();
    if (quote) return await this.repository.save(ExchangeRate.fromQuote(quote, now));

    if (stored) return stored;
    throw new ExchangeRateUnavailable();
  }
}
