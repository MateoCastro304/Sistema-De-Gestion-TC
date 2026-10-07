import { Test } from '@nestjs/testing';
import { FactoryModule } from './factory.module';
import { CreateFactory } from './application/create-factory.use-case';
import { DeactivateFactory } from './application/deactivate-factory.use-case';
import { FactoryRepository } from './domain/port/factory.repository';
import { FactoryInMemoryRepository } from './infrastructure/factory.repository';
import { CustomerQuery } from './domain/port/customer-query.port';
import { CreateCustomer } from '../customers/application/create-customer.use-case';
import { CustomerRepository } from '../customers/domain/port/customer.repository';
import { CustomerInMemoryRepository } from '../customers/infrastructure/customers.repository';
import { CreateCategory } from '../categories/application/create-category.use-case';
import { CategoriesRepository } from '../categories/domain/ports/categories.repository';
import { CategoriesInMemoryRepository } from '../categories/infrastructure/categories-in-memory.repository';

const buildModule = () =>
  Test.createTestingModule({ imports: [FactoryModule] })
    .overrideProvider(FactoryRepository)
    .useClass(FactoryInMemoryRepository)
    .overrideProvider(CustomerRepository)
    .useClass(CustomerInMemoryRepository)
    .overrideProvider(CategoriesRepository)
    .useClass(CategoriesInMemoryRepository)
    .compile();

describe('FactoryModule wiring (forwardRef)', () => {
  it('resuelve CustomerQuery via forwardRef sin errores en runtime', async () => {
    const moduleRef = await buildModule();

    expect(moduleRef.get(CreateFactory)).toBeDefined();
    expect(moduleRef.get(CustomerQuery)).toBeDefined();
  });

  it('aplica la regla real: no desactiva una fábrica con clientes activos', async () => {
    const moduleRef = await buildModule();

    const createFactory = moduleRef.get(CreateFactory);
    const deactivateFactory = moduleRef.get(DeactivateFactory);
    const createCustomer = moduleRef.get(CreateCustomer);
    const createCategory = moduleRef.get(CreateCategory);

    const category = await createCategory.execute({ name: 'Categoria Test' });

    const factory = await createFactory.execute({
      cuit: '20-12345678-6',
      name: 'Fabrica Test',
      address: 'Calle Falsa 123',
      categoryId: category.getId(),
    } as any);

    await createCustomer.execute(factory.getId()!, {
      firstName: 'Cliente',
      lastName: 'Test',
      phone: '1155555555',
      mail: 'cliente@test.com',
    });

    await expect(deactivateFactory.execute(factory.getId()!)).rejects.toThrow();
  });
});
