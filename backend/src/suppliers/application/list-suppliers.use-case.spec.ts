import { ListSuppliers } from './list-suppliers.use-case';
import { InMemorySupplierRepository } from './testing/in-memory-supplier.repository';
import { Supplier } from '../domain/supplier';
import { SupplierType } from '../domain/supplier-type';

describe('ListSuppliers (use case)', () => {
  let repo: InMemorySupplierRepository;
  let useCase: ListSuppliers;

  beforeEach(() => {
    repo = new InMemorySupplierRepository();
    useCase = new ListSuppliers(repo);
  });

  const seed = async (
    legalName: string,
    types: SupplierType[] = ['MATERIAL'],
    active: boolean = true,
  ): Promise<Supplier> => {
    const draft = Supplier.create(legalName, types);
    const stored = await repo.save(draft);
    if (!active) {
      stored.deactivate();
      await repo.save(stored);
    }
    return stored;
  };

  // ---------------------------------------------------------------------------
  // basics
  // ---------------------------------------------------------------------------
  it('returns an empty page when there are no suppliers', async () => {
    const result = await useCase.execute({ page: 1, limit: 10 });

    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('returns every supplier when no filters are given', async () => {
    await seed('Aceros del Sur');
    await seed('Insumos del Norte');

    const result = await useCase.execute({ page: 1, limit: 10 });

    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('includes inactive suppliers because no active filter is applied yet', async () => {
    await seed('Activo');
    await seed('Inactivo', ['MATERIAL'], false);

    const result = await useCase.execute({ page: 1, limit: 10 });

    expect(result.total).toBe(2);
  });

  // ---------------------------------------------------------------------------
  // pagination
  // ---------------------------------------------------------------------------
  describe('pagination', () => {
    it('slices the page and keeps total counting the full match', async () => {
      for (let i = 1; i <= 5; i++) {
        await seed(`Proveedor ${i}`);
      }

      const page1 = await useCase.execute({ page: 1, limit: 2 });
      const page3 = await useCase.execute({ page: 3, limit: 2 });

      expect(page1.items).toHaveLength(2);
      expect(page1.total).toBe(5);
      expect(page3.items).toHaveLength(1);
      expect(page3.total).toBe(5);
    });

    it('returns an empty page when the offset falls past the last match', async () => {
      await seed('Proveedor 1');
      await seed('Proveedor 2');

      const result = await useCase.execute({ page: 5, limit: 10 });

      expect(result.items).toEqual([]);
      expect(result.total).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // filters
  // ---------------------------------------------------------------------------
  describe('filters', () => {
    it('filters by supplier type, matching at least one of the given types', async () => {
      await seed('Aceros del Sur', ['MATERIAL']);
      await seed('Servicios SA', ['PROCESS']);
      await seed('Aceros y Procesos', ['MATERIAL', 'PROCESS']);

      const result = await useCase.execute({ page: 1, limit: 10, types: ['PROCESS'] });

      expect(result.total).toBe(2);
      const names = result.items.map((s) => s.getLegalName());
      expect(names).toEqual(expect.arrayContaining(['Servicios SA', 'Aceros y Procesos']));
      expect(names).not.toContain('Aceros del Sur');
    });

    it('filters by legal name substring, case-insensitively', async () => {
      await seed('Aceros del Sur');
      await seed('Otro Proveedor');
      await seed('Aceros y Procesos');

      const result = await useCase.execute({
        page: 1,
        limit: 10,
        legalNameContains: 'ACEROS',
      });

      expect(result.total).toBe(2);
      const names = result.items.map((s) => s.getLegalName());
      expect(names).toEqual(expect.arrayContaining(['Aceros del Sur', 'Aceros y Procesos']));
    });

    it('combines several filters with AND', async () => {
      await seed('Aceros del Sur', ['MATERIAL']);
      await seed('Aceros y Procesos', ['PROCESS']);
      await seed('Servicios SA', ['PROCESS']);

      const result = await useCase.execute({
        page: 1,
        limit: 10,
        types: ['MATERIAL'],
        legalNameContains: 'aceros',
      });

      expect(result.total).toBe(1);
      expect(result.items[0].getLegalName()).toBe('Aceros del Sur');
    });

    it('computes total over the filtered set, not over the full store', async () => {
      await seed('Aceros del Sur', ['MATERIAL']);
      await seed('Servicios SA', ['PROCESS']);
      await seed('Insumos del Norte', ['MATERIAL']);

      const result = await useCase.execute({
        page: 1,
        limit: 1,
        types: ['MATERIAL'],
      });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(2);
    });
  });
});
