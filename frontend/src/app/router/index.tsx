import { createBrowserRouter} from 'react-router'
import { SuppliersPage } from '@/features/catalogs/suppliers/pages/SuppliersPage'
import { NewSupplierPage } from '@/features/catalogs/suppliers/pages/NewSupplierPage'
import { SupplierDetailPage } from '@/features/catalogs/suppliers/pages/SupplierDetailPage'
import { AppLayout } from '@/app/layouts/AppLayout'

export const router = createBrowserRouter([
    {path: '/catalogs/suppliers', element: <AppLayout />,
    children: [
        { index: true, element: <SuppliersPage /> },
        { path: 'new', element: <NewSupplierPage /> },
        { path: ':id', element: <SupplierDetailPage /> },
    ],
}
])