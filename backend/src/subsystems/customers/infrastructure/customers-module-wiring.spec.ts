import { Test } from '@nestjs/testing';
import { CustomersModule } from './customers.module';
import { CreateFactory } from '../core/application/use-cases/create-factory.use-case';
import { DeactivateFactory } from '../core/application/use-cases/deactivate-factory.use-case';
import { FactoryRepository } from '../core/domain/ports/factory.repository';
import { FactoryInMemoryRepository } from './persistence/in-memory/factory.repository';
import { ManagerRepository } from '../core/domain/ports/manager.repository';
import { ManagerInMemoryRepository } from './persistence/in-memory/managers.repository';
import { CreateManager } from '../core/application/use-cases/create-manager.use-case';
import { CategoriesRepository } from '../core/domain/ports/categories.repository';
import { CategoriesInMemoryRepository } from './persistence/in-memory/categories-in-memory.repository';
import { CreateCategory } from '../core/application/use-cases/create-category.use-case';

const buildModule = () =>
  Test.createTestingModule({ imports: [CustomersModule] })
    .overrideProvider(FactoryRepository)
    .useClass(FactoryInMemoryRepository)
    .overrideProvider(ManagerRepository)
    .useClass(ManagerInMemoryRepository)
    .overrideProvider(CategoriesRepository)
    .useClass(CategoriesInMemoryRepository)
    .compile();

describe('CustomersModule wiring (rubro + encargado + fábrica, un solo subsystem)', () => {
  it('aplica la regla real: no desactiva una fábrica con clientes activos', async () => {
    const moduleRef = await buildModule();

    const createFactory = moduleRef.get(CreateFactory);
    const deactivateFactory = moduleRef.get(DeactivateFactory);
    const createManager = moduleRef.get(CreateManager);
    const createCategory = moduleRef.get(CreateCategory);

    const category = await createCategory.execute({ name: 'Categoria Test' });

    const factory = await createFactory.execute({
      cuit: '20-12345678-6',
      legalName: 'Fabrica Test',
      address: 'Calle Falsa 123',
      categoryId: category.getId(),
    } as any);

    await createManager.execute(factory.getId()!, {
      firstName: 'Encargado',
      lastName: 'Test',
      phone: '1155555555',
      mail: 'encargado@test.com',
    });

    await expect(deactivateFactory.execute(factory.getId()!)).rejects.toThrow();
  });
});
