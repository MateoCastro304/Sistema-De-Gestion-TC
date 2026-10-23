import { SystemClock } from '../../../../../shared/clock/system-clock';
import { InMemoryExchangeRateRepository } from '../../../infrastructure/persistence/in-memory/in-memory-exchange-rate.repository';
import { ExchangeQuote, ExchangeRate } from '../../domain/entities/exchange-rate.entity';
import { ExchangeRateUnavailable } from '../../domain/errors/exchange-rate-unavailable.error';
import { ExchangeRateProvider } from '../../domain/ports/exchange-rate-provider.port';
import { GetExchangeRate } from './get-exchange-rate.use-case';

const NOW = new Date('2026-10-15T13:00:00.000Z');

class FixedClock extends SystemClock {
  now(): Date {
    return NOW;
  }
}

class FakeProvider extends ExchangeRateProvider {
  calls = 0;
  constructor(private readonly quote: ExchangeQuote | null) {
    super();
  }
  async fetchCurrent(): Promise<ExchangeQuote | null> {
    this.calls++;
    return this.quote;
  }
}

const stored = (fetchedAt: string) =>
  ExchangeRate.reconstruct({
    rate: 1380,
    quotedAt: new Date('2026-10-15T09:00:00.000Z'),
    source: 'test',
    fetchedAt: new Date(fetchedAt),
  });

const fresh: ExchangeQuote = { rate: 1385.5, quotedAt: new Date('2026-10-15T12:30:00.000Z'), source: 'test' };

describe('GetExchangeRate', () => {
  it('devuelve la guardada sin consultar la fuente si es reciente', async () => {
    const provider = new FakeProvider(fresh);
    const useCase = new GetExchangeRate(
      new InMemoryExchangeRateRepository(stored('2026-10-15T12:50:00.000Z')),
      provider,
      new FixedClock(),
    );

    expect((await useCase.execute()).getRate()).toBe(1380);
    expect(provider.calls).toBe(0);
  });

  it('consulta la fuente y reemplaza la guardada si está vencida', async () => {
    const repository = new InMemoryExchangeRateRepository(stored('2026-10-15T12:00:00.000Z'));
    const useCase = new GetExchangeRate(repository, new FakeProvider(fresh), new FixedClock());

    const result = await useCase.execute();

    expect(result.getRate()).toBe(1385.5);
    expect((await repository.find())?.getFetchedAt()).toEqual(NOW);
  });

  it('devuelve la anterior con su fecha real si la fuente falla', async () => {
    const useCase = new GetExchangeRate(
      new InMemoryExchangeRateRepository(stored('2026-10-15T12:00:00.000Z')),
      new FakeProvider(null),
      new FixedClock(),
    );

    const result = await useCase.execute();

    expect(result.getRate()).toBe(1380);
    expect(result.getQuotedAt()).toEqual(new Date('2026-10-15T09:00:00.000Z'));
  });

  it('informa que no está disponible si la fuente falla y nunca hubo cotización', async () => {
    const useCase = new GetExchangeRate(new InMemoryExchangeRateRepository(), new FakeProvider(null), new FixedClock());

    await expect(useCase.execute()).rejects.toBeInstanceOf(ExchangeRateUnavailable);
  });
});
