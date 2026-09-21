import { Test } from '@nestjs/testing';
import { FactoryModule } from './factory.module';
import { FactoriesService } from './application/factory.service';
import { FactoryRepository } from './domain/port/factory.repository';
import { FactoryInMemoryRepository } from './infrastructure/factory.repository';
import { CustomerQuery } from './domain/port/customer-query.port';
import { CustomersService } from '../customers/application/customers.service';
import { CustomerRepository } from '../customers/domain/port/customer.repository';
import { CustomerInMemoryRepository } from '../customers/infrastructure/customers.repository';
import { CategoriesService } from '../categories/application/categories.service';

const buildModule = () =>
  Test.createTestingModule({ imports: [FactoryModule] })
    .overrideProvider(FactoryRepository)
    .useClass(FactoryInMemoryRepository)
    .overrideProvider(CustomerRepository)
    .useClass(CustomerInMemoryRepository)
    .compile();

describe('FactoryModule wiring (forwardRef)', () => {
  it('resuelve CustomerQuery via forwardRef sin errores en runtime', async () => {
    const moduleRef = await buildModule();

    expect(moduleRef.get(FactoriesService)).toBeDefined();
    expect(moduleRef.get(CustomerQuery)).toBeDefined();
  });

  it('aplica la regla real: no desactiva una fábrica con clientes activos', async () => {
    const moduleRef = await buildModule();

    const factoriesService = moduleRef.get(FactoriesService);
    const customersService = moduleRef.get(CustomersService);
    const categoriesService = moduleRef.get(CategoriesService);

    const category = await categoriesService.create({ name: 'Categoria Test' } as any);

    const factory = await factoriesService.create({
      cuit: '20-12345678-6',
      name: 'Fabrica Test',
      address: 'Calle Falsa 123',
      categoryId: category.getId(),
    } as any);

    await customersService.create(factory.getId()!, {
      name: 'Cliente',
      lastName: 'Test',
      phone: '1155555555',
      mail: 'cliente@test.com',
    });

    await expect(factoriesService.deactivate(factory.getId()!)).rejects.toThrow();
  });
});
