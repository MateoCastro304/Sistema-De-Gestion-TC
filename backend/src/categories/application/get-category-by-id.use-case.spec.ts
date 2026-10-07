import { GetCategoryById } from './get-category-by-id.use-case';
import { CategoriesInMemoryRepository } from '../infrastructure/categories-in-memory.repository';
import { CategoryNotFound } from '../domain/errors/category-not-found.error';
import { Category } from '../domain/category';

describe('GetCategoryById (use case)', () => {
  let repo: CategoriesInMemoryRepository;
  let useCase: GetCategoryById;

  beforeEach(() => {
    repo = new CategoriesInMemoryRepository();
    useCase = new GetCategoryById(repo);
  });

  const seed = async (name = 'Metalurgica'): Promise<Category> => {
    return await repo.save(Category.create(name));
  };

  it('returns the category when the id matches', async () => {
    const stored = await seed('Metalurgica');

    const result = await useCase.execute(stored.getId() as number);

    expect(result.getId()).toBe(stored.getId());
    expect(result.getName()).toBe('Metalurgica');
  });

  it('returns inactive categories just like active ones', async () => {
    const stored = await seed('Metalurgica');
    stored.deactivate();
    await repo.save(stored);

    const result = await useCase.execute(stored.getId() as number);

    expect(result.getActive()).toBe(false);
  });

  it('throws CategoryNotFound when the id does not exist', async () => {
    const call = useCase.execute(999);

    await expect(call).rejects.toBeInstanceOf(CategoryNotFound);
    await expect(call).rejects.toMatchObject({ id: 999 });
  });
});
