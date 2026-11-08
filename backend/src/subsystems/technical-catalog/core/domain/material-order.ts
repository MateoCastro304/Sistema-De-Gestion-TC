import { Material } from './entities/material.entity';

/**
 * Orden natural: los números se comparan como números, así "SAE 9" va antes
 * que "SAE 10" y "1010" antes que "1045". Lo aplica la aplicación y no la base
 * (docs/database/cambios-bdd-sprint2.md, DV-4): el catálogo tiene decenas de filas.
 */
const collator = new Intl.Collator('es', { numeric: true, sensitivity: 'base' });

/** Compara dos claves de texto ya normalizadas, con orden natural. */
export function compareKeys(a: string, b: string): number {
  return collator.compare(a, b);
}

/** Orden del listado de materiales (CU-39): por nombre y, dentro de cada nombre, por calidad. */
export function compareMaterials(a: Material, b: Material): number {
  return (
    compareKeys(a.getNameKey(), b.getNameKey()) ||
    compareKeys(a.getQualityKey(), b.getQualityKey()) ||
    (a.getId() ?? 0) - (b.getId() ?? 0)
  );
}
