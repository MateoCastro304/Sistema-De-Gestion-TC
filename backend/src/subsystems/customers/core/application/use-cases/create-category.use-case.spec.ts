import { CreateCategory } from './create-category.use-case';
import { CategoriesInMemoryRepository } from '../../../infrastructure/persistence/in-memory/categories-in-memory.repository';
import { CategoryNameAlreadyExists } from '../../domain/errors/category-already-exists.error';

describe('CreateCategory (use case)', () => {
  let repo: CategoriesInMemoryRepository;
  let useCase: CreateCategory;

  beforeEach(() => {
    repo = new CategoriesInMemoryRepository();
    useCase = new CreateCategory(repo);
  });

  // ---------------------------------------------------------------------------
  // happy path
  // ---------------------------------------------------------------------------
  describe('happy path', () => {
    it('persists a category as active', async () => {
      const result = await useCase.execute({ name: 'Metalurgica' });

      expect(result.getId()).not.toBeNull();
      expect(result.getName()).toBe('Metalurgica');
      expect(result.getActive()).toBe(true);
    });

    it('allows two categories with different names to coexist', async () => {
      await useCase.execute({ name: 'Metalurgica' });
      await useCase.execute({ name: 'Autopartes' });

      const all = await repo.list({ page: 1, limit: 10 });
      expect(all.items).toHaveLength(2);
    });
  });

  // ---------------------------------------------------------------------------
  // uniqueness
  // ---------------------------------------------------------------------------
  describe('uniqueness', () => {
    it('rejects a duplicate active name, case/whitespace-insensitive, with CategoryNameAlreadyExists', async () => {
      await useCase.execute({ name: 'Autopartes' });

      const call = useCase.execute({ name: '  autopartes  ' });

      await expect(call).rejects.toBeInstanceOf(CategoryNameAlreadyExists);
    });

    it('reactivates an inactive category with the same name instead of creating a duplicate', async () => {
      const created = await useCase.execute({ name: 'Petrolera' });
      created.deactivate();
      await repo.save(created);

      const result = await useCase.execute({ name: 'Petrolera' });

      expect(result.getId()).toBe(created.getId());
      expect(result.getActive()).toBe(true);

      const all = await repo.list({ page: 1, limit: 10 });
      expect(all.items).toHaveLength(1); // no se creó una fila nueva
    });
  });

  // ---------------------------------------------------------------------------
  // domain validation propagates
  // ---------------------------------------------------------------------------
  describe('domain validation propagates', () => {
    it('rejects an empty name', async () => {
      await expect(useCase.execute({ name: '' })).rejects.toThrow('Category name cannot be empty');
    });

    it('rejects a name shorter than 3 characters', async () => {
      await expect(useCase.execute({ name: 'ab' })).rejects.toThrow('Category name must be at least 3 characters long');
    });
  });
});
