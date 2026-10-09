import { DeactivateSupplier } from './deactivate-supplier.use-case';
import { CreateSupplier } from './create-supplier.use-case';
import { GetSupplierById } from './get-supplier-by-id.use-case';
import { ListSuppliers } from './list-suppliers.use-case';
import { InMemorySupplierRepository } from '../infrastructure/in-memory-supplier.repository';
import { SupplierNotFound } from '../domain/errors/supplier-not-found.error';
import { Supplier } from '../domain/supplier';

const VALID_CUIT = '30-71234567-1';

describe('DeactivateSupplier (use case)', () => {
  let repo: InMemorySupplierRepository;
  let useCase: DeactivateSupplier;

  beforeEach(() => {
    repo = new InMemorySupplierRepository();
    useCase = new DeactivateSupplier(repo);
  });

  const seed = async (legalName = 'Aceros del Sur', cuit?: string): Promise<Supplier> => {
    const draft = Supplier.create(legalName, 'MATERIAL', { cuit });
    return await repo.save(draft);
  };

  // ---------------------------------------------------------------------------
  // happy path
  // ---------------------------------------------------------------------------
  it('deactivates an active supplier', async () => {
    const stored = await seed();

    await useCase.execute(stored.getId()!);

    expect(stored.getActive()).toBe(false);
  });

  it('keeps the row instead of deleting it', async () => {
    const stored = await seed();

    await useCase.execute(stored.getId()!);

    // La baja es logica: la fila se conserva para que los materiales y las
    // ordenes que la referencian sigan siendo validos.
    expect(repo.count()).toBe(1);
  });

  it('returns nothing', async () => {
    const stored = await seed();

    const result = await useCase.execute(stored.getId()!);

    expect(result).toBeUndefined();
  });

  it('bumps updatedAt', async () => {
    const stored = await seed();
    const before = stored.getUpdatedAt();

    await new Promise((resolve) => setTimeout(resolve, 2));
    await useCase.execute(stored.getId()!);

    expect(stored.getUpdatedAt().getTime()).toBeGreaterThan(before.getTime());
  });

  // ---------------------------------------------------------------------------
  // not found
  // ---------------------------------------------------------------------------
  it('throws SupplierNotFound when the id does not exist', async () => {
    const call = useCase.execute(999);

    await expect(call).rejects.toBeInstanceOf(SupplierNotFound);
    await expect(call).rejects.toMatchObject({ id: 999 });
  });

  it('throws SupplierNotFound when the supplier is already inactive', async () => {
    const stored = await seed();
    await useCase.execute(stored.getId()!);

    const call = useCase.execute(stored.getId()!);

    // 404 y no 409: desde afuera ese proveedor ya no existe, asi que no hay
    // nada que dar de baja.
    await expect(call).rejects.toBeInstanceOf(SupplierNotFound);
  });

  it('leaves the other suppliers untouched', async () => {
    const target = await seed('Aceros del Sur');
    const other = await seed('Insumos del Norte');

    await useCase.execute(target.getId()!);

    expect(other.getActive()).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // effects on the rest of the module
  // ---------------------------------------------------------------------------
  describe('after the baja the supplier stops existing', () => {
    it('disappears from the listing', async () => {
      const stored = await seed();
      await useCase.execute(stored.getId()!);

      const result = await new ListSuppliers(repo).execute({ page: 1, limit: 10 });

      expect(result.total).toBe(0);
    });

    it('is no longer readable by id', async () => {
      const stored = await seed();
      await useCase.execute(stored.getId()!);

      const call = new GetSupplierById(repo).execute(stored.getId()!);

      await expect(call).rejects.toBeInstanceOf(SupplierNotFound);
    });

    it('releases its cuit and legal name for a new supplier', async () => {
      const stored = await seed('EDASA', VALID_CUIT);
      await useCase.execute(stored.getId()!);

      const created = await new CreateSupplier(repo).execute({
        legalName: 'EDASA',
        supplierType: 'PROCESS',
        cuit: VALID_CUIT,
      });

      expect(created.getId()).not.toBe(stored.getId());
      expect(created.getActive()).toBe(true);
      expect(repo.count()).toBe(2);
    });
  });
});
