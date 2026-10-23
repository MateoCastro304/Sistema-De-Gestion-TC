import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExchangeQuote } from '../../core/domain/entities/exchange-rate.entity';
import { ExchangeRateProvider } from '../../core/domain/ports/exchange-rate-provider.port';

const DEFAULT_URL = 'https://dolarapi.com/v1/dolares/oficial';
const TIMEOUT_MS = 5000;

/**
 * Cotización del dólar oficial (precio de venta) desde dolarapi.com (D-48).
 * Nunca lanza: ante cualquier falla (red, timeout, respuesta inválida) loguea
 * y devuelve `null`, y el caso de uso decide qué hacer.
 */
@Injectable()
export class DolarApiExchangeRateProvider extends ExchangeRateProvider {
  private readonly logger = new Logger(DolarApiExchangeRateProvider.name);

  constructor(private readonly config: ConfigService) {
    super();
  }

  async fetchCurrent(): Promise<ExchangeQuote | null> {
    const url = this.config.get<string>('EXCHANGE_RATE_API_URL') ?? DEFAULT_URL;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const body = (await response.json()) as { venta?: unknown; fechaActualizacion?: unknown };
      const rate = typeof body.venta === 'number' ? Math.round(body.venta * 100) / 100 : NaN;
      const quotedAt = new Date(String(body.fechaActualizacion));
      if (!Number.isFinite(rate) || rate <= 0 || Number.isNaN(quotedAt.getTime())) {
        throw new Error('Respuesta con formato inesperado');
      }
      return { rate, quotedAt, source: 'dolarapi.com' };
    } catch (error) {
      this.logger.warn(`No se pudo obtener la cotización del dólar: ${error instanceof Error ? error.message : error}`);
      return null;
    }
  }
}
