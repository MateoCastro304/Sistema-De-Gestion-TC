import { PriceChangeDraft, ProcessTypeModification } from '../entities/process-type-modification';
import { ProcessTypePriceChange } from '../entities/process-type-price-change.entity';
import { ProcessType } from '../entities/process-type.entity';

/** Parámetros del listado. `search` es el texto tal como lo escribió el usuario. */
export type ProcessTypeListParams = { page: number; limit: number; search?: string };

/** Una página de tipos de proceso con el total que cumple el filtro. */
export type ProcessTypeListResult = { items: ProcessType[]; total: number };

export abstract class ProcessTypeRepository {
  /**
   * Si ya hay un tipo de proceso con esa clave de nombre (sin mayúsculas, acentos ni espacios repetidos).
   * `excludeId` deja afuera al tipo que se está modificando, para que no choque consigo mismo.
   */
  abstract existsByNameKey(nameKey: string, excludeId?: number): Promise<boolean>;

  abstract findById(id: number): Promise<ProcessType | null>;

  /**
   * Listado ordenado por nombre. `search` filtra los que contienen el texto,
   * sin distinguir mayúsculas ni acentos. El total es el del conjunto filtrado.
   */
  abstract list(params: ProcessTypeListParams): Promise<ProcessTypeListResult>;

  /** Historial de precios del más reciente al más antiguo; vacío si nunca cambió de precio. */
  abstract findPriceHistory(processTypeId: number): Promise<ProcessTypePriceChange[]>;

  /**
   * Inserta el tipo de proceso y devuelve el guardado, con id y fechas.
   * Lanza ProcessTypeNameTaken si otro alta simultánea ganó el nombre.
   */
  abstract save(processType: ProcessType): Promise<ProcessType>;

  /**
   * Guarda `modification.next` solo si el tipo de proceso sigue como estaba en
   * `modification.previous` (condición sobre los valores previos, en una sola
   * escritura). Devuelve `false` si otro cambio se adelantó y no se escribió nada.
   * Lanza ProcessTypeNameTaken si el nombre nuevo ya es de otro tipo.
   */
  abstract updateIfUnchanged(modification: ProcessTypeModification): Promise<boolean>;

  /**
   * Agrega un registro al historial de precios (RNF10: es la única operación de
   * escritura sobre él; no se modifica ni se borra). Lanza ChangeAuthorUnknown si
   * el usuario no existe.
   */
  abstract addPriceChange(
    processTypeId: number,
    priceChange: PriceChangeDraft,
    authorId: number,
    changedAt: Date,
  ): Promise<void>;
}
