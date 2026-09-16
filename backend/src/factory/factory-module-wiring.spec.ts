import { Test } from '@nestjs/testing';
import { FactoryModule } from './factory.module';
import { FactoriesService } from './application/factory.service';
import { CustomerQuery } from './domain/port/customer-query.port';
import { CustomersService } from '../customers/application/customers.service';

describe('FactoryModule wiring (forwardRef)', () => {
  it('resuelve CustomerQuery via forwardRef sin errores en runtime', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [FactoryModule],
    }).compile();

    const factoriesService = moduleRef.get(FactoriesService);
    const customerQuery = moduleRef.get(CustomerQuery);

    expect(factoriesService).toBeDefined();
    expect(customerQuery).toBeDefined();
  });

  it('aplica la regla real: no desactiva una fábrica con clientes activos', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [FactoryModule],
    }).compile();

    const factoriesService = moduleRef.get(FactoriesService);
    const customersService = moduleRef.get(CustomersService);

    const factory = await factoriesService.create({
      cuit: '20304050607',
      name: 'Fabrica Test',
      address: 'Calle Falsa 123',
      categoryId: 1, // ajustá si tu CategoriesInMemoryRepository necesita un seed distinto
    } as any);

    await customersService.create({
      name: 'Cliente',
      lastName: 'Test',
      factoryId: factory.getId(),
    } as any);

    await expect(factoriesService.deactivate(factory.getId()!)).rejects.toThrow();
  });
});
