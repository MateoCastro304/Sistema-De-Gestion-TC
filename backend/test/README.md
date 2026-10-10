# Tests de integración del backend — Tornería Castro

La suite tiene **un solo nivel**: tests de integración que combinan API y base de datos. Cada `it`:

1. levanta la app NestJS completa (`AppModule` + `configureApp()`, la misma configuración HTTP que `main.ts`);
2. hace una petición HTTP real con Supertest (controlador → caso de uso → dominio → repositorio Prisma → **PostgreSQL real**);
3. verifica en el mismo test **el contrato** (status y forma de la respuesta según `docs/openapi/`) y **la base** (qué quedó o qué no quedó guardado).

Lógica pura de dominio: `src/**/*.spec.ts`, al lado del código (`npm test`).

## Estructura

```
backend/test/
├── jest-integration.config.ts
├── tsconfig.json
├── modules/<módulo>/<recurso>.int.spec.ts    ← los tests: categories, factory, suppliers, managers
└── shared/
    ├── harness/    global-setup, global-teardown, container-registry, test-app
    ├── contract/   envelopes.ts → expectData / expectList / expectError / expectNoContent
    └── factories/  <entidad>.factory.ts → a<Entidad>Body() y create<Entidad>()
```

- `global-setup` levanta un Postgres efímero (Testcontainers) y aplica las migraciones; hay **un contenedor por corrida**.
- `startTestApp()` / `stopTestApp()` / `getPrisma()` en `shared/harness/test-app.ts`.
- `a<Entidad>Body()` arma el **cuerpo de la petición** con los nombres del contrato (no toca la base). `create<Entidad>()` **persiste** con Prisma el estado previo.

## Convenciones

- Un `describe` por recurso y uno anidado por endpoint (`describe('POST /categories')`). `it` en castellano.
- Cada test: **Preparar → Ejecutar → Contrato → Base**. Un `2xx` no alcanza: confirmar que se guardó. Un `4xx` tampoco: confirmar que **no** se guardó nada.
- Solo criterios de aceptación del contrato: por endpoint, los status que declara el OpenAPI y las reglas de su schema. Sin permutaciones de validación.
- `beforeEach`: `deleteMany()` de las tablas del spec, **hijas primero** (`customer` → `factory` → `category`). Se borran datos, no el contenedor. La suite corre en serie (`maxWorkers: 1`).
- Las rutas van sin prefijo: nginx quita `/api` antes de llegar al backend.
- Errores: se discriminan por `statusCode`/`error`, nunca por `message`. Forma esperada: `{ statusCode, error, message, path, timestamp, details? }`.
- La base es real: no se mockean repositorios ni `PrismaService`.
- Todavía no hay 401/403: el OpenAPI marca la autenticación como pendiente.

## Los tests obedecen al contrato

Donde el backend se desvía del OpenAPI, el test queda **en rojo a propósito**: es una brecha a corregir en el código, no un test roto. No se ajusta el test al comportamiento actual.

## Cómo correr

```bash
make dev-up
make test-int                                                   # toda la suite
docker exec torneria-backend npm run test:int -- --testPathPatterns "categories"
```

Requiere Docker. El script usa `node --experimental-vm-modules` porque el runtime de Prisma carga su compilador wasm con `import()` dinámico dentro de la VM de Jest.

## Agregar tests de un módulo nuevo

1. `shared/factories/<entidad>.factory.ts` con `a<Entidad>Body()` y `create<Entidad>()`.
2. `modules/<módulo>/<recurso>.int.spec.ts`.
3. Correr solo ese archivo hasta que pase (o hasta que el único rojo sea una brecha documentada) y luego toda la suite.
