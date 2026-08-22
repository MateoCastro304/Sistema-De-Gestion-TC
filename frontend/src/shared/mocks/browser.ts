import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

/**
 * Service-worker-based mock server for the browser. Started from `main.tsx`
 * only when `VITE_USE_MOCKS === 'true'`, so production builds never ship it.
 */
export const worker = setupWorker(...handlers)
