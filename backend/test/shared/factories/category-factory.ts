import { faker } from '@faker-js/faker';
import { getPrisma } from '../harness/test-app';

export interface CategoryPayload {
  name: string;
}

export function aCategory(overrides: Partial<CategoryPayload> = {}) {
  return {
    name: faker.commerce.department(),
    ...overrides,
  };
}

type OverridesCategory = {
  name?: string;
  isActive?: boolean;
};

export async function createCategory(overrides: OverridesCategory = {}) {
  return getPrisma().category.create({
    data: {
      name: overrides.name ?? faker.commerce.department(),
      isActive: overrides.isActive ?? true,
    },
  });
}
