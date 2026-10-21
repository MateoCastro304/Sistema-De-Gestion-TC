# Mocks de la API

El frontend puede funcionar sin backend: con **MSW** (Mock Service Worker), un
Service Worker responde las peticiones a `/api/*` con datos en memoria. Sirve
para trabajar en una pantalla antes de que su endpoint exista (como todo el
Sprint 2 hoy) y es lo que usan los tests E2E (ver [TESTING.md](TESTING.md)).

## Cómo se prenden

En `frontend/.env.local`:

```bash
VITE_USE_MOCKS=true
```

y `npm run dev`. Con `false` (o sin definir) las peticiones van al backend real
por el proxy de Vite. En la consola del navegador aparece `[MSW] Mocking enabled`
y cada petición respondida por un mock.

Los mocks **nunca llegan a producción**: `main.tsx` los carga sólo en dev y con
esa variable, y el código está en un `import()` dinámico que el build descarta.

## Dónde están

Cada feature tiene sus mocks en su carpeta `api/`, y `src/app/mocks/handlers.ts`
los junta todos:

| Archivo             | Qué tiene                                                                       |
| ------------------- | ------------------------------------------------------------------------------- |
| `api/<feature>.db.ts`    | La "tabla" del feature: la semilla en memoria que los handlers modifican    |
| `api/<feature>.mocks.ts` | Los handlers de MSW: mismas reglas, códigos y mensajes que el backend      |
| `src/shared/mocks/`      | Lo común a todos (ver [Helpers](#helpers))                                 |
| `src/app/mocks/handlers.ts` | La lista de todos los handlers, y el control de sesión del Sprint 1     |

| Feature            | Archivos                                                       | Endpoints                                     |
| ------------------ | -------------------------------------------------------------- | --------------------------------------------- |
| Rubros             | `catalogs/categories/api/categories.{db,mocks}.ts`             | `/categories`                                 |
| Encargados y fábricas | `catalogs/customers/api/customers.{db,mocks}.ts`            | `/managers`, `/factories`, `/factories/{id}/managers` |
| Proveedores        | `catalogs/suppliers/api/suppliers.{db,mocks}.ts`               | `/suppliers`                                  |
| Sesión             | `auth/api/auth.mocks.ts`                                       | `/auth/login`, `/auth/refresh`, `/auth/logout` |
| Empleados          | `catalogs/employees/api/employees.{db,mocks}.ts`               | `/employees`                                  |
| Usuarios           | `catalogs/users/api/users.{db,mocks}.ts`                       | `/users`                                      |
| Tipos de proceso   | `catalogs/process-types/api/process-types.{db,mocks}.ts`       | `/process-types`, `/exchange-rate`            |
| Materiales         | `catalogs/materials/api/materials.mocks.ts`                    | `/materials`, `/materials/names`              |

## Reglas

- **Los mocks copian al backend, no al revés.** Para el Sprint 1 la fuente es el
  código de `backend/src/subsystems/` (`customers/` tiene rubros, fábricas y
  encargados; `supplier/`, proveedores: mensajes, `409`, normalizaciones); para el Sprint 2,
  [`API_CONTRACT_SPRINT_2.md`](../../docs/api-contract/API_CONTRACT_SPRINT_2.md). Si
  el backend o el contrato cambian, se actualiza el mock **en el mismo PR**.
- **Los mensajes que la pantalla interpreta tienen que ser idénticos.** Por
  ejemplo, `customers/utils/errorMessages.ts` traduce los 409 de fábricas leyendo
  el texto en inglés del backend (`"active managers"`, `"already inactive"`): si
  el mock manda otro texto, la pantalla muestra el error equivocado.
- **Los datos se guardan como los guarda el backend:** CUIT de proveedor con
  guiones, CUIT de fábrica en 11 dígitos, mails en minúsculas, teléfonos sin
  separadores (`+5493515550001`), textos recortados y opcionales vacíos como
  `null` (Sprint 2) o `''` (encargados y fábricas, como su backend).
- **Un mock puede leer la tabla de otro feature** (`import ... from
  '@/features/<otro>/api/<otro>.db'`), como un JOIN del backend: una fábrica
  necesita que su rubro exista; un usuario, su empleado. ESLint lo permite sólo
  en `*.mocks.ts` y `*.db.ts`, y sólo hacia `api/*.db.ts` y `types/` de otro
  feature. El código de la app sigue entrando a otro feature únicamente por su
  `index.ts`.
- **Las tablas no se importan entre sí en círculo:** un `*.db.ts` puede leer otro
  `*.db.ts` (por ejemplo `users.db.ts` lee `employees.db.ts`), pero no los dos a la vez.
- **Los datos se resetean al recargar la página.** Cada recarga vuelve a la
  semilla: es lo que hace independientes a los tests.
- **La semilla es la del prototipo** (`semilla()` en
  `docs/prototipo/fuente/Castro Tornería - Prototipo.dc.html`), con las fechas
  pasadas de la hora de Córdoba a UTC. Si se cambia una semilla, revisar los tests
  que nombran esos datos.

## Cómo agregar el mock de un feature

1. **Tipos.** En `src/features/<feature>/types/<entidad>.ts`, la forma del recurso
   según el contrato (lo que se recibe, lo que se envía y los filtros del listado).
2. **Tabla.** `api/<feature>.db.ts` con la semilla y, si otros mocks la necesitan,
   funciones de búsqueda (`findX(id)`):

   ```ts
   export const materialsDb = {
     materials: [ /* semilla */ ] as Material[],
     nextId: 14,
   }
   ```

3. **Handlers.** `api/<feature>.mocks.ts`. La forma habitual de un handler del
   Sprint 2:

   ```ts
   http.get('/api/materials', ({ request }) => {
     const caller = authorize(request, ['AT', 'EC'])       // 401 / 403
     if (caller instanceof Response) return caller
     const pageParams = readPageOrError(request)           // 400 de page/limit
     if (pageParams instanceof Response) return pageParams

     const quality = new URL(request.url).searchParams.get('quality') ?? ''
     const matching = materialsDb.materials.filter((m) => containsText(m.quality, quality))
     return HttpResponse.json(paginate(matching, pageParams))
   }),
   ```

   - Rutas siempre con `/api` adelante: es la URL que pide el navegador.
   - Las rutas más específicas van **antes**: `/factories/:id/deactivate` antes que
     `/factories/:id`, `/materials/names` antes que un futuro `/materials/:id`.
   - Validar en el mismo orden que el backend: sesión, parámetros, cuerpo (400),
     existencia (404), reglas de negocio (409 / 422).
   - Un `204` se responde con `new HttpResponse(null, { status: 204 })`.
   - `delay()` de MSW sólo si se quiere ver un estado de carga; demora los tests.
4. **Registrarlo** en `src/app/mocks/handlers.ts`, en el bloque de su sprint.
5. **Probarlo**: `npm run lint`, y `npm run test:e2e` si el feature tiene tests.

## Helpers

En `src/shared/mocks/`:

| Helper                                       | Archivo      | Para qué                                                                           |
| -------------------------------------------- | ------------ | ---------------------------------------------------------------------------------- |
| `apiError(request, status, message, opts)`   | `errors.ts`  | Cualquier error con la forma del backend (`statusCode`, `error`, `message`, `path`, `timestamp`). `opts`: `code`, `details`, `extra` |
| `validationError(request, details, message?)` | `errors.ts` | El `400 VALIDATION_ERROR` del Sprint 2 con un `{ field, message }` por campo       |
| `authorize(request, roles)`                  | `session.ts` | Verifica sesión y rol. Devuelve quién llama o el `401` / `403` a devolver          |
| `readPageOrError(request)`                   | `paging.ts`  | `page` y `limit` (defaults 1 y 20, máximo 100) o el `400` del Sprint 2             |
| `readPageParams(url)` + `PAGE_LIMIT_ERROR`   | `paging.ts`  | Lo mismo con el mensaje del backend del Sprint 1                                   |
| `paginate(items, pageParams)`                | `paging.ts`  | El sobre `{ items, total, page, limit }`                                           |
| `readPathId(request, raw, field, message)`   | `paging.ts`  | El id de la ruta como entero, o el `400 INVALID_PATH_PARAMETER`                     |
| `sameText(a, b)` / `containsText(a, b)`      | `text.ts`    | Comparar sin mayúsculas, acentos ni espacios repetidos (contrato §4)               |

Para el Sprint 1 los errores no llevan `code` (su backend no lo manda); desde el
Sprint 2 sí, con los códigos del catálogo del contrato (§5.3).

## Sesión simulada

En el backend la sesión vive en el servidor y el refresh token viaja en la cookie
`refresh_token`. Acá (`src/shared/mocks/session.ts`):

- La "cookie" es la clave `castro-mock-session` de `localStorage`: así recargar
  no cierra la sesión, igual que con la cookie real.
- `POST /auth/login` la crea y devuelve un `accessToken` que lleva adentro la
  sesión, el usuario y sus roles. `POST /auth/refresh` la lee y entrega otro
  token. `POST /auth/logout` la borra: desde la petición siguiente ese token
  responde `401 UNAUTHENTICATED`.
- `authorize(request, roles)` responde `401 UNAUTHENTICATED` sin token o con la
  sesión cerrada, `401 SESSION_EXPIRED` si pasaron los 7 días o si la sesión está
  marcada como vencida por inactividad, `401 ACCESS_TOKEN_EXPIRED` si está marcada
  con el token vencido, y `403 FORBIDDEN` sin el rol.
- Marcas de la sesión simulada que usan los tests E2E (`changeSession` y
  `seedSession` de `e2e/support/session.ts`):
  - `expiredByInactivity`: la sesión se cerró por 30 minutos sin actividad.
  - `accessTokenExpired`: el token venció; el próximo `POST /auth/refresh` la borra.
  - `refreshRevoked`: el refresh token ya fue reemplazado; el próximo
    `POST /auth/refresh` cierra la sesión con `401 UNAUTHENTICATED` (D-47).
- El login cuenta los intentos fallidos y bloquea al quinto (`423`), mientras no
  se recargue la página.

**Usuarios de ejemplo** (`users.db.ts`), todos con la contraseña `Castro1977`:

| Usuario    | Rol      | Notas                     |
| ---------- | -------- | ------------------------- |
| `wcastro`  | AS       | Administrador del Sistema |
| `mrios`    | ERP      |                           |
| `fpaz`     | EC       |                           |
| `lbenitez` | AT       |                           |
| `rsanchez` | JT       | Sin módulos               |
| `gtorres`  | ER       | Sin módulos               |
| `dcastro`  | ERP + EC | Dos roles                 |
| `hfunes`   | AT       | Bloqueado                 |
| `ogimenez` | ERP      | Dado de baja              |

### El Sprint 1 pide sesión

El contrato hace que todo el Sprint 1 pida sesión y rol (§7.2). Desde el login
(DTC-33), `src/app/mocks/handlers.ts` tiene `SPRINT_1_REQUIRES_SESSION = true` y
una tabla con el rol de cada catálogo. Los tests del Sprint 1 siguen en verde
porque ya arrancan con el usuario del rol que les toca.

## Estado de los mocks

### Sprint 1 (actualizados al backend)

Habían quedado atrás del backend. Lo que se corrigió:

- **Rubros:** valida el mínimo de 3 caracteres (400), no deja modificar un rubro
  dado de baja (409), filtra por `name`, y la baja con fábricas activas se calcula
  con la tabla de fábricas (antes eran ids fijos, así que un rubro recién asignado
  se podía borrar). Mensajes iguales a los del backend.
- **Fábricas:** se agregó `GET /factories/{id}`, los filtros del listado
  (`categoryId`, `nameContains`, `active`), la validación del CUIT, que el rubro
  exista y esté activo (400), el nombre único y el "ya estaba dada de baja". Se
  sumó **Agro Pampa**, una fábrica sin encargados.
- **Encargados:** fábrica inexistente responde 404 y dada de baja 409 con el texto
  del backend (antes el mensaje en castellano hacía que la pantalla mostrara el
  error equivocado); al menos un medio de contacto; mail en minúsculas y único
  entre los activos de la fábrica; teléfono guardado sin separadores.
- **Proveedores:** el CUIT vuelve con guiones y se valida; mail en minúsculas y
  teléfono sin separadores; el 404 con el mensaje y el `id` del backend.

Con la reorganización del backend en subsistemas (16/10/2026):

- **Encargados:** la ruta pasó de `/customers` a `/managers` (el backend llama
  `Manager` al encargado) y la baja de una fábrica con encargados responde
  `"... has active managers and cannot be deactivated"`.
- **Fábricas:** la razón social viaja como `legalName`. El mock la guarda como
  `name` (igual que los formularios) y la traduce al recibir y al responder, como
  hace `customers.api.ts` con el backend real.
- **Rubros:** el alta con el nombre de un rubro dado de baja lo reactiva y
  responde `201` con ese rubro (antes era un `409` con su `categoryId`). Al
  modificar, el nombre no puede ser el de otro rubro, activo o dado de baja.
- **Encargados:** los `400` de validación marcan el campo como el backend:
  `name` si falta el nombre y `mail` si no hay ningún medio de contacto.
- **Paginación:** el tope de `limit` es `100` en todos los listados (antes `1000`).

### Sprint 2 (según el contrato)

Los 18 endpoints del contrato con sus códigos de error. Decisiones a tener en
cuenta:

- **Historial de tipos de proceso, en dólares:** hay un registro cada vez que
  cambia alguno de los dos precios, con `previousValueUsd`, `newValueUsd` y
  `exchangeRate`, que son las columnas de la tabla "Historial de precios" del
  prototipo (D-32). Los cambios de nombre o descripción no quedan en el historial.
- **El tipo de cambio de un tipo de proceso** sólo se guarda junto con un cambio
  de precio: si el `PATCH` lo manda sin que cambie ningún precio, se ignora (D-52).
- **El tipo de cambio** (`GET /exchange-rate`) es fijo: $ 1.385,50 al 15/10/2026
  09:30, el del prototipo. Con la clave `castro-mock-exchange-rate-down` en
  `localStorage` responde el `502 EXCHANGE_RATE_UNAVAILABLE`, como si el backend
  nunca hubiera podido obtener la cotización (lo usan los tests E2E).
- **Materiales** no tiene `.db.ts` porque ningún otro mock lo lee todavía.

### Lo que no está mockeado

- Los tiempos reales de la sesión (15 minutos, 30 minutos, 7 días) y la
  tolerancia de 30 segundos después de rotar el refresh token (D-47): el mock
  no los mide, se simulan con las marcas de la [sesión simulada](#sesión-simulada).

## Para el futuro CLAUDE.md

Reglas que conviene pasarle tal cual:

- Los mocks de la API están en `src/features/<feature>/api/` (`*.db.ts` con los
  datos, `*.mocks.ts` con los handlers) y se registran en `src/app/mocks/handlers.ts`.
  Se prenden con `VITE_USE_MOCKS=true`.
- Los mocks copian al backend (Sprint 1, `backend/src/`) y al contrato (Sprint 2,
  `docs/api-contract/`). Si cambia uno de los dos, actualizar el mock en el mismo cambio.
- Un mensaje de error que la pantalla interpreta tiene que ser idéntico al del
  backend, letra por letra.
- Usar los helpers de `src/shared/mocks/` (`apiError`, `validationError`,
  `authorize`, `readPageOrError`, `paginate`, `readPathId`, `sameText`) en vez de
  armar las respuestas a mano.
- Un mock puede importar el `api/*.db.ts` y los `types/` de otro feature; nada más
  de otro feature. Nunca exportar mocks desde el `index.ts` de un feature.
- Después de tocar un mock, correr `npm run lint` y `npm run test:e2e:sprint1`.
