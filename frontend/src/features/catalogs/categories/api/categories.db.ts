import type { Category } from '../types/category'

/**
 * Tabla de rubros del mock. La lee también el mock de Fábricas: una fábrica
 * sólo se registra con un rubro activo. Se resetea al recargar la página.
 */

const SEED_DATE = '2026-08-01T12:00:00.000Z'

let seedId = 1
const seed = (name: string, active = true): Category => ({
  id: seedId++,
  name,
  active,
  createdAt: SEED_DATE,
  updatedAt: SEED_DATE,
})

export const categoriesDb = {
  categories: [
    seed('Particular'),
    seed('Metalúrgica'),
    seed('Autopartes'),
    seed('Agroindustria'),
    seed('Petróleo y gas'),
    // Dado de baja: crear "Fundición" lo reactiva.
    seed('Fundición', false),
  ],
  nextId: seedId,
}

export function findCategory(id: number): Category | undefined {
  return categoriesDb.categories.find((c) => c.id === id)
}
