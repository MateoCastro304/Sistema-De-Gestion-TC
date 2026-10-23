import { Injectable } from '@nestjs/common';
import { ClockPort } from '../../../../../shared/clock/clock.port';
import { TransactionManagerPort } from '../../../../../shared/transaction/transaction-manager.port';
import { ProcessType, ProcessTypeChanges } from '../../domain/entities/process-type.entity';
import { ProcessTypeConcurrentModification } from '../../domain/errors/process-type-concurrent-modification.error';
import { ProcessTypeNameTaken } from '../../domain/errors/process-type-name-taken.error';
import { ProcessTypeNotFound } from '../../domain/errors/process-type-not-found.error';
import { ProcessTypeRepository } from '../../domain/ports/process-type.repository';

export type ModifyProcessTypeInput = {
  id: number;
  changes: ProcessTypeChanges;
  /** Usuario que firma el cambio; queda en el historial si cambia algún precio. */
  authorId: number;
};

/** Cuántas veces se relee y reintenta si otro pedido modifica el mismo tipo de proceso en el medio. */
const MAX_ATTEMPTS = 3;

/**
 * Modifica un tipo de proceso (CU-10). La entidad decide qué cambió y si hay
 * que registrar historial; acá se lee, se comprueba la unicidad del nombre y se
 * guarda en una transacción el tipo de proceso y, si cambió algún precio, su
 * registro de historial. Si no cambió nada, no se escribe.
 */
@Injectable()
export class ModifyProcessType {
  constructor(
    private readonly repository: ProcessTypeRepository,
    private readonly transactions: TransactionManagerPort,
    private readonly clock: ClockPort,
  ) {}

  async execute(input: ModifyProcessTypeInput): Promise<ProcessType> {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const current = await this.repository.findById(input.id);
      if (!current) throw new ProcessTypeNotFound();

      const modification = current.modify(input.changes, this.clock.now());
      if (!modification.changed) return current;

      if (
        modification.nameKeyChanged() &&
        (await this.repository.existsByNameKey(modification.next.getNameKey(), input.id))
      ) {
        throw new ProcessTypeNameTaken();
      }

      const saved = await this.transactions.runInTransaction(async () => {
        if (!(await this.repository.updateIfUnchanged(modification))) return false;
        if (modification.priceChange) {
          await this.repository.addPriceChange(
            input.id,
            modification.priceChange,
            input.authorId,
            modification.next.getUpdatedAt()!,
          );
        }
        return true;
      });
      if (saved) return (await this.repository.findById(input.id))!;
    }
    throw new ProcessTypeConcurrentModification();
  }
}
