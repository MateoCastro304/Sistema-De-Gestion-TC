import { customerHandlers } from '@/features/catalogs/customers/api/customers.mocks'
import { supplierHandlers } from '@/features/catalogs/suppliers/api/suppliers.mocks'

/**
 * All MSW request handlers, aggregated. As more catalogs get mocked, spread
 * their handler arrays here.
 */
export const handlers = [...customerHandlers, ...supplierHandlers]
