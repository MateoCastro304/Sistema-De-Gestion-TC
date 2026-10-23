import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { Prisma } from '../../../src/generated/prisma/client';
import { ExchangeQuote } from '../../../src/subsystems/technical-catalog/core/domain/entities/exchange-rate.entity';
import { ExchangeRateProvider } from '../../../src/subsystems/technical-catalog/core/domain/ports/exchange-rate-provider.port';
import { startTestApp, stopTestApp, getPrisma } from '../../shared/harness/test-app';
import { expectData } from '../../shared/contract/envelopes';

describe('Exchange rate', () => {
  let app: INestApplication;
  let quote: ExchangeQuote | null;

  // Fuente falsa: ninguna prueba sale a internet.
  const fakeProvider = { fetchCurrent: async () => quote };

  beforeAll(async () => {
    app = await startTestApp([{ provide: ExchangeRateProvider, useValue: fakeProvider }]);
  });

  afterAll(async () => {
    await stopTestApp();
  });

  beforeEach(async () => {
    quote = null;
    await getPrisma().exchangeRate.deleteMany();
  });

  describe('GET /exchange-rate', () => {
    it('devuelve la cotización de la fuente y la guarda', async () => {
      quote = { rate: 1385.5, quotedAt: new Date('2026-10-15T12:30:00.000Z'), source: 'fake' };

      const res = await request(app.getHttpServer()).get('/exchange-rate');

      expect(expectData(res, 200)).toEqual({ rate: 1385.5, updatedAt: '2026-10-15T12:30:00.000Z' });
      const saved = await getPrisma().exchangeRate.findUniqueOrThrow({ where: { id: 1 } });
      expect(saved.rate.toString()).toBe('1385.5');
    });

    it('devuelve la anterior con su fecha real si la fuente falla', async () => {
      await getPrisma().exchangeRate.create({
        data: {
          id: 1,
          rate: new Prisma.Decimal('1380.00'),
          quotedAt: new Date('2026-10-14T09:00:00.000Z'),
          source: 'fake',
          fetchedAt: new Date('2026-10-14T09:01:00.000Z'), // vencida: fuerza la consulta
        },
      });

      const res = await request(app.getHttpServer()).get('/exchange-rate');

      expect(expectData(res, 200)).toEqual({ rate: 1380, updatedAt: '2026-10-14T09:00:00.000Z' });
    });

    it('responde 502 si la fuente falla y nunca hubo cotización', async () => {
      const res = await request(app.getHttpServer()).get('/exchange-rate');

      expect(res.status).toBe(502);
      expect(res.body).toMatchObject({
        statusCode: 502,
        error: 'Bad Gateway',
        code: 'EXCHANGE_RATE_UNAVAILABLE',
        path: '/exchange-rate',
      });
      expect(res.body.details).toBeUndefined();
      expect(await getPrisma().exchangeRate.count()).toBe(0);
    });
  });
});
