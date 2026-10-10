import { faker } from '@faker-js/faker';
import { getPrisma } from '../harness/test-app';
import { createFactory } from './factory.factory';

/**
 * Request body for POST /factories/{factoryId}/managers, with the field names
 * of the API contract (ManagerCreate.yaml). The factory goes in the path.
 */
export function aManagerBody(overrides: { name?: string; email?: string; phone?: string; role?: string } = {}) {
  return {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    phone: '+54 9 351 555-1234',
    role: 'Head of Purchasing',
    ...overrides,
  };
}

type ManagerOverrides = { factoryId?: number; name?: string; lastName?: string; phone?: string; mail?: string };

/**
 * Persists a manager (table `manager_customer`, Prisma model `Customer`).
 * `id` is per-factory and normally comes from the fn_gen_id_manager trigger;
 * Prisma has no default for it, so it is picked at random here.
 */
export async function createManager(overrides: ManagerOverrides = {}) {
  const factoryId = overrides.factoryId ?? (await createFactory()).id;

  return getPrisma().customer.create({
    data: {
      id: faker.number.int({ min: 1, max: 1_000_000 }),
      factoryId,
      name: overrides.name ?? faker.person.firstName(),
      lastName: overrides.lastName ?? faker.person.lastName(),
      phone: overrides.phone ?? '+54 9 351 555-1234',
      mail: overrides.mail ?? faker.internet.email(),
    },
  });
}
