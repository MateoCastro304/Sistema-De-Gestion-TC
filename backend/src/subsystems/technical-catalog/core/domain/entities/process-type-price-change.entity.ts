/** Quién hizo un cambio de precio. */
export type PriceChangeAuthor = { id: number; username: string };

/** Una fila del historial, para {@link ProcessTypePriceChange.reconstruct}. */
export type ProcessTypePriceChangeSnapshot = {
  id: number;
  changedAt: Date;
  changedBy: PriceChangeAuthor;
  exchangeRate: number;
  previousValueUsd: number;
  newValueUsd: number;
};

/**
 * Registro inmutable de una modificación que cambió algún precio hora (D-32,
 * RNF10). Solo se lee: no tiene operaciones de cambio ni de borrado. Los dos
 * valores van siempre en dólares.
 */
export class ProcessTypePriceChange {
  private constructor(
    private readonly id: number,
    private readonly changedAt: Date,
    private readonly changedBy: PriceChangeAuthor,
    private readonly exchangeRate: number,
    private readonly previousValueUsd: number,
    private readonly newValueUsd: number,
  ) {}

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

  getId(): number {
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
