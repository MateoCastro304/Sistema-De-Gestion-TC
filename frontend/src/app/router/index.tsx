import { createBrowserRouter, Navigate } from 'react-router'
import { AppLayout } from '@/app/layouts/AppLayout'
import { SuppliersPage } from '@/features/catalogs/suppliers/pages/SuppliersPage'
import { NewSupplierPage } from '@/features/catalogs/suppliers/pages/NewSupplierPage'
import { SupplierDetailPage } from '@/features/catalogs/suppliers/pages/SupplierDetailPage'
import {
  CustomersPage,
  NewCustomerPage,
  CustomerDetailPage,
  FactoriesPage,
  NewFactoryPage,
  FactoryDetailPage,
} from '@/features/catalogs/customers'

export const router = createBrowserRouter([
  // The app has no landing page yet: send "/" to the customers catalog.
  { index: true, element: <Navigate to="/catalogos/encargados" replace /> },
  {
    path: '/catalogos/proveedores',
    element: <AppLayout />,
    children: [
      { index: true, element: <SuppliersPage /> },
      { path: 'nuevo', element: <NewSupplierPage /> },
      { path: ':id', element: <SupplierDetailPage /> },
    ],
  },
  {
    path: '/catalogos/encargados',
    element: <AppLayout />,
    children: [
      { index: true, element: <CustomersPage /> },
      { path: 'nuevo', element: <NewCustomerPage /> },
      // A customer is addressed by its composite key (factoryId, id): `id` is
      // only unique within a factory (DB `manager_customer(factory_id, id)`).
      { path: ':factoryId/:id', element: <CustomerDetailPage /> },
    ],
  },
  {
    path: '/catalogos/fabricas',
    element: <AppLayout />,
    children: [
      { index: true, element: <FactoriesPage /> },
      { path: 'nuevo', element: <NewFactoryPage /> },
      { path: ':id', element: <FactoryDetailPage /> },
    ],
  },
])
