import { Controller, Get, UseFilters } from '@nestjs/common';
import { GetExchangeRate } from '../../../core/application/use-cases/get-exchange-rate.use-case';
import { ExchangeRateResponse, ExchangeRateResponseBody } from '../exchange-rate.response';
import { TechnicalCatalogDomainErrorFilter } from '../filters/technical-catalog-domain-error.filter';

/** Cotización del dólar (contrato §3.5). Rol requerido: AT o EC, cuando exista el guard. */
@Controller('exchange-rate')
@UseFilters(TechnicalCatalogDomainErrorFilter)
export class ExchangeRateController {
  constructor(private readonly getExchangeRate: GetExchangeRate) {}

  @Get()
  async get(): Promise<ExchangeRateResponseBody> {
    return ExchangeRateResponse.from(await this.getExchangeRate.execute());
  }
}
