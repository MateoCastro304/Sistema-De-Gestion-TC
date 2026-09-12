import { faker } from '@faker-js/faker';

/**
 * Uncomment when CreateSupplierDTO has implemented
 */
// import { CreateSupplierDto } from '../../../src/suppliers/dto/create-supplier.dto';

export interface SupplierPayload {
  legalName: string;
  taxId: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  type: string;
}

export function aSupplier(overrides: Partial<SupplierPayload> = {}) {
  return {
    legalName: faker.company.name(),
    taxId: '30-70987654-3',
    contactName: faker.person.fullName(),
    contactEmail: faker.internet.email(),
    contactPhone: '+54 9 351 444-5678',
    address: faker.location.streetAddress(),
    type: 'MATERIAL',
    ...overrides,
  };
}
