import { Material } from '../entities/material.entity';

/** Parámetros del listado. `name` y `quality` son los textos tal como los escribió el usuario. */
export type MaterialListParams = { page: number; limit: number; name?: string; quality?: string };

/** Una página de materiales con el total que cumple los filtros. */
export type MaterialListResult = { items: Material[]; total: number };

export abstract class MaterialRepository {
  /** Si ya hay un material con esa combinación de claves de nombre y calidad (D-36). */
  abstract existsByKeys(nameKey: string, qualityKey: string): Promise<boolean>;

  /** La grafía con que se guardó el nombre que tiene esa clave, o `null` si todavía no existe (D-37). */
  abstract findNameByKey(nameKey: string): Promise<string | null>;

  /**
   * Listado ordenado por nombre y, dentro de cada nombre, por calidad con orden
   * natural. `name` filtra por coincidencia exacta y `quality` por texto
   * contenido, los dos sin distinguir mayúsculas ni acentos. El total es el del
   * conjunto filtrado.
   */
  abstract list(params: MaterialListParams): Promise<MaterialListResult>;

  /** Los nombres de material distintos, en orden alfabético (D-38). */
  abstract listNames(): Promise<string[]>;

  /**
   * Inserta el material y devuelve el guardado, con id y fecha.
   * Lanza MaterialAlreadyExists si otra alta simultánea ganó la combinación.
   */
  abstract save(material: Material): Promise<Material>;
}
