import { faker } from '@faker-js/faker';
import { getPrisma } from '../harness/test-app';
import { createCategory } from './category-factory';

export interface FactoryPayload {
  name: string;
  cuit: string;
  address: string;
  paymentDescription?: string;
  categoryId: number;
}

export function aFactory(overrides: Partial<FactoryPayload> = {}) {
  return {
    name: faker.company.name(),
    cuit: '30-70987654-3',
    address: faker.location.streetAddress(),
    paymentDescription: 'Transferencia bancaria',
    categoryId: 1,
    ...overrides,
  };
}

type OverridesFactory = {
  name?: string;
  cuit?: string;
  address?: string;
  payMethod?: string | null;
  categoryId?: number;
  isActive?: boolean;
};

/**
 * Seeds a Factory row directly through Prisma. When no `categoryId` is given,
 * it creates a Category first (Factory.categoryId has an FK to Category).
 */
export async function createFactory(overrides: OverridesFactory = {}) {
  const categoryId = overrides.categoryId ?? (await createCategory()).id;

  return getPrisma().factory.create({
    data: {
      name: overrides.name ?? faker.company.name(),
      cuit: overrides.cuit ?? '30-70987654-3',
      address: overrides.address ?? faker.location.streetAddress(),
      payMethod: overrides.payMethod ?? 'Transferencia bancaria',
      categoryId,
      isActive: overrides.isActive ?? true,
    },
  });
}
