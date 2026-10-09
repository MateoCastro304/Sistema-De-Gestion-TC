import { Module } from '@nestjs/common';
import { CreateSupplier } from './application/create-supplier.use-case';
import { DeactivateSupplier } from './application/deactivate-supplier.use-case';
import { GetSupplierById } from './application/get-supplier-by-id.use-case';
import { ListSuppliers } from './application/list-suppliers.use-case';
import { UpdateSupplier } from './application/update-supplier.use-case';
import { SupplierRepository } from './domain/ports/supplier.repository';
import { SuppliersController } from './http/suppliers.controller';
import { SupplierPrismaRepository } from './infrastructure/supplier-prisma.repository';

@Module({
  controllers: [SuppliersController],
  providers: [
    CreateSupplier,
    DeactivateSupplier,
    GetSupplierById,
    ListSuppliers,
    UpdateSupplier,
    {
      // El repositorio en memoria sigue existiendo, pero solo como fake de los
      // specs de los casos de uso. En runtime los proveedores van a la base.
      provide: SupplierRepository,
      useClass: SupplierPrismaRepository,
    },
  ],
})
export class SuppliersModule {}
