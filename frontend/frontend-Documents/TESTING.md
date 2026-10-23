# Testing del frontend

Tests **E2E con Playwright** del frontend, separados por feature y por sprint.
Corren contra la app real (Vite en modo dev) con los **mocks de MSW** prendidos:
no hace falta backend, base de datos ni Docker.

> Esta suite prueba **el frontend**: pantallas, navegación, validaciones y cómo
> se muestran las respuestas de la API. La integración con el backend real la
> cubren las pruebas de integración del backend, descriptas en
> [`docs/testing/pruebas-backend.md`](../../docs/testing/pruebas-backend.md).

## Cómo se corre

Desde `frontend/`:

```bash
npm install
npx playwright install chromium   # una sola vez por máquina
```

| Comando                    | Qué hace                                                          |
| -------------------------- | ----------------------------------------------------------------- |
| `npm run test:e2e`         | Todos los tests (Sprint 1 y Sprint 2)                             |
| `npm run test:e2e:sprint1` | Sólo el Sprint 1. **Tiene que estar siempre en verde**            |
| `npm run test:e2e:sprint2` | Sólo el Sprint 2. En rojo hasta que se hagan sus pantallas        |
| `npm run test:e2e:ui`      | Modo interactivo de Playwright (ver, pausar, repetir cada test)   |
| `npm run test:e2e:report`  | Abre el último reporte HTML                                       |

Algunas variantes útiles:

```bash
npx playwright test e2e/catalogs/suppliers          # un feature
npx playwright test -g "CU-41"                      # por caso de uso
npx playwright test --project=sprint-1 --headed     # viendo el navegador
```

Playwright levanta solo el dev server en el puerto **5180** con
`VITE_USE_MOCKS=true` (gana sobre lo que diga `.env.local`). Si ya hay uno
corriendo en ese puerto lo reutiliza. El reporte queda en `e2e/.report/` y los
traces de los tests que fallan en `e2e/.results/` (los dos en `.gitignore`).

## Estructura

Los tests siguen la misma estructura de `src/features/`: un archivo por feature.

```
frontend/
├── playwright.config.ts           # proyectos sprint-1 / sprint-2, dev server con mocks
├── tsconfig.e2e.json              # TypeScript de los tests (lo chequea `npm run build`)
├── frontend-Documents/
│   ├── TESTING.md                 # este archivo
│   └── MOCKS.md                   # los mocks de la API que usan los tests
└── e2e/
    ├── support/                   # lo compartido por todos los tests
    │   ├── fixtures.ts            # `test` con la opción `sessionUser` + helpers de UI
    │   ├── session.ts             # usuarios de ejemplo y sesión precargada
    │   └── routes.ts              # todas las URLs (las del Sprint 2 son propuestas)
    ├── auth/
    │   └── session.e2e.spec.ts            # Sprint 2: ingreso, cierre de sesión, acceso por rol
    └── catalogs/
        ├── categories/categories.e2e.spec.ts      # Sprint 1: rubros
        ├── customers/customers.e2e.spec.ts        # Sprint 1: encargados
        ├── customers/factories.e2e.spec.ts        # Sprint 1: fábricas (mismo feature que encargados)
        ├── suppliers/suppliers.e2e.spec.ts        # Sprint 1: proveedores
        ├── employees/employees.e2e.spec.ts        # Sprint 2: empleados
        ├── users/users.e2e.spec.ts                # Sprint 2: usuarios
        ├── process-types/process-types.e2e.spec.ts # Sprint 2: tipos de proceso
        └── materials/materials.e2e.spec.ts        # Sprint 2: materiales
```

## Convenciones

- **Nombre de archivo:** `<feature>.e2e.spec.ts` (convención del repo:
  `<tema>.<nivel>.spec.ts`). Playwright sólo toma esos archivos.
- **`describe` con los casos de uso entre corchetes** y la etiqueta del sprint:

  ```ts
  test.describe('[CU-41][CU-42][CU-43][CU-44] Rubros', { tag: '@sprint1' }, () => { ... })
  ```

  La etiqueta decide en qué proyecto corre (`@sprint1` → `sprint-1`). Un test
  sin etiqueta no corre en ningún proyecto.
- **Títulos en castellano**, describiendo lo que hace el usuario: "registra un
  rubro nuevo y valida el largo mínimo".
- **Pocos tests por feature** (4 a 6): el camino feliz de cada CU y las reglas de
  negocio que se ven en pantalla (unicidad, bajas bloqueadas, validaciones). Lo
  que es lógica pura (un cálculo, un schema de zod) no va acá.
- **Selectores accesibles**, en este orden: `getByRole` (con `name`),
  `getByLabel`, `getByText`. Nada de clases CSS ni `data-testid`, salvo la
  fila de un listado (`row()` en `fixtures.ts`), porque el `Table` en modo
  tarjetas no tiene roles. Si un test no encuentra un campo por su rótulo,
  casi siempre es un problema de accesibilidad de la pantalla, no del test.
- **Cada test es independiente.** Cada `page.goto` recarga la app y los mocks
  vuelven a su semilla, así que el orden no importa y corren en paralelo.
- **Los datos se nombran como están en la semilla** ("EDASA", "Laura Gómez",
  "wcastro"). Si se cambia la semilla de un mock, hay que revisar sus tests.

### Helpers (`e2e/support/fixtures.ts`)

| Helper                          | Para qué                                                                |
| ------------------------------- | ----------------------------------------------------------------------- |
| `test.use({ sessionUser })`     | Arranca el test con la sesión de ese usuario (ver abajo)                |
| `toast(page, texto)`            | El aviso flotante con ese texto                                          |
| `chooseOption(combobox, op)`    | Elige una opción del `Select` propio de la app (o de un `<select>`)     |
| `chooseOptions(combobox, ops)`  | Varias opciones de un desplegable múltiple ("Permisos")                 |
| `rows(page)` / `row(page, txt)` | Las filas de un listado / la que contiene ese texto                     |

## Datos y sesión

Los tests usan los mocks de la API: cómo funcionan, qué datos traen y cómo se
agregan está en [MOCKS.md](MOCKS.md). Lo que importa para escribir un test:

- **Cada `page.goto` vuelve a la semilla.** Los datos que crea un test no los ve
  otro, y si un test crea algo y navega con un link (sin recargar), lo sigue viendo.
- **Los usuarios de ejemplo** y su rol están en [MOCKS.md](MOCKS.md#sesión-simulada).
- **`test.use({ sessionUser: 'mrios' })`** arranca el test logueado: escribe la
  sesión simulada en `localStorage` antes de que cargue la app, y cuando la app
  pide `POST /auth/refresh` al arrancar, el mock la reconoce. Sin `sessionUser`
  el test arranca sin sesión. Para una sesión vencida por inactividad,
  `seedSession(page, usuario, { expiredByInactivity: true })` de
  `e2e/support/session.ts`.
- Los tests del Sprint 1 ya usan el usuario del rol que les corresponde
  (`mrios` para clientes, `lbenitez` para proveedores), así que no hay que
  tocarlos cuando los mocks empiecen a pedir sesión.

## Cobertura

### Sprint 1 — 21 tests, en verde

| Feature     | Archivo                                     | Casos de uso    | Qué cubre                                                                                     |
| ----------- | ------------------------------------------- | --------------- | --------------------------------------------------------------------------------------------- |
| Rubros      | `catalogs/categories/categories.e2e.spec.ts`  | CU-41 a CU-44   | Listado y búsqueda sin acentos, alta y mínimo de 3, nombre repetido, reactivación (el alta de un dado de baja se ve como un alta), edición, baja bloqueada por fábricas activas |
| Encargados  | `catalogs/customers/customers.e2e.spec.ts`    | CU-01 a CU-04   | Listado con fábrica, búsqueda, alta, "al menos un contacto", mail repetido en la fábrica, edición, baja |
| Fábricas    | `catalogs/customers/factories.e2e.spec.ts`    | CU-58 a CU-61   | Búsqueda por CUIT y filtro por rubro, alta que abre "Agregar encargado", CUIT inválido y repetido, edición sin CUIT, baja bloqueada con encargados y baja permitida |
| Proveedores | `catalogs/suppliers/suppliers.e2e.spec.ts`    | CU-33 a CU-36   | Listado sin dados de baja, búsqueda por CUIT, filtro por tipo, alta, razón social repetida, edición, baja múltiple |

### Sprint 2 — 30 tests, en rojo hasta que existan las pantallas

Son la **especificación ejecutable** del sprint: se escribieron antes que las
pantallas, a partir del prototipo y del contrato. Mientras se implementa cada
feature, el objetivo es llevar su archivo a verde.

| Feature          | Archivo                                           | Casos de uso       | Qué cubre                                                                                    |
| ---------------- | ------------------------------------------------- | ------------------ | -------------------------------------------------------------------------------------------- |
| Sesión           | `auth/session.e2e.spec.ts`                          | CU-53, CU-52, RNF09 | Redirección al ingreso, campos vacíos, credenciales malas, usuario dado de baja, bloqueo al 5.º intento, usuario bloqueado, pantalla inicial por rol y recarga, inicio vacío (JT), sesión expirada, acceso denegado, cerrar sesión, confirmación con datos sin guardar |
| Empleados        | `catalogs/employees/employees.e2e.spec.ts`          | CU-45, CU-47       | Listado, búsqueda por puesto, dados de baja, alta, obligatorios, DNI repetido, detalle con y sin usuario |
| Usuarios         | `catalogs/users/users.e2e.spec.ts`                  | CU-05, CU-07       | Listado con bloqueados, filtro por rol, dados de baja, alta con nombre propuesto, validaciones, usuario repetido, empleado que ya tiene usuario, aviso de bloqueado |
| Tipos de proceso | `catalogs/process-types/process-types.e2e.spec.ts`  | CU-09, CU-10, CU-11 | Un `describe` por historia (DTC-203/204/205). Listado ordenado, búsqueda y sin resultados; detalle con historial; alta con precios vinculados, cotización precargada y "Restablecer", sin cotización (502), obligatorios, precios inválidos y nombre repetido; modificación por dólar y por pesos con "Confirmar cambios", sólo descripción, nombre de otro tipo y "No hay cambios para guardar"; acceso denegado a JT, ER, ERP y AS |
| Materiales       | `catalogs/materials/materials.e2e.spec.ts`          | CU-37, CU-39       | Filtro por material con orden natural, búsqueda por calidad, alta con la grafía existente, obligatorios y combinación repetida |

#### Lo que estos tests esperan de las pantallas del Sprint 2

Salen del prototipo (`docs/prototipo/`). Si al implementar se decide otra cosa,
se cambia el test en el mismo PR:

- **URLs** (en `e2e/support/routes.ts`, un solo lugar): `/ingresar`,
  `/administracion`, `/administracion/empleados[/nuevo|/:id]`,
  `/administracion/usuarios[/nuevo|/:id]`, `/catalogos/tipos-de-proceso[/nuevo|/:id]`
  y `/catalogos/materiales`.
- **Ingreso:** título "Ingresar", campos "Nombre de usuario" y "Contraseña",
  botón "Ingresar"; los errores de credenciales con `role="alert"`; después de
  cerrar sesión, "Cerraste sesión correctamente".
- **Menú:** botón "Cerrar sesión"; sólo los módulos que permite el rol.
- **Sistema:** "Acceso denegado" (encabezado) y, para JT y ER, "Hola, {nombre}" y
  "Todavía no hay módulos disponibles para tu rol."
- **Listados:** el total en el encabezado ("11 empleados activos"), el buscador
  como `searchbox` con el placeholder del prototipo, los filtros como `combobox`
  ("Filtrar por rol", "Filtrar por material") y el checkbox "Incluir dados de baja".
- **Formularios:** cada campo con su `<label>` asociado (el componente `Input` ya
  lo garantiza) y los textos de error y avisos del prototipo y del contrato.
- **Usuario nuevo:** el buscador "Empleado" muestra sugerencias como `option` (con
  "Ya tiene usuario" si corresponde) y "Permisos" es un `combobox` con una
  `listbox` de opciones múltiples.

## Problemas que encontraron los tests

Al escribir el Sprint 1 aparecieron dos bugs de la app, ya corregidos:

1. **"Editar" guardaba solo** en el detalle de encargado y de fábrica: tocarlo
   enviaba el formulario y volvía a modo lectura con "actualizado". React
   reutilizaba el mismo `<button>` y lo convertía en el `type="submit"` de
   "Guardar cambios" durante el mismo click. Se resolvió con `key` distintos en
   los dos botones (`CustomerDetailPage.tsx`, `FactoryDetailPage.tsx`).
2. **Rótulos sin asociar:** el `Input` compartido no tenía `id` cuando no se lo
   pasaban, así que en los formularios de encargado y fábrica el `<label>` no
   apuntaba al campo (un lector de pantalla los anunciaba sin nombre). Ahora genera
   uno con `useId` (`shared/components/ui/Input.tsx`).

## Pendientes y observaciones

- Lo que no está mockeado (el `502` del tipo de cambio, el vencimiento del
  `accessToken`) tampoco se puede probar acá: ver [MOCKS.md](MOCKS.md#lo-que-no-está-mockeado).
- Los tests corren sólo en Chromium y en escritorio. El menú de celular no está
  cubierto.
- No están en CI. Para sumarlos, en el job `frontend` de `.github/workflows/ci.yaml`
  alcanza con `npx playwright install --with-deps chromium` y
  `npm run test:e2e:sprint1`.

## Para el futuro CLAUDE.md

Reglas que conviene pasarle tal cual:

- Los tests E2E del frontend están en `frontend/e2e/`, uno por feature, y se
  corren con `npm run test:e2e:sprint1` / `test:e2e:sprint2` desde `frontend/`.
- Después de tocar una pantalla o un mock del Sprint 1, correr
  `npm run test:e2e:sprint1`: tiene que quedar en verde.
- Un test nuevo va en el archivo de su feature, con el `describe` etiquetado
  (`[CU-xx]` + `@sprintN`), selectores por rol o rótulo, y `test.use({ sessionUser })`
  con un usuario del rol que corresponde.
- Si un test no encuentra un elemento por rol o rótulo, primero revisar la
  accesibilidad de la pantalla antes de cambiar el selector.
- Los datos de los tests salen de los mocks: si se cambia una semilla, revisar
  los tests que la nombran (las reglas de los mocks están en `MOCKS.md`).
- No importar código de `src/` desde `e2e/`: los tests ven la app como un usuario.
