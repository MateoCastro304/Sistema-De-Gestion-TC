import { getPrisma } from '../harness/test-app';
import { createFactory } from './factory.factory';

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

type ManagerBodyOverrides = {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  mail?: string | null;
};

/**
 * Request body for POST /factories/{factoryId}/managers, with the field
 * names del CreateManagerDto real (firstName, lastName, phone, mail). El
 * factoryId va en el path, no en el cuerpo.
 */
export function aManagerBody(overrides: ManagerBodyOverrides = {}) {
  const n = nextSequence();
  return {
    firstName: `Encargado${n}`,
    lastName: `Apellido${n}`,
    phone: '+54 9 351 555-1234',
    mail: `encargado${n}@proveedor.test`,
    ...overrides,
  };
}

type ManagerOverrides = { factoryId?: number; name?: string; lastName?: string; phone?: string; mail?: string };

/**
 * Persists a manager (table `manager_customer`, Prisma model `Customer`).
 * `id` is per-factory and normally comes from the fn_gen_id_manager trigger;
 * Prisma has no default for it, so se elige con un offset alto para no
 * chocar con los ids secuenciales que el trigger asigna por fábrica.
 */
export async function createManager(overrides: ManagerOverrides = {}) {
  const factoryId = overrides.factoryId ?? (await createFactory()).id;
  const n = nextSequence();

  return getPrisma().customer.create({
    data: {
      id: 500_000 + n,
      factoryId,
      name: overrides.name ?? `Encargado ${n}`,
      lastName: overrides.lastName ?? `Apellido ${n}`,
      phone: overrides.phone ?? '+54 9 351 555-1234',
      mail: overrides.mail ?? `encargado${n}@proveedor.test`,
    },
  });
}
