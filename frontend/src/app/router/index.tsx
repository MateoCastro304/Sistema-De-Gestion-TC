import { createBrowserRouter, Navigate } from 'react-router'
import { AppLayout } from '@/app/layouts/AppLayout'
import { ErrorPage } from '@/app/router/ErrorPage'
import { NotFoundPage } from '@/app/router/NotFoundPage'
import {
  SuppliersPage,
  NewSupplierPage,
  SupplierDetailPage,
} from '@/features/catalogs/suppliers'
import {
  CustomersPage,
  NewCustomerPage,
  CustomerDetailPage,
  FactoriesPage,
  NewFactoryPage,
  FactoryDetailPage,
} from '@/features/catalogs/customers'
import {
  ProcessTypesPage,
  NewProcessTypePage,
  ProcessTypeDetailPage,
} from '@/features/catalogs/process-types'
import { CategoriesPage } from '@/features/catalogs/categories'
import { PanelPage } from '@/features/catalogs/panels'

export const router = createBrowserRouter([
  // The app has no landing page yet: send "/" to the Clientes panel.
  { index: true, element: <Navigate to="/catalogos/clientes" replace /> },
  {
    // Un solo layout para toda la app. Antes cada sección montaba el suyo y
    // al cambiar de sección el menú se volvía a crear (perdía, por ejemplo,
    // si estaba colapsado).
    element: <AppLayout />,
    // Si lo que falla es el layout no hay marco donde mostrar el error.
    errorElement: <ErrorPage standalone />,
    children: [
      {
        // Ruta sin path ni pantalla propia: sólo existe para atrapar los
        // errores de las pantallas de abajo SIN perder el layout. El menú
        // sigue a la vista y se puede salir del error navegando.
        errorElement: <ErrorPage />,
        children: [
          // Paneles de tarjetas: la puerta a los listados de cada grupo.
          { path: '/catalogos/clientes', element: <PanelPage panel="clientes" /> },
          { path: '/catalogos/gestion', element: <PanelPage panel="gestion" /> },
          {
            path: '/catalogos/proveedores',
            children: [
              { index: true, element: <SuppliersPage /> },
              { path: 'nuevo', element: <NewSupplierPage /> },
              { path: ':id', element: <SupplierDetailPage /> },
            ],
          },
          {
            path: '/catalogos/encargados',
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
            children: [
              { index: true, element: <FactoriesPage /> },
              { path: 'nuevo', element: <NewFactoryPage /> },
              { path: ':id', element: <FactoryDetailPage /> },
            ],
          },
          {
            path: '/catalogos/rubros',
            children: [{ index: true, element: <CategoriesPage /> }],
          },
          {
            path: '/catalogos/tipos-de-proceso',
            children: [
              { index: true, element: <ProcessTypesPage /> },
              { path: 'nuevo', element: <NewProcessTypePage /> },
              { path: ':id', element: <ProcessTypeDetailPage /> },
            ],
          },
          // Cualquier otra URL.
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])
