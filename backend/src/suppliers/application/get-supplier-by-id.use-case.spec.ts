import { GetSupplierById } from './get-supplier-by-id.use-case';
import { InMemorySupplierRepository } from '../infrastructure/in-memory-supplier.repository';
import { SupplierNotFound } from '../domain/errors/supplier-not-found.error';
import { Supplier } from '../domain/supplier';

describe('GetSupplierById (use case)', () => {
  let repo: InMemorySupplierRepository;
  let useCase: GetSupplierById;

  beforeEach(() => {
    repo = new InMemorySupplierRepository();
    useCase = new GetSupplierById(repo);
  });

  const seed = async (legalName = 'Aceros del Sur'): Promise<Supplier> => {
    const draft = Supplier.create(legalName, ['MATERIAL']);
    return await repo.save(draft);
  };

  it('returns the supplier when the id matches', async () => {
    const stored = await seed('Aceros del Sur');

    const result = await useCase.execute(stored.getId()!);

    expect(result.getId()).toBe(stored.getId());
    expect(result.getLegalName()).toBe('Aceros del Sur');
  });

  it('returns inactive suppliers just like active ones', async () => {
    const stored = await seed('Aceros del Sur');
    stored.deactivate();
    await repo.save(stored);

    const result = await useCase.execute(stored.getId()!);

    expect(result.getId()).toBe(stored.getId());
    expect(result.getActive()).toBe(false);
  });

  it('throws SupplierNotFound when the id does not exist', async () => {
    const call = useCase.execute(999);

    await expect(call).rejects.toBeInstanceOf(SupplierNotFound);
    await expect(call).rejects.toMatchObject({ id: 999 });
  });

  it('throws SupplierNotFound even when other suppliers exist', async () => {
    await seed('Aceros del Sur');
    await seed('Insumos del Norte');

    const call = useCase.execute(999);

    await expect(call).rejects.toBeInstanceOf(SupplierNotFound);
    expect(repo.count()).toBe(2);
  });
});
