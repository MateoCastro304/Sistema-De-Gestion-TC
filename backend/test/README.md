# Pruebas de integración del backend — Tornería Castro

Esta carpeta tiene las **pruebas de integración**. Las unitarias van en `src/**/*.spec.ts`, al lado del código.

La estrategia completa está en [Pruebas del backend](../../docs/testing/pruebas-backend.md): los dos niveles, el reparto 70/30 por caso de uso, qué va en cada nivel y cómo evitar pruebas redundantes.

Cada prueba de integración:

1. **Levanta la aplicación NestJS completa:** `AppModule` con `configureApp()`, la misma configuración HTTP que `main.ts`.
2. **Hace una petición HTTP real con Supertest**, que recorre controller → caso de uso → dominio → repositorio Prisma → **PostgreSQL real**.
3. **Verifica en la misma prueba el contrato y la base:**
   - el contrato: status y forma de la respuesta según `docs/openapi/`;
   - la base: qué quedó guardado y qué no.

## Estructura

```
backend/test/
├── jest-integration.config.ts
├── tsconfig.json
├── modules/<módulo>/<recurso>.int.spec.ts       ← las pruebas, un archivo por recurso…
├── modules/<módulo>/<caso-de-uso>.int.spec.ts   ← …o por caso de uso específico
└── shared/
    ├── harness/    global-setup, global-teardown, container-registry, test-app
    ├── contract/   envelopes.ts → expectData / expectError / expectNoContent
    └── factories/  <entidad>.factory.ts → a<Entidad>Body() y create<Entidad>()
```

- **Base de datos:** `global-setup` levanta un PostgreSQL efímero con Testcontainers y aplica las migraciones. Hay **un contenedor por corrida**.
- **Aplicación:** `startTestApp()`, `stopTestApp()` y `getPrisma()` están en `shared/harness/test-app.ts`.
- **Datos:**
  - `a<Entidad>Body()` arma el **cuerpo de la petición** con los nombres del contrato y no toca la base.
  - `create<Entidad>()` **guarda** con Prisma el estado previo que necesita la prueba.

> **Excepción heredada.** `modules/suppliers/` tiene sus pruebas repartidas en `int/` y `api/`, con una configuración aparte (`jest-api.config.ts`, script `test:api`) y escenarios duplicados. No es el modelo a seguir: está pendiente unificarlas en `modules/suppliers/*.int.spec.ts` ([A-06](../../docs/seguimiento/pendientes-actuales.md#a-06--p2--unificar-los-tests-de-proveedores-y-quitar-el-nivel-de-api)).

## Convenciones

- **Organización:**
  - Un archivo por recurso (`categories.int.spec.ts`) o por caso de uso específico (`register-supplier.int.spec.ts`). Hoy todos son por recurso; las dos formas son válidas.
  - **Como mucho 5 `describe` por archivo, cada uno con hasta 5 `it`.** Si no alcanza, el archivo se divide por caso de uso. Las variantes del mismo caso van con `it.each`.
  - Un `describe` por recurso y uno anidado por endpoint, por ejemplo `describe('POST /categories')`.
  - El `it` describe el comportamiento esperado, sin etiquetas de caso de uso.
- **Cuatro pasos en cada prueba:** Preparar → Ejecutar → Contrato → Base.
  - Un `2xx` no alcanza: hay que confirmar que se guardó.
  - Un `4xx` tampoco: hay que confirmar que **no** se guardó nada.
- **Qué se prueba:** solo lo que necesita HTTP y una base real. Las reglas del dominio ya están probadas en las unitarias, así que acá alcanza con un caso representativo por regla, sin recorrer todas las combinaciones de validación.
- **Limpieza:** en `beforeEach`, `deleteMany()` de las tablas del spec, empezando por las hijas (`customer` → `factory` → `category`). Se borran datos, no el contenedor. La suite corre en serie (`maxWorkers: 1`).
- **Rutas sin prefijo:** nginx quita `/api` antes de llegar al backend.
- **Errores:** se distinguen por `statusCode`, `error` y `details`, nunca por el texto de `message`. La forma esperada es `{ statusCode, error, message, path, timestamp, details? }`.
- **La base es real:** no se mockean repositorios ni `PrismaService`.
- **Sin 401 ni 403 por ahora:** todavía no existe el módulo de sesión.

## Las pruebas obedecen al contrato

Donde el backend se desvía del OpenAPI, la prueba queda **en rojo a propósito**. Es una brecha a corregir en el código, no una prueba rota. Nunca se ajusta la prueba al comportamiento actual.

## Cómo correr

Las pruebas corren dentro del contenedor `backend`, con el entorno levantado:

```bash
make dev-up
```

```bash
make backend-test-int
```

Para un solo archivo, desde `make backend-shell`:

```bash
npm run test:int -- --testPathPatterns categories
```

Hace falta Docker. El script usa `node --experimental-vm-modules` porque el runtime de Prisma carga su compilador WASM con `import()` dinámico dentro de la VM de Jest.

## Agregar las pruebas de un módulo nuevo

1. Crear `shared/factories/<entidad>.factory.ts` con `a<Entidad>Body()` y `create<Entidad>()`.
2. Crear `modules/<módulo>/<recurso>.int.spec.ts`, o `<caso-de-uso>.int.spec.ts` si el caso de uso amerita su propio archivo.
3. Correr solo ese archivo hasta que pase, o hasta que el único rojo sea una brecha documentada. Después, correr toda la suite.
