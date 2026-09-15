import { Module } from '@nestjs/common';
import { CreateSupplier } from './application/create-supplier.use-case';
import { GetSupplierById } from './application/get-supplier-by-id.use-case';
import { ListSuppliers } from './application/list-suppliers.use-case';
import { UpdateSupplier } from './application/update-supplier.use-case';
import { SupplierRepository } from './domain/ports/supplier.repository';
import { SuppliersController } from './http/suppliers.controller';
import { InMemorySupplierRepository } from './infrastructure/in-memory-supplier.repository';

@Module({
  controllers: [SuppliersController],
  providers: [
    CreateSupplier,
    GetSupplierById,
    ListSuppliers,
    UpdateSupplier,
    {
      provide: SupplierRepository,
      useClass: InMemorySupplierRepository,
    },
  ],
})
export class SuppliersModule {}
