import { ListCategories } from './list-categories.use-case';
import { CategoriesInMemoryRepository } from '../infrastructure/categories-in-memory.repository';
import { Category } from '../domain/category';

describe('ListCategories (use case)', () => {
  let repo: CategoriesInMemoryRepository;
  let useCase: ListCategories;

  beforeEach(() => {
    repo = new CategoriesInMemoryRepository();
    useCase = new ListCategories(repo);
  });

  const seed = async (name: string, active = true): Promise<Category> => {
    const stored = await repo.save(Category.create(name));
    if (!active) {
      stored.deactivate();
      await repo.save(stored);
    }
    return stored;
  };

  it('returns an empty page when there are no categories', async () => {
    const result = await useCase.execute({ page: 1, limit: 10 });

    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('returns only inactive categories when active is false', async () => {
    await seed('Metalurgica');
    await seed('Petrolera', false);

    const result = await useCase.execute({ page: 1, limit: 10, active: false });

    expect(result.items.map((c) => c.getName())).toEqual(['Petrolera']);
    expect(result.total).toBe(1);
  });

  it('returns only active categories when active is true', async () => {
    await seed('Metalurgica');
    await seed('Petrolera', false);

    const result = await useCase.execute({ page: 1, limit: 10, active: true });

    expect(result.items.map((c) => c.getName())).toEqual(['Metalurgica']);
  });

  it('returns only active categories', async () => {
    await seed('Metalurgica');
    await seed('Petrolera', false);

    const result = await useCase.execute({ page: 1, limit: 10 });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].getName()).toBe('Metalurgica');
    expect(result.total).toBe(1);
  });

  // ---------------------------------------------------------------------------
  // pagination
  // ---------------------------------------------------------------------------
  describe('pagination', () => {
    it('slices the active categories by page/limit, and keeps total counting the full match', async () => {
      for (let i = 1; i <= 5; i++) {
        await seed(`Rubro ${i}`);
      }

      const page1 = await useCase.execute({ page: 1, limit: 2 });
      const page3 = await useCase.execute({ page: 3, limit: 2 });

      expect(page1.items).toHaveLength(2);
      expect(page1.total).toBe(5);
      expect(page3.items).toHaveLength(1);
      expect(page3.total).toBe(5);
    });

    it('returns an empty page when the offset falls past the last match', async () => {
      await seed('Rubro 1');
      await seed('Rubro 2');

      const result = await useCase.execute({ page: 5, limit: 10 });

      expect(result.items).toEqual([]);
      expect(result.total).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // search
  // ---------------------------------------------------------------------------
  describe('nameContains', () => {
    it('filters by name substring, case-insensitively', async () => {
      await seed('Autopartes');
      await seed('Metalurgica');
      await seed('Autopiezas');

      const result = await useCase.execute({ page: 1, limit: 10, nameContains: 'AUTO' });

      expect(result.total).toBe(2);
      const names = result.items.map((c) => c.getName());
      expect(names).toEqual(expect.arrayContaining(['Autopartes', 'Autopiezas']));
    });

    it('computes total over the filtered set, not over the full store', async () => {
      await seed('Autopartes');
      await seed('Metalurgica');
      await seed('Autopiezas');

      const result = await useCase.execute({ page: 1, limit: 1, nameContains: 'auto' });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(2);
    });

    it('returns an empty result when nothing matches', async () => {
      await seed('Metalurgica');

      const result = await useCase.execute({ page: 1, limit: 10, nameContains: 'xyz' });

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });
  });
});
