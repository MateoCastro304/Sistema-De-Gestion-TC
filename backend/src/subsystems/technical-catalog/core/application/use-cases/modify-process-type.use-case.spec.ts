import { ClockPort } from '../../../../../shared/clock/clock.port';
import { InMemoryTransactionManager } from '../../../../../shared/infrastructure/in-memory/in-memory-transaction-manager';
import { InMemoryProcessTypeRepository } from '../../../infrastructure/persistence/in-memory/in-memory-process-type.repository';
import { ProcessType } from '../../domain/entities/process-type.entity';
import { ProcessTypeConcurrentModification } from '../../domain/errors/process-type-concurrent-modification.error';
import { ProcessTypeNameTaken } from '../../domain/errors/process-type-name-taken.error';
import { ProcessTypeNotFound } from '../../domain/errors/process-type-not-found.error';
import { ModifyProcessType } from './modify-process-type.use-case';

const NOW = new Date('2026-10-15T13:30:00.000Z');

class FixedClock extends ClockPort {
  now(): Date {
    return NOW;
  }
  today(): string {
    return '2026-10-15';
  }
  endOfDay(): Date {
    return NOW;
  }
}

async function seed(repository: InMemoryProcessTypeRepository, name: string): Promise<void> {
  await repository.save(ProcessType.create({ name, hourlyRateArs: 1557, hourlyRateUsd: 1.13, exchangeRate: 1377.88 }));
}

describe('ModifyProcessType', () => {
  let repository: InMemoryProcessTypeRepository;
  let transactions: InMemoryTransactionManager;
  let useCase: ModifyProcessType;

  beforeEach(async () => {
    repository = new InMemoryProcessTypeRepository();
    transactions = new InMemoryTransactionManager();
    useCase = new ModifyProcessType(repository, transactions, new FixedClock());
    await seed(repository, 'Mecanizado Torno Manual');
    await seed(repository, 'Soldadura');
  });

  it('lanza ProcessTypeNotFound si el tipo de proceso no existe', async () => {
    await expect(useCase.execute({ id: 99, changes: { name: 'X' }, authorId: 1 })).rejects.toBeInstanceOf(
      ProcessTypeNotFound,
    );
  });

  it('rechaza el nombre de otro tipo de proceso y no escribe nada', async () => {
    await expect(useCase.execute({ id: 1, changes: { name: 'soldadura' }, authorId: 1 })).rejects.toBeInstanceOf(
      ProcessTypeNameTaken,
    );
    expect(repository.updateAttempts).toBe(0);
  });

  it('no choca con su propio nombre al cambiar solo mayúsculas o acentos', async () => {
    const result = await useCase.execute({ id: 1, changes: { name: 'Mecanizado Tórno Manual' }, authorId: 1 });

    expect(result.getName()).toBe('Mecanizado Tórno Manual');
    expect(repository.priceChanges).toHaveLength(0);
  });

  it('no escribe ni abre transacción si nada cambia', async () => {
    const result = await useCase.execute({ id: 1, changes: { name: 'Mecanizado Torno Manual' }, authorId: 1 });

    expect(result.getId()).toBe(1);
    expect(repository.updateAttempts).toBe(0);
    expect(transactions.runs).toBe(0);
  });

  it('guarda el cambio de precio y su registro de historial en una sola transacción', async () => {
    const result = await useCase.execute({
      id: 1,
      changes: { hourlyRateUsd: 1.12, exchangeRate: 1390 },
      authorId: 7,
    });

    expect(result.getHourlyRateUsd().getValue()).toBe(1.12);
    expect(transactions.runs).toBe(1);
    expect(repository.priceChanges).toHaveLength(1);
    expect(repository.priceChanges[0]).toMatchObject({ processTypeId: 1, authorId: 7, changedAt: NOW });
  });

  it('no agrega historial cuando solo cambia el nombre', async () => {
    await useCase.execute({ id: 1, changes: { name: 'Torno Manual' }, authorId: 7 });

    expect(repository.priceChanges).toHaveLength(0);
  });

  it('relee y reintenta si otro cambio se adelantó, sin duplicar el historial', async () => {
    repository.lostRaces = 1;

    await useCase.execute({ id: 1, changes: { hourlyRateUsd: 1.12, exchangeRate: 1390 }, authorId: 7 });

    expect(repository.updateAttempts).toBe(2);
    expect(repository.priceChanges).toHaveLength(1);
  });

  it('se rinde con ProcessTypeConcurrentModification si pierde todos los intentos', async () => {
    repository.lostRaces = 10;

    await expect(
      useCase.execute({ id: 1, changes: { hourlyRateUsd: 1.12, exchangeRate: 1390 }, authorId: 7 }),
    ).rejects.toBeInstanceOf(ProcessTypeConcurrentModification);
    expect(repository.priceChanges).toHaveLength(0);
  });
});
