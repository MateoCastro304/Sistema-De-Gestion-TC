import { faker } from '@faker-js/faker';
import { getPrisma } from '../harness/test-app';
import { createCategory } from './category.factory';

/** Valid, unique CUIT as 11 digits (check digit included). */
export function aCuitDigits(): string {
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  for (;;) {
    const base = `30${faker.string.numeric({ length: 8, allowLeadingZeros: true })}`;
    const sum = [...base].reduce((acc, d, i) => acc + Number(d) * weights[i], 0);
    const check = 11 - (sum % 11);
    if (check === 10) continue; // no valid check digit for this base
    return `${base}${check === 11 ? 0 : check}`;
  }
}

/** Same CUIT in the contract format XX-XXXXXXXX-X. */
export function aTaxId(): string {
  const d = aCuitDigits();
  return `${d.slice(0, 2)}-${d.slice(2, 10)}-${d.slice(10)}`;
}

type FactoryBodyOverrides = { legalName?: string; taxId?: string; categoryId?: number; address?: string };

/**
 * Request body for POST /factories, with the field names of the API contract
 * (FactoryCreate.yaml). `categoryId` has no valid default: pass the id of a
 * category created with createCategory().
 */
export function aFactoryBody(overrides: FactoryBodyOverrides = {}) {
  return {
    legalName: faker.company.name(),
    taxId: aTaxId(),
    categoryId: 1,
    address: faker.location.streetAddress(),
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

  return getPrisma().factory.create({
    data: {
      name: overrides.name ?? faker.company.name(),
      cuit: overrides.cuit ?? aCuitDigits(),
      address: overrides.address ?? faker.location.streetAddress(),
      categoryId,
      isActive: overrides.isActive ?? true,
    },
  });
}
