import { Module, forwardRef } from '@nestjs/common';
import { FactoriesService } from './application/factory.service';
import { FactoryController } from './http/factory.controller';
import { FactoryInMemoryRepository } from './infrastructure/factory.repository';
import { FactoryRepository } from './domain/port/factory.repository';
import { CategoriesModule } from '../categories/categories.module';
// Importa CustomersModule (con forwardRef porque ese módulo, a su vez,
// importa este) únicamente para poder inyectar el CustomerQuery que expone:
// FactoriesService lo usa en deactivate() para chequear si la fábrica tiene
// clientes activos, sin depender del CustomerRepository completo.
import { FactoryQuery } from '../categories/domain/port/factory-query.port';
import { FactoryQueryAdapter } from './infrastructure/factory-query.adapter';
import { CustomersModule } from '../customers/customers.module';

@Module({
    imports: [forwardRef(() => CategoriesModule), forwardRef(() => CustomersModule)],
    controllers: [FactoryController],
    providers: [
    FactoriesService,
    {
      provide: FactoryRepository,
      useClass: FactoryInMemoryRepository,
    },
    {
      provide: FactoryQuery,
      useClass: FactoryQueryAdapter,
    },
  ],
  exports: [FactoriesService, FactoryRepository, FactoryQuery],
})
export class FactoryModule{}