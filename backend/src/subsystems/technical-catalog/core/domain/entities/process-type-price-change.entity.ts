/** Quién hizo un cambio de precio. El nombre de usuario se conoce recién al leer el registro guardado. */
export type PriceChangeAuthor = { id: number; username: string | null };

/** Datos de un cambio de precio nuevo, para {@link ProcessTypePriceChange.create}. */
export type NewProcessTypePriceChange = {
  changedAt: Date;
  changedByUserId: number;
  exchangeRate: number;
  previousValueUsd: number;
  newValueUsd: number;
};

/** Una fila del historial, para {@link ProcessTypePriceChange.reconstruct}. */
export type ProcessTypePriceChangeSnapshot = {
  id: number;
  changedAt: Date;
  changedBy: { id: number; username: string };
  exchangeRate: number;
  previousValueUsd: number;
  newValueUsd: number;
};

/**
 * Registro inmutable de una modificación que cambió algún precio hora (D-32,
 * RNF10). Se crea una sola vez, al modificar el tipo de proceso, y después solo
 * se lee: no tiene operaciones de cambio ni de borrado. Los dos valores van
 * siempre en dólares.
 *
 * Igual que `ProcessType`: `create` arma el registro nuevo (sin id, que lo
 * asigna la base) y `reconstruct` rehidrata uno guardado.
 */
export class ProcessTypePriceChange {
  private constructor(
    private readonly id: number | null,
    private readonly changedAt: Date,
    private readonly changedBy: PriceChangeAuthor,
    private readonly exchangeRate: number,
    private readonly previousValueUsd: number,
    private readonly newValueUsd: number,
  ) {}

  static create(data: NewProcessTypePriceChange): ProcessTypePriceChange {
    return new ProcessTypePriceChange(
      null,
      data.changedAt,
      { id: data.changedByUserId, username: null },
      data.exchangeRate,
      data.previousValueUsd,
      data.newValueUsd,
    );
  }

  static reconstruct(snapshot: ProcessTypePriceChangeSnapshot): ProcessTypePriceChange {
    return new ProcessTypePriceChange(
      snapshot.id,
      snapshot.changedAt,
      snapshot.changedBy,
      snapshot.exchangeRate,
      snapshot.previousValueUsd,
      snapshot.newValueUsd,
    );
  }

  getId(): number | null {
    return this.id;
  }
  getChangedAt(): Date {
    return this.changedAt;
  }
  getChangedBy(): PriceChangeAuthor {
    return this.changedBy;
  }
  getExchangeRate(): number {
    return this.exchangeRate;
  }
  getPreviousValueUsd(): number {
    return this.previousValueUsd;
  }
  getNewValueUsd(): number {
    return this.newValueUsd;
  }
}
