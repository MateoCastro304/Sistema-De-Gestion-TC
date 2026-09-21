import { UpdateCategory } from './update-category.use-case';
import { CategoriesInMemoryRepository } from '../infrastructure/categories-in-memory.repository';
import { CategoryNotFound } from '../domain/errors/category-not-found.error';
import { CategoryNameAlreadyExists } from '../domain/errors/category-already-exists.error';
import { CategoryInactive } from '../domain/errors/category-inactive.error';
import { Category } from '../domain/category';

describe('UpdateCategory (use case)', () => {
  let repo: CategoriesInMemoryRepository;
  let useCase: UpdateCategory;

  beforeEach(() => {
    repo = new CategoriesInMemoryRepository();
    useCase = new UpdateCategory(repo);
  });

  const seed = async (name: string, active = true): Promise<Category> => {
    const stored = await repo.save(Category.create(name));
    if (!active) {
      stored.deactivate();
      await repo.save(stored);
    }
    return stored;
  };

  // ---------------------------------------------------------------------------
  // happy path
  // ---------------------------------------------------------------------------
  describe('happy path', () => {
    it('renames the category', async () => {
      const stored = await seed('Metalurgica');

      const result = await useCase.execute(stored.getId() as number, { name: 'Insumos' });

      expect(result.getName()).toBe('Insumos');
    });

    it('allows keeping the same name on the same category', async () => {
      const stored = await seed('Metalurgica');

      const result = await useCase.execute(stored.getId() as number, { name: 'Metalurgica' });

      expect(result.getName()).toBe('Metalurgica');
    });

    it('leaves the name untouched when none is given', async () => {
      const stored = await seed('Metalurgica');

      const result = await useCase.execute(stored.getId() as number, {});

      expect(result.getName()).toBe('Metalurgica');
    });
  });

  // ---------------------------------------------------------------------------
  // not found
  // ---------------------------------------------------------------------------
  describe('not found', () => {
    it('throws CategoryNotFound when the id does not exist', async () => {
      const call = useCase.execute(999, { name: 'X' });

      await expect(call).rejects.toBeInstanceOf(CategoryNotFound);
      await expect(call).rejects.toMatchObject({ id: 999 });
    });
  });

  // ---------------------------------------------------------------------------
  // uniqueness
  // ---------------------------------------------------------------------------
  describe('uniqueness', () => {
    it('rejects a name already used by another active category', async () => {
      await seed('Metalurgica');
      const stored = await seed('Autopartes');

      const call = useCase.execute(stored.getId() as number, { name: 'Metalurgica' });

      await expect(call).rejects.toBeInstanceOf(CategoryNameAlreadyExists);
    });
  });

  // ---------------------------------------------------------------------------
  // inactive category
  // ---------------------------------------------------------------------------
  describe('inactive category', () => {
    it('rejects modifying an inactive category with CategoryInactive', async () => {
      const stored = await seed('Metalurgica', false);

      const call = useCase.execute(stored.getId() as number, { name: 'Nuevo Nombre' });

      await expect(call).rejects.toBeInstanceOf(CategoryInactive);
      await expect(call).rejects.toMatchObject({ id: stored.getId() });
    });
  });

  // ---------------------------------------------------------------------------
  // domain validation propagates
  // ---------------------------------------------------------------------------
  describe('domain validation propagates', () => {
    it('rejects an empty name instead of silently ignoring it', async () => {
      const stored = await seed('Metalurgica');

      await expect(useCase.execute(stored.getId() as number, { name: '' })).rejects.toThrow(
        'Category name cannot be empty',
      );

      const fresh = await repo.findById(stored.getId() as number);
      expect(fresh?.getName()).toBe('Metalurgica');
    });

    it('rejects a whitespace-only name', async () => {
      const stored = await seed('Metalurgica');

      await expect(useCase.execute(stored.getId() as number, { name: '   ' })).rejects.toThrow(
        'Category name cannot be empty',
      );
    });
  });
});
