import { faker } from '@faker-js/faker';
import { getPrisma } from '../harness/test-app';

type CategoryOverrides = { name?: string; isActive?: boolean };

/** Unique by construction: Category.name is unique across the system. */
function uniqueName(): string {
  return `${faker.commerce.department()} ${faker.string.alphanumeric(6)}`;
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
