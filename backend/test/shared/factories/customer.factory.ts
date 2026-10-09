import { faker } from '@faker-js/faker';
import { createManager } from './manager.factory';

type CustomerBodyOverrides = {
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  mail?: string | null;
  hasWhatsapp?: boolean;
};

/**
 * Request body for POST /factories/{factoryId}/customers, with the field
 * names of docs/openapi/customers.yaml (CustomerInput). The factory goes in
 * the path. Does not touch the database.
 */
export function aCustomerBody(overrides: CustomerBodyOverrides = {}) {
  return {
    firstName: faker.person.firstName(),
    lastName: faker.person.lastName(),
    phone: '+54 9 351 444-5678',
    mail: faker.internet.email().toLowerCase(),
    ...overrides,
  };
}

/**
 * Persists a customer (table `manager_customer`). Creates a Factory first
 * when no `factoryId` is given. Same table as createManager().
 */
export async function createCustomer(
  overrides: { factoryId?: number; name?: string; lastName?: string; phone?: string; mail?: string } = {},
) {
  return createManager(overrides);
}
