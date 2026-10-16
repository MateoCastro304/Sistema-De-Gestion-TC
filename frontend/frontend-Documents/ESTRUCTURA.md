# Estructura del frontend

Este documento es el mapa de `frontend/src/`: qué hay en cada carpeta, qué puede importar cada una, cómo se nombran las cosas y en qué módulo vive cada épica de Jira. Lo que hay adentro de `shared/` está detallado en [SHARED.md](SHARED.md); los mocks de la API, en [MOCKS.md](MOCKS.md), y los tests, en [TESTING.md](TESTING.md).

Las reglas entre carpetas no son solo una convención: las hace cumplir ESLint (`frontend/eslint.config.js`). El lint corre con `--max-warnings 0`, así que un import prohibido rompe el CI.

---

## 1. Mapa general

```
frontend/src/
├── app/                    # Composición: arranca la app y conecta todo
│   ├── main.tsx            # Punto de entrada (monta React, arranca MSW en desarrollo)
│   ├── App.tsx
│   ├── router/             # Rutas, ErrorPage, NotFoundPage
│   ├── layouts/            # AppLayout: menú lateral, miga de pan y marco de todas las pantallas
│   ├── providers/          # Contextos globales: React Query, notificaciones (toasts), miga de pan
│   └── mocks/              # Junta los *.mocks.ts de cada feature para MSW (ver MOCKS.md)
│
├── features/               # Un módulo por área de negocio
│   ├── auth/               # Sesión: ingreso y cierre
│   ├── catalogs/           # Catálogos (ABM de datos maestros)
│   │   ├── panels/         # Paneles de tarjetas "Clientes" y "Gestión" (navegación)
│   │   ├── categories/     # Rubros
│   │   ├── customers/      # Encargados clientes y fábricas
│   │   ├── employees/      # Empleados
│   │   ├── materials/      # Materiales
│   │   ├── process-types/  # Tipos de proceso
│   │   ├── suppliers/      # Proveedores
│   │   └── users/          # Usuarios
│   ├── requests/           # Solicitudes de cotización
│   ├── quotations/         # Cotizaciones (incluye pages/wizard/)
│   ├── parts/              # Piezas e historial por número de plano
│   ├── work-orders/        # Órdenes de trabajo
│   └── reports/            # Reportes y estadísticas
│
├── shared/                 # Infraestructura técnica reutilizable, sin lógica de negocio (ver SHARED.md)
│   ├── api/                # Cliente HTTP, ApiError, paginación, queryClient
│   ├── components/
│   │   ├── ui/             # Button, Input, Table, Modal, PageHero... (exporta por index.ts)
│   │   ├── forms/          # (vacía por ahora)
│   │   └── feedback/       # EmptyState
│   ├── hooks/              # usePagedList
│   ├── lib/                # Funciones puras: cn, cuit, formatPhone, normalizeText...
│   ├── mocks/              # Helpers de los mocks de MSW: errores, paginado, textos, sesión simulada
│   └── types/              # (vacía por ahora)
│
├── domain/                 # Tipos y reglas de negocio compartidos por varias features
│   └── roles.ts            # Los 6 roles del sistema y la matriz de permisos (ver sección 1.1)
│
├── api-contract/           # Tipos generados a partir del contrato OpenAPI (vacía por ahora)
├── assets/                 # Fotos del taller (.webp) y logos
└── styles/                 # styles.css global
```

Fuera de `src/`, en `frontend/`:

```
frontend/
├── e2e/                    # Tests E2E con Playwright, un archivo por feature (ver TESTING.md)
├── frontend-Documents/     # Esta documentación: ESTRUCTURA, SHARED, MOCKS y TESTING
├── playwright.config.ts
└── tsconfig.e2e.json       # TypeScript de los tests
```

Las carpetas vacías se mantienen con un `.gitkeep` para que la estructura exista desde el principio. Estado actual:

- **Con pantallas (Sprint 1):** `catalogs/panels`, `categories`, `customers` y `suppliers`.
- **Con tipos y mocks, sin pantallas todavía (Sprint 2):** `auth`, `catalogs/employees`, `users`, `process-types` y `materials`. Sus tipos (`types/`) siguen el contrato del Sprint 2 y sus mocks (`api/*.mocks.ts`) ya responden todos los endpoints, así que las pantallas se pueden hacer sin backend.
- **Solo el esqueleto:** `requests`, `quotations`, `parts`, `work-orders` y `reports`.

### 1.1 Roles y permisos (`domain/roles.ts`)

Los roles del sistema son **exactamente seis**, los del enumerado `Role` del contrato del Sprint 2 (`docs/api-contract/API_CONTRACT_SPRINT_2.md`, §2 y D-11). No se agregan ni se administran (RN44):

| Código | Rol                       | Qué opera                                                        |
| ------ | ------------------------- | ---------------------------------------------------------------- |
| `JT`   | Jefe de Taller            | Todavía ningún módulo                                            |
| `ERP`  | Encargado de Recepción    | Encargados, fábricas y rubros                                    |
| `EC`   | Encargado de Cotización   | Lo del Administrativo Técnico (lo hereda, D-12)                   |
| `ER`   | Encargado de Reportes     | Todavía ningún módulo                                            |
| `AT`   | Administrativo Técnico    | Proveedores, materiales y tipos de proceso                       |
| `AS`   | Administrador del Sistema | Empleados y usuarios                                             |

Un usuario puede tener varios roles (`Rol[]`, nunca un `Rol` solo) y sus permisos son la suma. `roles.ts` exporta:

- `ROLES`, `Rol`, `ROLE_ORDER` (el orden del contrato, que es el de los desplegables y el de las listas que devuelve la API), `ROL_LABEL` y `ROL_DESCRIPTION`.
- `MODULE_ROLES`: la matriz de permisos del contrato ("Matriz por recurso", §4): qué roles operan cada módulo. Es la única fuente de esa matriz; la usan los mocks y la van a usar los guards de las rutas.
- `hasAnyRole(userRoles, roles)` y `canAccess(userRoles, módulo)`.

Si cambia la matriz de permisos, se cambia en el contrato y en `MODULE_ROLES`, nunca en una pantalla.

### Adentro de una feature

Todas las features tienen la misma forma, así que conocer una es conocerlas todas:

```
features/<area>/<feature>/
├── api/          # Llamadas HTTP, query keys, hooks de React Query y mocks de MSW
├── components/   # Componentes que solo usa esta feature
├── pages/        # Pantallas que se montan en el router
├── schemas/      # Esquemas de validación (Zod) de los formularios
├── types/        # Tipos de la entidad (Customer, CustomerInput...)
├── utils/        # Funciones auxiliares propias de la feature (errorMessages.ts, etc.)
└── index.ts      # La única puerta de entrada desde afuera
```

En `api/` conviven el código de la app (`*.api.ts`, `*.keys.ts`, `*.queries.ts`) y los mocks, que solo se cargan en desarrollo (`*.db.ts` con los datos, `*.mocks.ts` con los handlers; ver [MOCKS.md](MOCKS.md)).

`panels` es la excepción: no llama al backend, así que solo tiene `pages/`, un `panels.ts` con la configuración de los paneles y su `index.ts`.

### Paneles y navegación

El menú lateral no lleva directo a los listados, sino a **paneles de tarjetas**. Cada panel agrupa varios catálogos:

| Panel      | Ruta                  | Tarjetas (listados)                          |
| ---------- | --------------------- | -------------------------------------------- |
| Clientes   | `/catalogos/clientes` | Encargados, Fábricas, Rubros                 |
| Gestión    | `/catalogos/gestion`  | Proveedores (Materiales y Tipos de proceso se suman en el sprint 2) |

En el Sprint 2 se suma el panel **Administración** (Empleados y Usuarios), como en el prototipo. El menú solo muestra los paneles y tarjetas que permiten los roles del usuario (`canAccess()`).

`features/catalogs/panels/panels.ts` es la fuente de verdad de esta agrupación. De ahí salen tres cosas:

- las tarjetas de `PanelPage`;
- qué ítem del menú marca `AppLayout`;
- la miga de pan de la barra superior (`panelOf()` dice de qué panel cuelga cada URL).

Para sumar un catálogo nuevo a un panel, alcanza con agregar una entrada en `items`. El listado muestra el enlace de vuelta a su panel con `PageHero back={…}`. En los detalles, el último tramo de la miga de pan (el nombre del registro) lo publica la pantalla con `useCrumbTitle()`.

### Rutas actuales

| Ruta                                   | Pantalla                |
| -------------------------------------- | ----------------------- |
| `/`                                    | Redirige a `/catalogos/clientes` |
| `/catalogos/clientes`, `/catalogos/gestion` | `PanelPage`        |
| `/catalogos/encargados`                | `CustomersPage`, `nuevo`, `:factoryId/:id` |
| `/catalogos/fabricas`                  | `FactoriesPage`, `nuevo`, `:id` |
| `/catalogos/rubros`                    | `CategoriesPage`        |
| `/catalogos/proveedores`               | `SuppliersPage`, `nuevo`, `:id` |
| `*`                                    | `NotFoundPage`          |

Todas cuelgan de un único `AppLayout`, así el menú no se vuelve a crear al cambiar de sección.

Las rutas del Sprint 2 que esperan los tests (`/ingresar`, `/administracion/...`, `/catalogos/materiales`, `/catalogos/tipos-de-proceso`) están en `frontend/e2e/support/routes.ts` y en [TESTING.md](TESTING.md).

### ¿Dónde pongo esto?

| Si el código...                                                        | Va en                     |
| ---------------------------------------------------------------------- | ------------------------- |
| conecta piezas de toda la app (rutas, layout, providers)               | `app/`                    |
| pertenece a un área de negocio concreta                                | `features/<area>/`        |
| es técnico y lo podría usar cualquier pantalla (un botón, `http.ts`)   | `shared/`                 |
| es una regla o tipo de negocio que necesitan varias features (roles)   | `domain/`                 |
| lo empezó a necesitar una segunda feature                              | se mueve a `shared/` o `domain/`, o se exporta en el `index.ts` de su feature |
| simula un endpoint del backend                                         | `features/<area>/<feature>/api/*.mocks.ts` (ver [MOCKS.md](MOCKS.md)) |
| es un test E2E                                                         | `frontend/e2e/<area>/<feature>/` (ver [TESTING.md](TESTING.md)) |

---

## 2. Las tres reglas entre carpetas

### Regla 1 — A una feature se entra solo por su `index.ts`

Desde afuera de una feature no se importan sus archivos internos (`api/`, `components/`, `pages/`, `schemas/`, `types/`, `utils/`). Lo que la feature quiere ofrecer lo exporta en su `index.ts`; lo demás es privado.

```ts
// ✅ Bien
import { CustomersPage } from '@/features/catalogs/customers'
import { PANELS } from '@/features/catalogs/panels'

// ❌ Mal: entra a un archivo interno
import { CustomersPage } from '@/features/catalogs/customers/pages/CustomersPage'
```

Así cada feature puede reorganizarse por dentro sin romper a nadie. Cuando otra feature necesita algo, se exporta en el `index.ts`. Por ejemplo, `categories` exporta `useCategories`, `categoryKeys` y `listCategories` para que el selector de rubro de Fábricas comparta la misma caché.

**Dos excepciones, las dos de los mocks:**

- `app/mocks/` importa directamente los `*.mocks.ts` de cada feature. Si los mocks se exportaran por el `index.ts`, MSW y los datos falsos terminarían en el bundle de producción.
- Un `*.mocks.ts` o un `*.db.ts` puede importar el `api/*.db.ts` y los `types/` de **otra** feature, como un JOIN del backend (una fábrica necesita que su rubro exista; un usuario, su empleado). ESLint lo permite solo en esos archivos y solo hacia esos destinos.

### Regla 2 — Las dependencias van en una sola dirección

```
app/  ──▶  features/  ──▶  shared/ y domain/
```

- **`app/`** puede usar todo (por ejemplo, `AppLayout` usa `PANELS` de la feature `panels`).
- **`features/`** usa `shared/` y `domain/`, y otras features solo a través de su `index.ts` (regla 1). De `app/` solo puede usar `app/providers`: `useToast()` para avisos y `useCrumbTitle()` para la miga de pan. Los mocks de una feature no pueden usar nada de `app/`.
- **`shared/` y `domain/`** no conocen ni `app/` ni `features/`.

Si una feature necesita algo de `app/` que no está en `providers`, o si varias features necesitan lo mismo, eso es señal de que tiene que moverse a `shared/`.

### Regla 3 — Para salir de tu carpeta, usá el alias `@/`

`@/` apunta a `src/` (configurado en `tsconfig.app.json` y en `vite.config.ts`). Dentro de la misma carpeta se usan rutas relativas cortas (`./`, `../`); para salir de ella, siempre `@/`. Nunca `../../`.

```ts
// ✅ Bien
import { Button } from '@/shared/components/ui'
import fotoEjes from '@/assets/foto-ejes.webp'
import { categoryKeys } from './categories.keys'

// ❌ Mal
import { Button } from '../../../shared/components/ui'
```

Esta regla es la que hace funcionar a las otras dos: ESLint reconoce la capa de destino mirando el `@/...` del import, y un `../../` le esconde de dónde viene el código.

Los tests de `frontend/e2e/` no importan nada de `src/`: ven la app como un usuario.

---

## 3. Nombres

### Carpetas y rutas

| Qué                       | Convención                              | Ejemplo                                   |
| ------------------------- | --------------------------------------- | ----------------------------------------- |
| Carpetas                  | inglés, `kebab-case`, en plural         | `work-orders/`, `process-types/`          |
| Rutas (URL)               | español, en minúsculas                  | `/catalogos/proveedores`, `/catalogos/rubros` |
| Alta / detalle            | `nuevo` y `:id` como subrutas           | `/catalogos/fabricas/nuevo`, `/catalogos/fabricas/:id` |

El código está en inglés; lo que ve el usuario (URLs, textos de pantalla) y los comentarios están en español.

### Archivos

| Qué                         | Convención                     | Ejemplo                                   |
| --------------------------- | ------------------------------ | ----------------------------------------- |
| Componentes                 | `PascalCase.tsx`               | `CustomersTable.tsx`, `FactoryFormModal.tsx` |
| Pantallas                   | `PascalCase` + `Page.tsx`      | `CustomersPage.tsx`, `NewCustomerPage.tsx`, `CustomerDetailPage.tsx` |
| Llamadas HTTP               | `<entidad>.api.ts`             | `customers.api.ts`                        |
| Query keys (React Query)    | `<entidad>.keys.ts`            | `customers.keys.ts` → exporta `customerKeys` |
| Hooks de React Query        | `<entidad>.queries.ts`         | `customers.queries.ts` → `useCustomers`, `useCreateCustomer` |
| Datos de los mocks          | `<entidad>.db.ts`              | `customers.db.ts` → exporta `customersDb` |
| Mocks de MSW                | `<entidad>.mocks.ts`           | `customers.mocks.ts` → exporta `customerHandlers` |
| Esquemas de validación      | `<entidad>.schema.ts`          | `customer.schema.ts`                      |
| Tipos                       | `<entidad>.ts` (singular)      | `types/customer.ts` → `Customer`, `CustomerInput` |
| Mensajes de error           | `utils/errorMessages.ts`       | `customerErrorMessage()`, `factoryErrorMessage()` |
| Hooks y utilidades          | `camelCase.ts`                 | `usePagedList.ts`, `formatPhone.ts`       |
| Barriles                    | `index.ts`                     | `features/catalogs/customers/index.ts`    |
| Tests E2E                   | `<feature>.e2e.spec.ts`        | `e2e/catalogs/customers/customers.e2e.spec.ts` |

### Pantallas por entidad

Cada catálogo repite el mismo trío: `<Entidades>Page` (listado), `New<Entidad>Page` (alta) y `<Entidad>DetailPage` (detalle y edición). Rubros es la excepción: el alta y la edición son un modal (`CategoryFormModal`) sobre el listado. Materiales también usa un modal para el alta ("Nuevo material") y no tiene detalle.

---

## 4. Épicas y módulos

Cada épica de Jira (proyecto **DTC**) se desarrolla en uno o más módulos de `features/`. Los casos de uso (CU) son los del documento *Casos de Uso V1.1* (`docs/domain/`).

| Épica      | Nombre                                      | Módulo(s) en `features/`                          | Casos de uso                     |
| ---------- | ------------------------------------------- | ------------------------------------------------- | -------------------------------- |
| DTC-34     | Gestión de Cotizaciones                     | `requests/`, `quotations/`                        | CU-13, 14, 15, 17, 18, 20, 21, 22, 23 |
| DTC-35     | Gestión de Órdenes de Trabajo               | `work-orders/`                                    | CU-19, 24 a 32                   |
| DTC-36     | Gestión de Reportes e Historial de Cotizaciones | `reports/`, `parts/`                          | CU-16, 49, 50, 51, 55, 56, 57    |
| DTC-87     | Gestión de Roles y Usuarios                 | `auth/`, `catalogs/users/`, `catalogs/employees/` | CU-5 a 8, 45 a 48, 52, 53, 54    |
| DTC-90     | Administrar Clientes                        | `catalogs/customers/`, `catalogs/categories/`     | CU-1 a 4, 41 a 44, 58 a 61       |
| DTC-106    | Administrar Proveedores                     | `catalogs/suppliers/`                             | CU-33 a 36                       |
| DTC-115    | Administrar Materiales                      | `catalogs/materials/`                             | CU-37 a 40                       |
| DTC-207    | Administrar Tipos de Proceso                | `catalogs/process-types/`                         | CU-9 a 12                        |

`catalogs/panels/` no pertenece a ninguna épica: es navegación compartida por los catálogos. Cuando una épica suma un catálogo, se agrega su tarjeta al panel que corresponda.

Notas sobre los límites entre épicas:

- **Registrar Orden de Compra (CU-23)** actúa sobre la cotización (la adjudica y fija el precio), por eso vive en `quotations/`, aunque es el paso que genera las órdenes de trabajo de `work-orders/`.
- **Historial de una pieza (CU-16)** va en `parts/`, porque se consulta por número de plano.
- **Rubros (CU-41 a 44)** tienen su propia carpeta (`catalogs/categories/`), pero son parte de Administrar Clientes porque clasifican a las fábricas. Por eso están en el panel Clientes.
- **Roles (RN44)** no son una feature: son un catálogo cerrado que vive en `domain/roles.ts` y lo usan `auth/`, `users/` y los guards de las rutas.
