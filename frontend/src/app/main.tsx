import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/styles.css'
import App from '@/app/App'
async function enableMocking() {
  if (!import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCKS !== 'true') return
  const { worker } = await import('@/mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass' })
}
enableMocking()
  .catch((error: unknown) => {
    // El catch va antes del then para que la app renderice igual: si falla el
    // Service Worker, sin esto quedaria una pantalla en blanco sin explicacion.
    console.error(
      '[mocks] No se pudieron iniciar; la app arranca sin ellos y los ' +
        'requests van a salir al backend real.',
      error,
    )
  })
  .then(() => {
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })


