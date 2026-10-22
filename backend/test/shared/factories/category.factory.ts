import { getPrisma } from '../harness/test-app';

type CategoryOverrides = { name?: string; isActive?: boolean };

/**
 * Contador en vez de faker: bajo --experimental-vm-modules (que exige el
 * compilador wasm de Prisma 7) el bundle de @faker-js/faker falla con
 * "exports is not defined". Ver supplier-factory.ts para el detalle.
 */
let sequence = 0;

function nextSequence(): number {
  sequence += 1;
  return sequence;
}

/** Unique by construction: Category.name is unique across the system. */
function uniqueName(): string {
  return `Rubro de Prueba ${nextSequence()}`;
}

/** Request body for POST /categories. Does not touch the database. */
export function aCategoryBody(overrides: { name?: string } = {}) {
  return { name: uniqueName(), ...overrides };
}

/** Persists a category. Use it for "given that a category already exists". */
export async function createCategory(overrides: CategoryOverrides = {}) {
  return getPrisma().category.create({
    data: { name: overrides.name ?? uniqueName(), isActive: overrides.isActive ?? true },
  });
}
