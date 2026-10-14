import { Module, forwardRef } from '@nestjs/common';
import { FactoryController } from './http/factory.controller';
import { FactoryRepository } from './domain/port/factory.repository';
import { CategoriesModule } from '../categories/categories.module';
// Importa CustomersModule (con forwardRef porque ese módulo, a su vez,
// importa este) únicamente para poder inyectar el CustomerQuery que expone:
// DeactivateFactory lo usa para chequear si la fábrica tiene clientes
// activos, sin depender del CustomerRepository completo.
import { FactoryQuery } from '../categories/domain/ports/factory-query.port';
import { FactoryQueryAdapter } from './infrastructure/factory-query.adapter';
import { CustomersModule } from '../customers/customers.module';
import { FactoryPrismaRepository } from './infrastructure/factory-prisma.repository';
import { CreateFactory } from './application/create-factory.use-case';
import { GetFactoryById } from './application/get-factory-by-id.use-case';
import { ListFactories } from './application/list-factories.use-case';
import { UpdateFactory } from './application/update-factory.use-case';
import { DeactivateFactory } from './application/deactivate-factory.use-case';

@Module({
  imports: [forwardRef(() => CategoriesModule), forwardRef(() => CustomersModule)],
  controllers: [FactoryController],
  providers: [
    CreateFactory,
    GetFactoryById,
    ListFactories,
    UpdateFactory,
    DeactivateFactory,
    {
      provide: FactoryRepository,
      useClass: FactoryPrismaRepository,
    },
    {
      provide: FactoryQuery,
      useClass: FactoryQueryAdapter,
    },
  ],
  exports: [FactoryRepository, FactoryQuery],
})
export class FactoryModule {}
