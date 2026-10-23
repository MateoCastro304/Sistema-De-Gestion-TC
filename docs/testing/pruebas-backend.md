# Pruebas del backend

Esta guía explica cómo se prueba el backend del sistema de gestión: qué niveles de prueba hay, qué va en cada uno, cómo se reparten entre sí, dónde viven las pruebas y cómo se ejecutan. Describe la suite tal como está hoy y las reglas para que siga creciendo.

Complementa a la [arquitectura del backend](../arquitectura/backend.md). Las pruebas siguen la misma anatomía de subsistemas.

Las pruebas del frontend tienen su propia guía: [TESTING.md](../../frontend/frontend-Documents/TESTING.md).

---

## Dos niveles: unitario e integración

El backend tiene **solo dos niveles de prueba**.

| Nivel | Qué ejercita | Dónde vive | Herramientas | Comando |
| --- | --- | --- | --- | --- |
| **Unitario** | Una clase aislada: entidad, objeto de valor, caso de uso, mapper. Sin base de datos ni HTTP | `backend/src/**/*.spec.ts`, al lado del archivo que prueba | Jest y repositorios falsos en memoria | `npm test` |
| **Integración** | Un endpoint completo: controller → caso de uso → dominio → repositorio Prisma → **PostgreSQL real** | `backend/test/modules/<módulo>/*.int.spec.ts` | Jest, Supertest y Testcontainers | `npm run test:int` |

No hay más niveles:

- **No hay un nivel de API separado.** El contrato HTTP se verifica dentro del test de integración, junto con la base. Los tests `suppliers/api/` y la configuración `test:api` son una excepción heredada, pendiente de unificar ([A-06](../seguimiento/pendientes-actuales.md#a-06--p2--unificar-los-tests-de-proveedores-y-quitar-el-nivel-de-api)).
- **No hay pruebas E2E del backend.**
- **No hay catálogo de casos de prueba con identificadores propios.** Lo que se prueba sale de los criterios de aceptación de la historia, del caso de uso y del contrato.

---

## Reparto: 70 % unitarias, 30 % integración, por caso de uso

La proporción se mide **por caso de uso**, contando todas las pruebas que lo cubren:

- **Unitarias:** los specs de las entidades y objetos de valor que usa, el spec del propio caso de uso y los de sus mappers.
- **Integración:** los tests de su endpoint.

Es una **referencia para orientarse, no un umbral** que haga fallar la CI. Sirve para detectar dos desvíos:

- Una historia con casi todo en integración: lenta, y prueba reglas que una prueba unitaria demuestra más barato.
- Una historia sin integración: nadie comprobó que el endpoint, el filtro de errores y la base funcionen juntos.

### Qué va en cada nivel

| Se prueba en **unitario** | Se prueba en **integración** |
| --- | --- |
| Invariantes de una entidad u objeto de valor (por ejemplo, el nombre del rubro tiene al menos 3 caracteres, o el CUIT tiene dígito verificador válido) | La forma exacta de la respuesta según el contrato (status y campos) |
| Transiciones de estado y cálculos del dominio | Qué quedó guardado en la base y, ante un error, que **no** se guardó nada |
| Orquestación del caso de uso con fakes: qué lee, a qué entidad llama, qué persiste y qué error propaga | Restricciones que solo cumple la base: índices únicos (incluidos los parciales), CHECK, claves foráneas |
| Mappers: dominio → respuesta y registro de Prisma → dominio | Traducción de errores a status HTTP, a través de los filtros y del `ValidationPipe` |
| Traducción de errores de Prisma a errores de dominio, cuando se puede aislar | El cableado del módulo y la comunicación entre subsistemas |

### Sin pruebas redundantes

**Cada comportamiento se prueba una sola vez, en el nivel más bajo que lo puede demostrar.**

- **Una regla de la entidad** se prueba en el spec de la entidad. El spec del caso de uso no la repite: solo comprueba que el caso de uso propaga el error.
- **La validación de entrada** se prueba con un 400 representativo por endpoint en integración. No se recorren todas las combinaciones de campos inválidos: el detalle está en el dominio.
- **Lo que ya demuestra un test de integración** no se vuelve a probar en unitario con un mock de Prisma.
- **Un escenario que ya cubre otro spec** se cita, no se duplica.

---

## Pruebas unitarias

- **Ubicación y ejecución.** Van en `*.spec.ts` al lado del archivo que prueban y se corren con `npm test`. La configuración está en `backend/package.json`, con `rootDir: src`.
- **Dependencias.** Los casos de uso se prueban con los **repositorios en memoria** de `infrastructure/persistence/in-memory/`, que implementan el mismo puerto que el repositorio de Prisma. No se mockea Prisma.
- **Reloj.** Una prueba que depende de la fecha fija el reloj. Cuando exista el `ClockPort` de `shared/` ([arquitectura](../arquitectura/backend.md#reloj-y-zona-horaria)), se inyecta un reloj de prueba.
- **Specs que hoy existen y sirven de molde:**
  - entidades: `supplier.spec.ts`, `category.spec.ts`, `factory.spec.ts`, `manager.spec.ts`;
  - objeto de valor: `shared/domain/cuit.spec.ts`;
  - casos de uso: los de `supplier` y los de rubros en `customers`.

---

## Pruebas de integración

Cada test hace una **petición HTTP real** a la aplicación completa y verifica, en el mismo test, el contrato y la base.

### Infraestructura

| Pieza | Ubicación | Qué hace |
| --- | --- | --- |
| Base de datos | `test/shared/harness/global-setup.ts`, `global-teardown.ts` | Levanta un PostgreSQL 16 efímero con Testcontainers, **uno por corrida**, y aplica las migraciones con `prisma migrate deploy` |
| Aplicación | `test/shared/harness/test-app.ts` | `startTestApp()`, `stopTestApp()` y `getPrisma()`. Usa `AppModule` con `configureApp()`, la misma configuración HTTP que `main.ts` |
| Contrato | `test/shared/contract/envelopes.ts` | `expectData`, `expectError` y `expectNoContent` con las reglas de `docs/openapi/` |
| Datos | `test/shared/factories/<entidad>.factory.ts` | `a<Entidad>Body()` arma el cuerpo de la petición con los nombres del contrato; `create<Entidad>()` guarda el estado previo con Prisma |

La configuración está en `backend/test/jest-integration.config.ts`. La suite corre en serie (`maxWorkers: 1`).

### Convenciones

- **Un archivo por recurso o por caso de uso específico:**
  - por recurso: `test/modules/<módulo>/<recurso>.int.spec.ts`, por ejemplo `categories.int.spec.ts`;
  - por caso de uso: `test/modules/<módulo>/<caso-de-uso>.int.spec.ts`, por ejemplo `register-supplier.int.spec.ts`. Conviene cuando un caso de uso tiene escenarios suficientes como para ocupar su propio archivo.

  Hoy todos los archivos son por recurso. Las dos formas son válidas.
- **Como mucho 5 `describe` por archivo, cada uno con hasta 5 `it`.** Si no alcanza, el archivo se divide por caso de uso. Las variantes del mismo caso van con `it.each`.
- **Un `describe` por recurso y uno anidado por endpoint**, por ejemplo `describe('POST /categories')`. En un archivo por caso de uso, un `describe` por situación. El `it` describe el comportamiento esperado.
- **Cada test sigue cuatro pasos:** Preparar → Ejecutar → Contrato → Base.
  - Un `2xx` no alcanza: hay que confirmar qué se guardó.
  - Un `4xx` tampoco: hay que confirmar que **no** se guardó nada.
- **Limpieza en `beforeEach`:** `deleteMany()` de las tablas del spec, empezando por las hijas (`customer` → `factory` → `category`). Se borran datos, no el contenedor.
- **Rutas sin prefijo.** Nginx quita `/api` antes de llegar al backend.
- **La base es real.** No se mockean repositorios ni `PrismaService`.

### Las pruebas obedecen al contrato

Una prueba escrita mirando la implementación confirma lo que el código hace, no lo que el contrato promete, y da verde aunque el endpoint esté mal. Por eso:

- **Forma exacta del recurso:** `toEqual` completo, o las claves comparadas contra la lista del contrato. `toMatchObject` solo para mirar un campo puntual, después de haber fijado la forma en otra prueba.
- **Errores:** status, `error` y `details` según el contrato. No se compara el texto de `message` mientras el backend no emita los mensajes definitivos del contrato.
- **Base:** se compara el estado antes y después del pedido.
- **Si el backend no cumple el contrato, el test queda en rojo a propósito.** Es una brecha a corregir en el código, no un test roto. Nunca se ajusta el test al comportamiento actual.

---

## Nombres

- **Unitarias:** `<archivo-probado>.spec.ts`. Por ejemplo, `create-supplier.use-case.spec.ts` junto a `create-supplier.use-case.ts`.
- **Integración:** `<recurso>.int.spec.ts` o `<caso-de-uso>.int.spec.ts`. Por ejemplo, `categories.int.spec.ts` o `register-supplier.int.spec.ts`.
- **`describe`:** el nombre de la clase, o el recurso y el endpoint.
- **`it`:** el comportamiento esperado.
- **No se agregan etiquetas** de caso de uso, de caso de prueba ni de invariante a los nombres. La relación entre un escenario y su prueba se registra en el plan de la historia, no en el código.

---

## Cómo se ejecutan

Las pruebas se corren **dentro del contenedor `backend`**, con el entorno de desarrollo levantado:

```bash
make dev-up
```

Una vez arriba, hay dos formas de correrlas.

Con los targets del Makefile:

```bash
make backend-test
```

```bash
make backend-test-int
```

O entrando al contenedor con `make backend-shell` y corriendo los comandos desde ahí:

| Comando | Qué corre |
| --- | --- |
| `npm test` | Unitarias |
| `npm run test:int` | Integración |
| `npm run test:int -- --testPathPatterns categories` | Integración de un solo archivo |
| `npm run test:cov` | Cobertura de las unitarias |

Las pruebas de integración necesitan Docker: el contenedor `backend` usa el `docker.sock` del host para que Testcontainers levante la base. El script usa `node --experimental-vm-modules`, porque el runtime de Prisma carga su compilador WASM con `import()` dinámico dentro de la VM de Jest.

### En la CI

Según [ADR-010](../decisiones/010-continuous-integration.md):

- **En cada push:** `npm test`, junto con el lint, el formato y la compilación.
- **En los pull requests a `main`:** `npm run test:int`.

---

## Estado actual

| Módulo | Unitarias | Integración | Huecos |
| --- | --- | --- | --- |
| `customers`, rubros | Entidad y los 6 casos de uso | `categories.int.spec.ts` | — |
| `customers`, fábricas | Entidad | `factories.int.spec.ts` | Sin specs de sus 5 casos de uso |
| `customers`, encargados | Entidad | `managers.int.spec.ts` | Sin specs de sus 5 casos de uso |
| `supplier` | Entidad y los 5 casos de uso | `suppliers/int/` y `suppliers/api/` | Integración repartida en dos carpetas y dos configuraciones, con escenarios duplicados ([A-06](../seguimiento/pendientes-actuales.md#a-06--p2--unificar-los-tests-de-proveedores-y-quitar-el-nivel-de-api)) |
| `shared` | `cuit.spec.ts` | — | `Mail` y `Phone` sin spec |

En conjunto hay hoy unas 230 pruebas unitarias contra unas 60 de integración, sin contar las de `suppliers/api/`. Es decir, alrededor de 80/20.

Otros puntos pendientes de la suite:

- **Factories viejas sin uso.** `test/shared/factories/category-factory.ts`, `factory-factory.ts` y `customer-factory.ts` (con faker) no las usa ningún test y conviven con las vigentes (`category.factory.ts`, `factory.factory.ts`, `manager.factory.ts`, `supplier-factory.ts`).
- **`expectList` desactualizado.** En `envelopes.ts` espera un array plano, pero los listados devuelven `{ items, total, page, limit }`. No lo usa ningún test.
- **Sin autenticación.** `test/shared/auth/login-as.ts` está comentado porque todavía no existe el módulo de sesión. Cuando exista, cada endpoint suma un 401 y un 403 representativos.

---

## Documentación relacionada

- [Suite de integración](../../backend/test/README.md): guía corta para agregar una prueba de integración.
- [Arquitectura del backend](../arquitectura/backend.md) y [ADR-010](../decisiones/010-continuous-integration.md) (CI).
- [Contrato de la API](../api-contract/API_CONTRACT_SPRINT_2.md) y [OpenAPI](../openapi/openapi.yaml): la referencia contra la que se escriben las pruebas.
