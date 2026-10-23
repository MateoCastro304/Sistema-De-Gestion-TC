import { ProcessTypePriceChange } from '../../core/domain/entities/process-type-price-change.entity';

export type ProcessTypeHistoryResponseBody = {
  items: {
    id: number;
    changedAt: string;
    changedBy: { id: number; username: string };
    exchangeRate: number;
    previousValueUsd: number;
    newValueUsd: number;
  }[];
};

/** Arma la respuesta de GET /process-types/{id}/history (§3.4): la lista completa, sin paginar. */
export class ProcessTypeHistoryResponse {
  static from(changes: ProcessTypePriceChange[]): ProcessTypeHistoryResponseBody {
    return {
      items: changes.map((change) => ({
        id: change.getId()!,
        changedAt: change.getChangedAt().toISOString(),
        // Un registro leído de la base siempre trae el usuario.
        changedBy: { id: change.getChangedBy().id, username: change.getChangedBy().username! },
        exchangeRate: change.getExchangeRate(),
        previousValueUsd: change.getPreviousValueUsd(),
        newValueUsd: change.getNewValueUsd(),
      })),
    };
  }
}
