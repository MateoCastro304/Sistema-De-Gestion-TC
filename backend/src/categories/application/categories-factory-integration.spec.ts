import { BadRequestException } from '@nestjs/common';
import { FactoriesService } from '../../factory/application/factory.service';
import { FactoryInMemoryRepository } from '../../factory/infrastructure/factory.repository';
import { CategoriesInMemoryRepository } from '../infrastructure/categories-in-memory.repository';
import { CreateCategory } from './create-category.use-case';
import { DeactivateCategory } from './deactivate-category.use-case';

describe('Factory <-> Category business rule (integration)', () => {
  let factoriesService: FactoriesService;
  let createCategory: CreateCategory;
  let deactivateCategory: DeactivateCategory;

  beforeEach(() => {
    const categoriesRepository = new CategoriesInMemoryRepository();
    const factoryRepository = new FactoryInMemoryRepository();

    createCategory = new CreateCategory(categoriesRepository);
    deactivateCategory = new DeactivateCategory(categoriesRepository);
    factoriesService = new FactoriesService(factoryRepository, categoriesRepository);
  });

  const validFactoryDto = (categoryId: number) => ({
    cuit: '20-12345678-6',
    name: 'Fabrica Test',
    address: 'Calle Falsa 123',
    paymentDescription: undefined,
    categoryId,
  });

  it('creates a factory when the category exists and is active', async () => {
    const category = await createCategory.execute({ name: 'Metalurgica' });

    const factory = await factoriesService.create(validFactoryDto(category.getId() as number));

    expect(factory.getCategoryId()).toBe(category.getId());
  });

  it('rejects creating a factory when the category does not exist', async () => {
    await expect(factoriesService.create(validFactoryDto(999))).rejects.toThrow(BadRequestException);
  });

  it('rejects creating a factory when the category is inactive', async () => {
    const category = await createCategory.execute({ name: 'Metalurgica' });
    await deactivateCategory.execute(category.getId() as number);

    await expect(factoriesService.create(validFactoryDto(category.getId() as number))).rejects.toThrow(
      BadRequestException,
    );
  });
});
