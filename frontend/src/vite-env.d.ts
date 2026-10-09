/**
 * ESTO ES PARA EL LINTER (EsLint)
 * Variables de entorno del frontend (ver .env.example). Sin esta declaración
 * `import.meta.env.VITE_*` es `any` y un nombre mal escrito no avisa.
 */
interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_USE_MOCKS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
