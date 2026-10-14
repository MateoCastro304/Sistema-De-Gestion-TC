// @ts-check
import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Backend ESLint config (NestJS, hexagonal architecture per module).
 *
 * Principles:
 * - Every rule is 'error' or 'off'. No 'warn': CI runs with
 *   --max-warnings 0, because a warning nobody reads is useless.
 * - Formatting is Prettier's job (`npm run format:check`), not ESLint's.
 *   eslint-config-prettier turns off the style rules that would clash with it.
 * - Type-aware linting (recommendedTypeChecked): needs src/generated (Prisma).
 *   If it is missing, run `npm run prisma:generate` first; CI does the same.
 */

// Layers of each module: src/<module>/{domain,application,http,infrastructure}.
// Dependencies point inwards: http/infrastructure -> application -> domain.
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
      // Nest relies on promises everywhere: a promise without await is an error
      // that gets lost silently (or crashes the process).
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      // In-memory repositories implement async ports without needing await.
      // Flagging them finds no bugs, it only forces Promise.resolve() boilerplate.
      '@typescript-eslint/require-await': 'off',
      // WARNING: do not enable consistent-type-imports. With emitDecoratorMetadata,
      // turning the import of an injected class into `import type` breaks Nest's
      // DI at runtime (the type disappears from the metadata).
    },
  },

  // --- Hexagonal architecture boundaries -----------------------------------
  {
    // domain: plain TypeScript. Knows nothing about the framework, the database or other layers.
    files: ['src/**/domain/**/*.ts'],
    ignores: ['**/*.spec.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/application/**', '**/http/**', '**/infrastructure/**', '**/generated/**'],
              message: 'domain must not depend on other layers.',
            },
            {
              group: frameworkPackages,
              message: 'domain must not depend on the framework or on infrastructure libraries.',
            },
          ],
        },
      ],
    },
  },
  {
    // application: use cases. They talk to domain and its ports, not to HTTP or Prisma.
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
                'application must not depend on http (DTOs belong to the HTTP adapter). Define an input/command owned by the use case.',
            },
            {
              group: ['**/infrastructure/**', '**/generated/**', '@prisma/*'],
              message: 'application must not depend on infrastructure: use the port defined in domain.',
            },
          ],
        },
      ],
    },
  },
  {
    // http: inbound adapter. Calls use cases, never concrete repositories.
    files: ['src/**/http/**/*.ts'],
    ignores: ['**/*.spec.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/infrastructure/**', '**/generated/**', '@prisma/*'],
              message: 'http must not depend on infrastructure: go through application.',
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
      // expect(repo.save).toHaveBeenCalled() is normal Jest usage.
      '@typescript-eslint/unbound-method': 'off',
      // supertest and response bodies are `any` by nature: in tests the shape
      // is validated with expect(), not with the type system.
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // --- Node internals without types ----------------------------------------
  {
    // Patches Module._resolveFilename, an undocumented Node internal with no
    // types in @types/node. There is no type-safe way to express this, so
    // the unsafe-* rules are off for this one file instead of elsewhere.
    files: ['prisma/seed.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
    },
  },

  // --- JS files (this config) ----------------------------------------------
  {
    files: ['**/*.{js,mjs,cjs}'],
    extends: [tseslint.configs.disableTypeChecked],
  },

  // Always last: turns off style rules that conflict with Prettier.
  eslintConfigPrettier,
);
