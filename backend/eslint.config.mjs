// @ts-check
import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * ESLint del backend (NestJS, arquitectura hexagonal por modulo).
 *
 * Criterios:
 * - Cada regla es 'error' u 'off'. Nada de 'warn': el CI corre con
 *   --max-warnings 0, asi que un warning que nadie mira no sirve.
 * - El formato es cosa de Prettier (`npm run format:check`), no de ESLint.
 *   eslint-config-prettier apaga las reglas de estilo que chocarian con el.
 * - Lint con tipos (recommendedTypeChecked): necesita src/generated (Prisma).
 *   Si falta, correr `npm run prisma:generate` antes; en CI tambien.
 */

// Capas de cada modulo: src/<modulo>/{domain,application,http,infrastructure}.
// Las dependencias apuntan hacia adentro: http/infrastructure -> application -> domain.
const frameworkPackages = [
  '@nestjs/*',
  '@prisma/*',
  'class-validator',
  'class-transformer',
  'express',
  'rxjs',
];

export default tseslint.config(
  {
    ignores: ['dist/**', 'coverage/**', 'src/generated/**'],
  },
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
  },

  eslint.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Nest depende de promesas en todos lados: una promesa sin await es un
      // error que se pierde en silencio (o tumba el proceso).
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      // Los repos in-memory implementan puertos async sin necesitar await.
      // Marcarlos no encuentra bugs, solo obliga a escribir Promise.resolve().
      '@typescript-eslint/require-await': 'off',
      // OJO: no activar consistent-type-imports. Con emitDecoratorMetadata,
      // convertir un import de clase inyectada en `import type` rompe la DI
      // de Nest en runtime (el tipo desaparece del metadata).
    },
  },

  // --- Limites de la arquitectura hexagonal ---------------------------------
  {
    // domain: TypeScript puro. No conoce el framework, la base ni las otras capas.
    files: ['src/**/domain/**/*.ts'],
    ignores: ['**/*.spec.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/application/**', '**/http/**', '**/infrastructure/**', '**/generated/**'],
              message: 'domain no puede depender de otras capas.',
            },
            {
              group: frameworkPackages,
              message: 'domain no puede depender del framework ni de librerias de infraestructura.',
            },
          ],
        },
      ],
    },
  },
  {
    // application: casos de uso. Hablan con domain y sus puertos, no con HTTP ni Prisma.
    files: ['src/**/application/**/*.ts'],
    ignores: ['**/*.spec.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/http/**'],
              message:
                'application no puede depender de http (los DTOs son del adaptador HTTP). Defini un input/command propio del caso de uso.',
            },
            {
              group: ['**/infrastructure/**', '**/generated/**', '@prisma/*'],
              message: 'application no puede depender de infrastructure: usa el puerto definido en domain.',
            },
          ],
        },
      ],
    },
  },
  {
    // http: adaptador de entrada. Llama a casos de uso, no a repositorios concretos.
    files: ['src/**/http/**/*.ts'],
    ignores: ['**/*.spec.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/infrastructure/**', '**/generated/**', '@prisma/*'],
              message: 'http no puede depender de infrastructure: pasa por application.',
            },
          ],
        },
      ],
    },
  },

  // --- Tests ----------------------------------------------------------------
  {
    files: ['**/*.spec.ts', 'test/**/*.ts'],
    languageOptions: {
      globals: globals.jest,
    },
    rules: {
      // expect(repo.save).toHaveBeenCalled() es el uso normal de Jest.
      '@typescript-eslint/unbound-method': 'off',
      // supertest y los bodies de respuesta son `any` por naturaleza: en tests
      // validamos la forma con expect(), no con el sistema de tipos.
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // --- Archivos JS (este config) --------------------------------------------
  {
    files: ['**/*.{js,mjs,cjs}'],
    extends: [tseslint.configs.disableTypeChecked],
  },

  // Siempre al final: apaga reglas de estilo que pisan a Prettier.
  eslintConfigPrettier,
);
