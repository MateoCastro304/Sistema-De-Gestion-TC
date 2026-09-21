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

    expect(result).toEqual([]);
  });

  it('returns only active categories', async () => {
    await seed('Metalurgica');
    await seed('Petrolera', false);

    const result = await useCase.execute({ page: 1, limit: 10 });

    expect(result).toHaveLength(1);
    expect(result[0].getName()).toBe('Metalurgica');
  });

  // ---------------------------------------------------------------------------
  // pagination
  // ---------------------------------------------------------------------------
  describe('pagination', () => {
    it('slices the active categories by page/limit', async () => {
      for (let i = 1; i <= 5; i++) {
        await seed(`Rubro ${i}`);
      }

      const page1 = await useCase.execute({ page: 1, limit: 2 });
      const page3 = await useCase.execute({ page: 3, limit: 2 });

      expect(page1).toHaveLength(2);
      expect(page3).toHaveLength(1);
    });

    it('returns an empty page when the offset falls past the last match', async () => {
      await seed('Rubro 1');
      await seed('Rubro 2');

      const result = await useCase.execute({ page: 5, limit: 10 });

      expect(result).toEqual([]);
    });
  });
});
