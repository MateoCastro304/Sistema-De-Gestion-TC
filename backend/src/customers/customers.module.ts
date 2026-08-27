import { Module } from '@nestjs/common';
import { CustomersController } from './http/customers.controller';
import { CustomersService } from './application/customers.service';

// 1. Importar la abstracción/contrato del Dominio[cite: 1, 2]
import { CustomerRepository } from './domain/customer.repository';

// 2. Importar la implementación In-Memory de Infraestructura[cite: 1, 2]
import { CustomerInMemoryRepository } from './infrastructure/customers.repository';

// 3. Importar FactoryRepository para resolver la dependencia del CustomersService
import { FactoryRepository } from '../factory/domain/factory.repository';
import { FactoryInMemoryRepository } from '../factory/infrastructure/factory.repository'; // O la implementación de fábrica correspondiente

@Module({
  controllers: [CustomersController],
  providers: [
    CustomersService,
    // Vincular la abstracción (puerto) con la implementación en memoria (adaptador)[cite: 1, 2]
    {
      provide: CustomerRepository,
      useClass: CustomerInMemoryRepository,
    },
    // Si FactoryRepository no está exportado globalmente en FactoryModule, vincularlo aquí:
    {
      provide: FactoryRepository,
      useClass: FactoryInMemoryRepository,
    },
  ],
  exports: [CustomersService],
})
export class CustomersModule {}