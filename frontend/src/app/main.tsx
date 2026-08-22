import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/styles.css'
import App from '@/app/App'

/**
 * Starts the MSW mock server before rendering, but only when
 * VITE_USE_MOCKS === 'true'. Dynamically imported so the mock code is never
 * bundled into production builds.
 */
async function enableMocking() {
  if (import.meta.env.VITE_USE_MOCKS !== 'true') return
  const { worker } = await import('@/shared/mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass' })
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
