import { faker } from '@faker-js/faker';
import { SupplierType } from '../../../src/generated/prisma/enums';
import { getPrisma } from '../harness/test-app';
import { aTaxId } from './factory.factory';

type SupplierBodyOverrides = {
  legalName?: string;
  supplierTypes?: string[];
  cuit?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
};

/** Request body for POST /suppliers, with the field names of SupplierCreate.yaml. */
export function aSupplierBody(overrides: SupplierBodyOverrides = {}) {
  return {
    legalName: `${faker.company.name()} ${faker.string.alphanumeric(4)}`,
    supplierTypes: ['MATERIAL'],
    cuit: aTaxId(),
    contactName: faker.person.fullName(),
    contactEmail: faker.internet.email(),
    contactPhone: '+54 9 351 444-5678',
    address: faker.location.streetAddress(),
    ...overrides,
  };
}

type SupplierOverrides = { legalName?: string; supplierType?: SupplierType; cuit?: string | null; isActive?: boolean };

/**
 * Persists a supplier. NOTE: the Prisma model holds a single `supplierType`
 * while the contract exposes `supplierTypes[]` (known gap).
 */
export async function createSupplier(overrides: SupplierOverrides = {}) {
  return getPrisma().supplier.create({
    data: {
      legalName: overrides.legalName ?? `${faker.company.name()} ${faker.string.alphanumeric(4)}`,
      supplierType: overrides.supplierType ?? SupplierType.MATERIAL,
      cuit: overrides.cuit === undefined ? aTaxId() : overrides.cuit,
      isActive: overrides.isActive ?? true,
    },
  });
}
