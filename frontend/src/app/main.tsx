import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/styles.css'
import App from '@/app/App'
async function enableMocking() {
  if (!import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCKS !== 'true') return
  const { worker } = await import('@/mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass' })
}
enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
  )
})


