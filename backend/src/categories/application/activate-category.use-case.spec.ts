import { ActivateCategory } from './activate-category.use-case';
import { CategoriesInMemoryRepository } from '../infrastructure/categories-in-memory.repository';
import { CategoryNotFound } from '../domain/errors/category-not-found.error';
import { Category } from '../domain/category';

describe('ActivateCategory (use case)', () => {
  let repo: CategoriesInMemoryRepository;
  let useCase: ActivateCategory;

  beforeEach(() => {
    repo = new CategoriesInMemoryRepository();
    useCase = new ActivateCategory(repo);
  });

  it('reactivates an inactive category', async () => {
    const stored = await repo.save(Category.create('Metalurgica'));
    stored.deactivate();
    await repo.save(stored);

    const result = await useCase.execute(stored.getId() as number);

    expect(result.getActive()).toBe(true);
  });

  it('throws CategoryNotFound when the id does not exist', async () => {
    const call = useCase.execute(999);

    await expect(call).rejects.toBeInstanceOf(CategoryNotFound);
  });
});
