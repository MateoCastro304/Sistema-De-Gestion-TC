import { ConflictException } from '@nestjs/common';
import { DeactivateCategory } from './deactivate-category.use-case';
import { CategoriesInMemoryRepository } from '../../../infrastructure/persistence/in-memory/categories-in-memory.repository';
import { CategoryNotFound } from '../../domain/errors/category-not-found.error';
import { FactoryQuery } from '../../domain/ports/factory-query.port';
import { Category } from '../../domain/entities/category';

describe('DeactivateCategory (use case)', () => {
  let repo: CategoriesInMemoryRepository;

  beforeEach(() => {
    repo = new CategoriesInMemoryRepository();
  });

  const seed = async (name = 'Metalurgica'): Promise<Category> => {
    return await repo.save(Category.create(name));
  };

  it('deactivates the category when no FactoryQuery is wired', async () => {
    const stored = await seed();
    const useCase = new DeactivateCategory(repo);

    const result = await useCase.execute(stored.getId() as number);

    expect(result.getActive()).toBe(false);
  });

  it('deactivates the category when FactoryQuery reports no active factories', async () => {
    const stored = await seed();
    const factoryQuery: FactoryQuery = {
      getActiveFactoriesForCategory: jest.fn().mockResolvedValue([]),
    };
    const useCase = new DeactivateCategory(repo, factoryQuery);

    const result = await useCase.execute(stored.getId() as number);

    expect(result.getActive()).toBe(false);
    expect(factoryQuery.getActiveFactoriesForCategory).toHaveBeenCalledWith(stored.getId());
  });

  it('rejects deactivation when FactoryQuery reports active factories, with the count and list in the response', async () => {
    const stored = await seed();
    const activeFactories = [
      { id: 10, name: 'Fabrica A' },
      { id: 11, name: 'Fabrica B' },
    ];
    const factoryQuery: FactoryQuery = {
      getActiveFactoriesForCategory: jest.fn().mockResolvedValue(activeFactories),
    };
    const useCase = new DeactivateCategory(repo, factoryQuery);

    const call = useCase.execute(stored.getId() as number);

    await expect(call).rejects.toBeInstanceOf(ConflictException);
    await expect(call).rejects.toMatchObject({
      response: {
        message:
          'No es posible dar de baja el rubro: existen 2 fábricas activas asociadas. Reasignelas antes de continuar',
        factories: activeFactories,
      },
    });

    const fresh = await repo.findById(stored.getId() as number);
    expect(fresh?.getActive()).toBe(true);
  });

  it('throws CategoryNotFound when the id does not exist', async () => {
    const useCase = new DeactivateCategory(repo);

    const call = useCase.execute(999);

    await expect(call).rejects.toBeInstanceOf(CategoryNotFound);
  });
});
