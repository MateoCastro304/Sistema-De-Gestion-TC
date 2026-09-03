import { Module } from '@nestjs/common';
import { CustomersController } from './http/customers.controller';
import { CustomersService } from './application/customers.service';

// 1. Importar la abstracción/contrato del Dominio
import { CustomerRepository } from './domain/customer.repository';

// 2. Importar la implementación In-Memory de Infraestructura
import { CustomerInMemoryRepository } from './infrastructure/customers.repository';

// 3. Importar FactoryModule, que exporta FactoryRepository, para que
//    CustomersService valide contra el MISMO store de fábricas que /fabricas.
import { FactoryModule } from '../factory/factory.module';

@Module({
  imports: [FactoryModule],
  controllers: [CustomersController],
  providers: [
    CustomersService,
    // Vincular la abstracción (puerto) con la implementación en memoria (adaptador)
    {
      provide: CustomerRepository,
      useClass: CustomerInMemoryRepository,
    },
  ],
  exports: [CustomersService],
})
export class CustomersModule {}
