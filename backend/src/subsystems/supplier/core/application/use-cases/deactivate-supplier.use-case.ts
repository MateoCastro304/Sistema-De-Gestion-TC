import { Injectable } from '@nestjs/common';
import { SupplierNotFound } from '../../domain/errors/supplier-not-found.error';
import { SupplierRepository } from '../../domain/ports/supplier.repository';

/**
 * Registra la baja de un proveedor. La baja es logica: la fila se conserva y
 * solo cambia su flag, para que los materiales y las ordenes que ya la
 * referencian sigan siendo validos.
 *
 * No existe la operacion inversa. Un proveedor dado de baja deja de existir
 * para toda consulta y su CUIT y su razon social quedan libres para otro
 * proveedor, asi que "reactivar" devolveria un registro que el resto del
 * sistema ya considera inexistente y podria colisionar con el que ocupo su
 * lugar. Si hace falta volver a operar con ese proveedor, se registra de nuevo.
 *
 * Dar de baja un proveedor ya inactivo responde 404 y no un 409: desde afuera
 * ese proveedor no existe, asi que no hay nada que dar de baja. La condicion
 * sale del mismo guard que usan GetSupplierById y UpdateSupplier.
 *
 * PENDIENTE: el contrato OpenAPI define un 409 cuando el proveedor esta
 * asignado a ordenes de trabajo que no estan en un estado final. Hoy no se
 * puede implementar: no existe el modelo WorkOrder en el schema de Prisma
 * (solo el valor WORK_ORDER del enum entity_type_enum, que usa `file` para su
 * FK polimorfica). Cuando el modulo de ordenes de trabajo exista, hay que
 * agregar un puerto de consulta aca y devolver ese 409 antes del deactivate().
 */
@Injectable()
export class DeactivateSupplier {
  constructor(private readonly repo: SupplierRepository) {}

  async execute(id: number): Promise<void> {
    const supplier = await this.repo.findById(id);
    if (supplier === null || !supplier.getActive()) {
      throw new SupplierNotFound(id);
    }

    supplier.deactivate();
    await this.repo.save(supplier);
  }
}
