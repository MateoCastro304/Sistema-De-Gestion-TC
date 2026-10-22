import { Module } from '@nestjs/common';
import { CreateSupplier } from '../core/application/use-cases/create-supplier.use-case';
import { DeactivateSupplier } from '../core/application/use-cases/deactivate-supplier.use-case';
import { GetSupplierById } from '../core/application/use-cases/get-supplier-by-id.use-case';
import { ListSuppliers } from '../core/application/use-cases/list-suppliers.use-case';
import { UpdateSupplier } from '../core/application/use-cases/update-supplier.use-case';
import { SupplierRepository } from '../core/domain/ports/supplier.repository';
import { SuppliersController } from './http/controllers/suppliers.controller';
import { SupplierPrismaRepository } from './persistence/prisma/supplier-prisma.repository';

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
