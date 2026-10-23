import { InMemoryProcessTypeRepository } from '../../../infrastructure/persistence/in-memory/in-memory-process-type.repository';
import { ProcessTypePriceChange } from '../../domain/entities/process-type-price-change.entity';
import { ProcessType } from '../../domain/entities/process-type.entity';
import { ProcessTypeNotFound } from '../../domain/errors/process-type-not-found.error';
import { GetProcessTypeById } from './get-process-type-by-id.use-case';
import { GetProcessTypeHistory } from './get-process-type-history.use-case';
import { ListProcessTypes } from './list-process-types.use-case';

async function seed(repository: InMemoryProcessTypeRepository, names: string[]): Promise<void> {
  for (const name of names) {
    await repository.save(ProcessType.create({ name, hourlyRateArs: 1000, hourlyRateUsd: 1, exchangeRate: 1000 }));
  }
}

describe('consultas de tipos de proceso', () => {
  let repository: InMemoryProcessTypeRepository;

  beforeEach(() => {
    repository = new InMemoryProcessTypeRepository();
  });

  describe('ListProcessTypes', () => {
    it('devuelve la página pedida con el total del conjunto', async () => {
      await seed(repository, ['Soldadura', 'Armado', 'Mecanizado Torno CNC']);

      const result = await new ListProcessTypes(repository).execute({ page: 2, limit: 2 });

      expect(result.items.map((p) => p.getName())).toEqual(['Soldadura']);
      expect(result.total).toBe(3);
    });
  });

  describe('GetProcessTypeById', () => {
    it('lanza ProcessTypeNotFound si no existe', async () => {
      await expect(new GetProcessTypeById(repository).execute(99)).rejects.toBeInstanceOf(ProcessTypeNotFound);
    });
  });

  describe('GetProcessTypeHistory', () => {
    it('lanza ProcessTypeNotFound si el tipo no existe, aunque haya historial huérfano', async () => {
      repository.history.set(99, [
        ProcessTypePriceChange.reconstruct({
          id: 1,
          changedAt: new Date(),
          changedBy: { id: 1, username: 'x' },
          exchangeRate: 1,
          previousValueUsd: 1,
          newValueUsd: 2,
        }),
      ]);

      await expect(new GetProcessTypeHistory(repository).execute(99)).rejects.toBeInstanceOf(ProcessTypeNotFound);
    });

    it('devuelve vacío para un tipo que nunca cambió de precio', async () => {
      await seed(repository, ['Armado']);

      expect(await new GetProcessTypeHistory(repository).execute(1)).toEqual([]);
    });
  });
});
