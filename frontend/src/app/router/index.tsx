import { createBrowserRouter, Navigate } from 'react-router'
import { AppLayout } from '@/app/layouts/AppLayout'
import { SuppliersPage } from '@/features/catalogs/suppliers/pages/SuppliersPage'
import { NewSupplierPage } from '@/features/catalogs/suppliers/pages/NewSupplierPage'
import { SupplierDetailPage } from '@/features/catalogs/suppliers/pages/SupplierDetailPage'
import {
  CustomersPage,
  NewCustomerPage,
  CustomerDetailPage,
} from '@/features/catalogs/customers'

export const router = createBrowserRouter([
  // The app has no landing page yet: send "/" to the customers catalog.
  { index: true, element: <Navigate to="/catalogs/customers" replace /> },
  {
    path: '/catalogs/suppliers',
    element: <AppLayout />,
    children: [
      { index: true, element: <SuppliersPage /> },
      { path: 'new', element: <NewSupplierPage /> },
      { path: ':id', element: <SupplierDetailPage /> },
    ],
  },
  {
    path: '/catalogs/customers',
    element: <AppLayout />,
    children: [
      { index: true, element: <CustomersPage /> },
      { path: 'new', element: <NewCustomerPage /> },
      { path: ':id', element: <CustomerDetailPage /> },
    ],
  },
])
