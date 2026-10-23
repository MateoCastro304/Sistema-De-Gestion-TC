import { ProcessType } from '../entities/process-type.entity';

export abstract class ProcessTypeRepository {
  /** Si ya hay un tipo de proceso con esa clave de nombre (sin mayúsculas, acentos ni espacios repetidos). */
  abstract existsByNameKey(nameKey: string): Promise<boolean>;

  /**
   * Inserta el tipo de proceso y devuelve el guardado, con id y fechas.
   * Lanza ProcessTypeNameTaken si otro alta simultánea ganó el nombre.
   */
  abstract save(processType: ProcessType): Promise<ProcessType>;
}
