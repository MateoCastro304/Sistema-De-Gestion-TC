import { TextKey } from '../../../src/shared/domain/text-key';
import { getPrisma } from '../harness/test-app';

/**
 * Prefijo con el que empiezan todos los materiales de estas pruebas. Sirve para
 * buscarlos y para limpiarlos sin tocar a los de otras suites: la base se comparte.
 */
export const TEST_MATERIAL_PREFIX = 'Zzmat';

/** Cuerpo de `POST /materials` con los nombres del contrato. No toca la base. */
export function aMaterialBody(overrides: Record<string, unknown> = {}) {
  return { name: `${TEST_MATERIAL_PREFIX} Acero`, quality: '4140', ...overrides };
}

/** Guarda un material con Prisma: el estado previo que necesita la prueba. */
export function createMaterial(name: string, quality: string) {
  return getPrisma().material.create({
    data: {
      name,
      quality,
      nameKey: TextKey.create(name).getValue(),
      qualityKey: TextKey.create(quality).getValue(),
    },
  });
}

/** Cuántos materiales hay con esa combinación de claves. */
export function countMaterials(name: string, quality: string): Promise<number> {
  return getPrisma().material.count({
    where: { nameKey: TextKey.create(name).getValue(), qualityKey: TextKey.create(quality).getValue() },
  });
}

/**
 * Borra los materiales de estas pruebas. Hay que correrlo antes de cerrar la
 * app: los materiales apuntan al usuario que los creó y `stopTestApp` borra los usuarios.
 */
export async function deleteTestMaterials(): Promise<void> {
  await getPrisma().material.deleteMany({
    where: { nameKey: { startsWith: TextKey.create(TEST_MATERIAL_PREFIX).getValue() } },
  });
}
