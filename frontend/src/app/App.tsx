import { RouterProvider } from 'react-router'
import { QueryProvider } from '@/app/providers/QueryProvider'
import { ToastProvider } from '@/app/providers/ToastProvider'
import { SessionProvider } from '@/app/providers/SessionProvider'
import { router } from '@/app/router'

/**
 * De que esta compuesta la app: los providers que envuelven todo y, adentro,
 * el router.
 */
function App() {
  return (
    // Avisos
    <ToastProvider>
      {/* Caché y peticiones */}
      <QueryProvider>
        {/* Usuario logueado */}
        <SessionProvider>
          {/* Qué pantalla mostrar */}
          <RouterProvider router={router} />
        </SessionProvider>
      </QueryProvider>
    </ToastProvider>
  )
}

export default App