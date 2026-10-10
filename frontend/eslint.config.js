import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

/**
 * ESLint del frontend (React + Vite, organizado por features).
 *
 * Criterios:
 * - Cada regla es 'error' u 'off'. El script de lint corre con
 *   --max-warnings 0, asi que los 'warn' de los plugins tambien frenan el CI.
 * - Lint con tipos (recommendedTypeChecked): detecta promesas sin manejar,
 *   que en una SPA con React Query y react-hook-form son el bug mas comun.
 * - Lo que ya chequea tsc (imports de tipos, locals sin usar) no se repite aca.
 */

// Carpetas internas de un feature. Desde afuera solo se entra por su index.ts.
const featureInternals = '^@/features/.+/(api|components|pages|schemas|types|utils)(/|$)'

export default defineConfig([
  globalIgnores([
    'dist',
    'coverage',
    // Generado por MSW (`msw init`) y regenerado en cada npm install: no se toca ni se lintea.
    'public/mockServiceWorker.js',
  ]),
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
  },

  // --- Codigo de la app -----------------------------------------------------
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-misused-promises': [
        'error',
        // onSubmit={handleSubmit(fn)} y onClick={async () => ...} son el patron
        // normal de React: el handler devuelve una promesa que React ignora.
        // Seguimos chequeando el resto (ej: un if con una promesa adentro).
        { checksVoidReturn: { attributes: false } },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },

  // --- Limites entre capas --------------------------------------------------
  // app/      -> composicion (router, providers, layout). Puede usar todo.
  // features/ -> un modulo por caso de negocio. Usa shared/ y domain/, y otros
  //              features solo por su index.ts. De app/ solo puede usar
  //              app/providers (contextos: notificaciones, usuario).
  // shared/   -> reutilizable y sin negocio. No conoce features ni app.
  // domain/   -> tipos/reglas del negocio compartidos. No conoce nada mas.
  // Para salir de tu carpeta se usa el alias @/, nunca ../../
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../../*'],
              message: 'Para salir de tu carpeta usa el alias @/ (asi las reglas de capas pueden verlo).',
            },
            {
              regex: featureInternals,
              message: 'Importa el feature por su index.ts (@/features/...), no sus archivos internos.',
            },
          ],
        },
      ],
    },
  },
  {
    // app/mocks junta los *.mocks.ts de cada feature y es la unica excepcion a
    // "entrar por el index.ts": si los mocks se exportaran desde el index, MSW
    // y los datos falsos terminarian en el bundle de produccion.
    files: ['src/app/mocks/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../../*'],
              message: 'Para salir de tu carpeta usa el alias @/ (asi las reglas de capas pueden verlo).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['../../*'], message: 'Para salir de tu carpeta usa el alias @/.' },
            {
              regex: featureInternals,
              message: 'Importa el feature por su index.ts (@/features/...), no sus archivos internos.',
            },
            {
              // La negacion deja pasar app/providers: son los contextos
              // (notificaciones, usuario) que los features consumen por hook.
              group: ['@/app/*', '!@/app/providers'],
              message:
                'Un feature solo puede usar app/providers. Si lo necesitan varios features, va en shared/.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/shared/**/*.{ts,tsx}', 'src/domain/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['../../*'], message: 'Para salir de tu carpeta usa el alias @/.' },
            {
              group: ['@/app/*', '@/features/*'],
              message: 'shared/ y domain/ no pueden depender de app/ ni de features/.',
            },
          ],
        },
      ],
    },
  },

  // --- Config de herramientas (Node, no navegador) --------------------------
  {
    files: ['vite.config.ts'],
    extends: [js.configs.recommended, tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    extends: [js.configs.recommended],
    languageOptions: {
      globals: globals.node,
    },
  },
])
