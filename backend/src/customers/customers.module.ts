import { Module, forwardRef } from '@nestjs/common';
import { CustomersController } from './http/customers.controller';
import { CustomerRepository } from './domain/port/customer.repository';
import { FactoryModule } from '../factory/factory.module';
import { CustomerQuery } from '../factory/domain/port/customer-query.port';
import { CustomerQueryAdapter } from './infrastructure/customer-query.adapter';
import { CustomerPrismaRepository } from './infrastructure/customers-prisma.repository';
import { CreateCustomer } from './application/create-customer.use-case';
import { GetCustomerById } from './application/get-customer-by-id.use-case';
import { ListCustomers } from './application/list-customers.use-case';
import { UpdateCustomer } from './application/update-customer.use-case';
import { DeactivateCustomer } from './application/deactivate-customer.use-case';
import { ActivateCustomer } from './application/activate-customer.use-case';


@Module({
  imports: [forwardRef(() => FactoryModule)], // "Esta dependencia existe, pero resolvela más adelante cuando tengas disponible la referencia."
  controllers: [CustomersController],
  providers: [
    CreateCustomer,
    GetCustomerById,
    ListCustomers,
    UpdateCustomer,
    DeactivateCustomer,
    ActivateCustomer,
    // Vincular la abstracción (puerto) con la implementación en memoria (adaptador)
    {
      provide: CustomerRepository,
      useClass: CustomerPrismaRepository,
    },
    // Adaptador del puerto CustomerQuery, consumido por FactoryModule, "Cuando alguien pida CustomerQuery, entregale un CustomerQueryAdapter."
    {
      provide: CustomerQuery,
      useClass: CustomerQueryAdapter,
    },
  ],
  exports: [CustomerQuery],
})
export class CustomersModule {}
