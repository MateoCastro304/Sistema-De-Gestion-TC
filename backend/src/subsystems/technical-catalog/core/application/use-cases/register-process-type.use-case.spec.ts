import { InMemoryProcessTypeRepository } from '../../../infrastructure/persistence/in-memory/in-memory-process-type.repository';
import { ProcessTypeNameTaken } from '../../domain/errors/process-type-name-taken.error';
import { ProcessTypeValidationError } from '../../domain/errors/process-type-validation.error';
import { RegisterProcessType } from './register-process-type.use-case';

const input = {
  name: 'Mecanizado Torno Manual',
  description: null,
  hourlyRateArs: 1557,
  hourlyRateUsd: 1.13,
  exchangeRate: 1377.88,
};

describe('RegisterProcessType', () => {
  let repository: InMemoryProcessTypeRepository;
  let useCase: RegisterProcessType;

  beforeEach(() => {
    repository = new InMemoryProcessTypeRepository();
    useCase = new RegisterProcessType(repository);
  });

  it('guarda el tipo de proceso y lo devuelve con su id', async () => {
    const created = await useCase.execute(input);

    expect(created.getId()).toBe(1);
    expect(repository.saved).toHaveLength(1);
  });

  it.each(['mecanizado  torno manual', 'Mecanizado Tórno Manual'])(
    'rechaza el nombre duplicado "%s" y no guarda nada',
    async (name) => {
      await useCase.execute(input);

      await expect(useCase.execute({ ...input, name })).rejects.toBeInstanceOf(ProcessTypeNameTaken);
      expect(repository.saved).toHaveLength(1);
    },
  );

  it('valida los datos antes de consultar la unicidad', async () => {
    await expect(useCase.execute({ ...input, hourlyRateArs: 0 })).rejects.toBeInstanceOf(ProcessTypeValidationError);
    expect(repository.saved).toHaveLength(0);
  });
});
