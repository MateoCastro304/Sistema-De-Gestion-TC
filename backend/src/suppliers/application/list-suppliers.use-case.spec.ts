import { ListSuppliers } from './list-suppliers.use-case';
import { InMemorySupplierRepository } from '../infrastructure/in-memory-supplier.repository';
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
    type: SupplierType = 'MATERIAL',
    active: boolean = true,
    options: { cuit?: string; contactName?: string } = {},
  ): Promise<Supplier> => {
    const draft = Supplier.create(legalName, type, options);
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

  it('excludes inactive suppliers, with no flag to include them', async () => {
    await seed('Activo');
    await seed('Inactivo', 'MATERIAL', false);

    const result = await useCase.execute({ page: 1, limit: 10 });

    expect(result.total).toBe(1);
    expect(result.items[0].getLegalName()).toBe('Activo');
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
    it('filters by supplier type, exclusively', async () => {
      await seed('Aceros del Sur', 'MATERIAL');
      await seed('Servicios SA', 'PROCESS');
      await seed('Pinturas del Centro', 'PAINT');

      const result = await useCase.execute({ page: 1, limit: 10, type: 'PROCESS' });

      expect(result.total).toBe(1);
      expect(result.items[0].getLegalName()).toBe('Servicios SA');
    });

    describe('search', () => {
      it('matches a legal name substring, case-insensitively', async () => {
        await seed('Aceros del Sur');
        await seed('Otro Proveedor');
        await seed('Aceros y Procesos');

        const result = await useCase.execute({ page: 1, limit: 10, search: 'ACEROS' });

        expect(result.total).toBe(2);
        const names = result.items.map((s) => s.getLegalName());
        expect(names).toEqual(expect.arrayContaining(['Aceros del Sur', 'Aceros y Procesos']));
      });

      it('matches a contact name substring', async () => {
        await seed('Aceros del Sur', 'MATERIAL', true, { contactName: 'Diego Fernandez' });
        await seed('Otro Proveedor');

        const result = await useCase.execute({ page: 1, limit: 10, search: 'fernandez' });

        expect(result.total).toBe(1);
        expect(result.items[0].getLegalName()).toBe('Aceros del Sur');
      });

      it('matches the cuit ignoring the separators the user types', async () => {
        await seed('Aceros del Sur', 'MATERIAL', true, { cuit: '30-71234567-1' });
        await seed('Otro Proveedor');

        // Stored as 11 bare digits, searched with dashes.
        const result = await useCase.execute({ page: 1, limit: 10, search: '30-712' });

        expect(result.total).toBe(1);
        expect(result.items[0].getLegalName()).toBe('Aceros del Sur');
      });

      it('matches a partial cuit typed without separators', async () => {
        await seed('Aceros del Sur', 'MATERIAL', true, { cuit: '30-71234567-1' });

        const result = await useCase.execute({ page: 1, limit: 10, search: '71234567' });

        expect(result.total).toBe(1);
      });

      it('returns nothing when the search matches no field', async () => {
        await seed('Aceros del Sur', 'MATERIAL', true, { cuit: '30-71234567-1' });

        const result = await useCase.execute({ page: 1, limit: 10, search: 'zzz' });

        expect(result.total).toBe(0);
      });

      it('ignores a blank search instead of matching nothing', async () => {
        await seed('Aceros del Sur');
        await seed('Otro Proveedor');

        const result = await useCase.execute({ page: 1, limit: 10, search: '   ' });

        expect(result.total).toBe(2);
      });

      it('does not match every supplier when the search has no digits', async () => {
        // A needle with no digits strips down to an empty string: that must not
        // be treated as "every cuit contains the empty string".
        await seed('Aceros del Sur', 'MATERIAL', true, { cuit: '30-71234567-1' });
        await seed('Otro Proveedor', 'MATERIAL', true, { cuit: '27-23456789-1' });

        const result = await useCase.execute({ page: 1, limit: 10, search: '---' });

        expect(result.total).toBe(0);
      });
    });

    it('combines several filters with AND', async () => {
      await seed('Aceros del Sur', 'MATERIAL');
      await seed('Aceros y Procesos', 'PROCESS');
      await seed('Servicios SA', 'PROCESS');

      const result = await useCase.execute({
        page: 1,
        limit: 10,
        type: 'MATERIAL',
        search: 'aceros',
      });

      expect(result.total).toBe(1);
      expect(result.items[0].getLegalName()).toBe('Aceros del Sur');
    });

    it('computes total over the filtered set, not over the full store', async () => {
      await seed('Aceros del Sur', 'MATERIAL');
      await seed('Servicios SA', 'PROCESS');
      await seed('Insumos del Norte', 'MATERIAL');

      const result = await useCase.execute({
        page: 1,
        limit: 1,
        type: 'MATERIAL',
      });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(2);
    });
  });
});
