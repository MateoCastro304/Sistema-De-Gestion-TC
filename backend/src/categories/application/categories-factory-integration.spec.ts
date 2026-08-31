import { FactoriesService } from '../../factory/application/factory.service';
import { FactoryInMemoryRepository } from '../../factory/infrastructure/factory.repository';
import { CategoriesInMemoryRepository } from '../infrastructure/categories-in-memory.repository';
import { CategoriesService } from './categories.service';
import { BadRequestException } from '@nestjs/common';

describe('Factory <-> Category business rule (integration)', () => {
    let factoriesService: FactoriesService;
    let categoriesService: CategoriesService;

    beforeEach(() => {
        const categoriesRepository = new CategoriesInMemoryRepository();
        const factoryRepository = new FactoryInMemoryRepository();

    categoriesService = new CategoriesService(categoriesRepository);
    factoriesService = new FactoriesService(factoryRepository, categoriesRepository);
    });

    const validFactoryDto = (categoryId: number) => ({
        cuit: '20-12345678-9',
        name: 'Fabrica Test',
        address: 'Calle Falsa 123',
        paymentDescription: undefined,
        categoryId,
    });

    it('creates a factory when the category exists and is active', async () => {
        const category = await categoriesService.create({ name: 'Metalurgica' });

        const factory = await factoriesService.create(validFactoryDto(category.id as number));

        expect(factory.getCategoryId()).toBe(category.id);
    });

    it('rejects creating a factory when the category does not exist', async () => {
        await expect(factoriesService.create(validFactoryDto(999))).rejects.toThrow(BadRequestException);
    });

    it('rejects creating a factory when the category is inactive', async () => {
        const category = await categoriesService.create({ name: 'Metalurgica' });
        await categoriesService.remove(category.id as number);

        await expect(factoriesService.create(validFactoryDto(category.id as number))).rejects.toThrow(
            BadRequestException,
    );
    });
});