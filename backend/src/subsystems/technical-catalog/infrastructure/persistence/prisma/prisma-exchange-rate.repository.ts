import { Injectable } from '@nestjs/common';
import { ExchangeRate as ExchangeRateRow, Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../../shared/infrastructure/prisma/prisma.service';
import { ExchangeRate } from '../../../core/domain/entities/exchange-rate.entity';
import { ExchangeRateRepository } from '../../../core/domain/ports/exchange-rate.repository';

/** La tabla tiene una sola fila (CHECK id = 1), que se reemplaza con upsert. */
const SINGLE_ROW_ID = 1;

@Injectable()
export class PrismaExchangeRateRepository extends ExchangeRateRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async find(): Promise<ExchangeRate | null> {
    const row = await this.prisma.exchangeRate.findUnique({ where: { id: SINGLE_ROW_ID } });
    return row ? PrismaExchangeRateRepository.toDomain(row) : null;
  }

  async save(exchangeRate: ExchangeRate): Promise<ExchangeRate> {
    const data = {
      rate: new Prisma.Decimal(exchangeRate.getRate().toFixed(2)),
      quotedAt: exchangeRate.getQuotedAt(),
      source: exchangeRate.getSource(),
      fetchedAt: exchangeRate.getFetchedAt(),
    };
    const row = await this.prisma.exchangeRate.upsert({
      where: { id: SINGLE_ROW_ID },
      create: { id: SINGLE_ROW_ID, ...data },
      update: data,
    });
    return PrismaExchangeRateRepository.toDomain(row);
  }

  private static toDomain(row: ExchangeRateRow): ExchangeRate {
    return ExchangeRate.reconstruct({
      rate: row.rate.toNumber(),
      quotedAt: row.quotedAt,
      source: row.source,
      fetchedAt: row.fetchedAt,
    });
  }
}
