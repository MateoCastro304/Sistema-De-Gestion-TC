import { customerHandlers } from '@/features/catalogs/customers/api/customers.mocks'
import { categoryHandlers } from '@/features/catalogs/categories/api/categories.mocks'

/**
 * All MSW request handlers, aggregated. As more catalogs get mocked, spread
 * their handler arrays here.
 */
export const handlers = [...customerHandlers, ...categoryHandlers]
