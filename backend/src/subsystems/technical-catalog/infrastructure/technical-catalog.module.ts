import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClockPort } from '../../../shared/clock/clock.port';
import { SystemClock } from '../../../shared/clock/system-clock';
import { GetExchangeRate } from '../core/application/use-cases/get-exchange-rate.use-case';
import { RegisterProcessType } from '../core/application/use-cases/register-process-type.use-case';
import { ExchangeRateProvider } from '../core/domain/ports/exchange-rate-provider.port';
import { ExchangeRateRepository } from '../core/domain/ports/exchange-rate.repository';
import { ProcessTypeRepository } from '../core/domain/ports/process-type.repository';
import { DolarApiExchangeRateProvider } from './external/dolar-api-exchange-rate.provider';
import { ExchangeRateController } from './http/controllers/exchange-rate.controller';
import { ProcessTypesController } from './http/controllers/process-types.controller';
import { PrismaExchangeRateRepository } from './persistence/prisma/prisma-exchange-rate.repository';
import { PrismaProcessTypeRepository } from './persistence/prisma/prisma-process-type.repository';

@Module({
  controllers: [ProcessTypesController, ExchangeRateController],
  providers: [
    RegisterProcessType,
    GetExchangeRate,
    { provide: ProcessTypeRepository, useClass: PrismaProcessTypeRepository },
    { provide: ExchangeRateRepository, useClass: PrismaExchangeRateRepository },
    { provide: ExchangeRateProvider, useClass: DolarApiExchangeRateProvider },
    {
      provide: ClockPort,
      useFactory: (config: ConfigService) => new SystemClock(config.get<string>('APP_TIMEZONE') || undefined),
      inject: [ConfigService],
    },
  ],
})
export class TechnicalCatalogModule {}
