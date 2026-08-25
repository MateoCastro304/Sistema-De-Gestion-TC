import { RouterProvider } from 'react-router'
import { QueryProvider } from '@/app/providers/QueryProvider'
import { ToastProvider } from '@/app/providers/ToastProvider'
import { router } from '@/app/router'

/**
 * De que esta compuesta la app: los providers que envuelven todo y, adentro,
 * el router. Cuando exista el AuthProvider va en esta misma pila.
 */
function App() {
  return (
    <ToastProvider>
      <QueryProvider>
        <RouterProvider router={router} />
      </QueryProvider>
    </ToastProvider>
  )
}

export default App
