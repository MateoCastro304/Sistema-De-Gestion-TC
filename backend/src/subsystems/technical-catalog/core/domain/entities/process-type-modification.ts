import { MoneyAmount } from '../value-objects/money-amount.vo';
import { ProcessType } from './process-type.entity';

/** Lo que va al historial cuando cambia algún precio hora: los valores en dólares y el tipo de cambio usado (D-32). */
export type PriceChangeDraft = {
  previousValueUsd: MoneyAmount;
  newValueUsd: MoneyAmount;
  exchangeRate: MoneyAmount;
};

/**
 * Resultado de aplicar cambios a un tipo de proceso: el estado anterior, el
 * nuevo y, si cambió algún precio, el registro de historial que corresponde.
 * Si nada cambió, `next` es el mismo tipo de proceso y no hay nada que escribir.
 */
export class ProcessTypeModification {
  constructor(
    readonly previous: ProcessType,
    readonly next: ProcessType,
    readonly priceChange: PriceChangeDraft | null,
  ) {}

  get changed(): boolean {
    return this.previous !== this.next;
  }

  /** Si el nombre cambió de tal forma que hay que volver a comprobar su unicidad (la clave normalizada es otra). */
  nameKeyChanged(): boolean {
    return this.previous.getNameKey() !== this.next.getNameKey();
  }
}
