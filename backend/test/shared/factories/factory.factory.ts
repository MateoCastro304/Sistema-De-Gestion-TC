import { getPrisma } from '../harness/test-app';
import { createCategory } from './category.factory';

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

const CUIT_WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

/** Mismo algoritmo que el value object Cuit de shared/domain. */
function checkDigit(firstTen: string): number | null {
  const sum = [...firstTen].reduce((acc, digit, i) => acc + Number(digit) * CUIT_WEIGHTS[i], 0);
  const check = 11 - (sum % 11);

  if (check === 11) return 0;
  if (check === 10) return null;
  return check;
}

let cuitSequence = 0;

/** Valid, unique CUIT as 11 digits (check digit included). */
export function aCuitDigits(): string {
  for (;;) {
    cuitSequence += 1;
    const body = String(cuitSequence).padStart(8, '0');
    const check = checkDigit(`30${body}`);

    if (check !== null) return `30${body}${check}`;
  }
}

/** Same CUIT in the contract format XX-XXXXXXXX-X. */
export function aCuit(): string {
  const d = aCuitDigits();
  return `${d.slice(0, 2)}-${d.slice(2, 10)}-${d.slice(10)}`;
}

type FactoryBodyOverrides = { legalName?: string; cuit?: string; categoryId?: number; address?: string };

/**
 * Request body for POST /factories, with the field names of the API contract
 * (FactoryCreate.yaml). `categoryId` has no valid default: pass the id of a
 * category created with createCategory().
 */
export function aFactoryBody(overrides: FactoryBodyOverrides = {}) {
  const n = nextSequence();
  return {
    legalName: `Fabrica de Prueba ${n}`,
    cuit: aCuit(),
    categoryId: 1,
    address: `Av. Siempre Viva ${n}`,
    ...overrides,
  };
}

type FactoryOverrides = { name?: string; cuit?: string; categoryId?: number; address?: string; isActive?: boolean };

/**
 * Persists a factory. The CUIT is stored as 11 digits, which is how the
 * backend normalises it. Creates a Category first when none is given.
 */
export async function createFactory(overrides: FactoryOverrides = {}) {
  const categoryId = overrides.categoryId ?? (await createCategory()).id;
  const n = nextSequence();

  return getPrisma().factory.create({
    data: {
      name: overrides.name ?? `Fabrica Almacenada ${n}`,
      cuit: overrides.cuit ?? aCuitDigits(),
      address: overrides.address ?? `Av. Siempre Viva ${n}`,
      categoryId,
      isActive: overrides.isActive ?? true,
    },
  });
}
