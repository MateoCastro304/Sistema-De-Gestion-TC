# Empleados: registrar y consultar (DTC-28 CU-45 · DTC-201 CU-47)

Las personas que trabajan en Tornería Castro, con sus datos personales y su puesto, para asignarlas como responsables y, si corresponde, crearles un usuario. Sólo el Administrador del Sistema (`AS`). La fuente de verdad es el contrato del Sprint 2 ([`API_CONTRACT_SPRINT_2.md`](../../../../../docs/api-contract/API_CONTRACT_SPRINT_2.md), §3.2). Modificar y dar de baja (CU-48) quedan para otro sprint.

Rutas: `/administracion/empleados` (listado), `/administracion/empleados/nuevo` (alta) y `/administracion/empleados/:id` (detalle).

## Registrar empleado (DTC-28, CU-45)

| Paso | Qué pasa | Dónde |
| --- | --- | --- |
| Entrada | En Empleados, "+ Nuevo empleado" lleva a `/administracion/empleados/nuevo` | `pages/EmployeesPage.tsx` |
| Formulario | Nombre, Apellido, DNI y Puesto son obligatorios; Dirección, Email y Teléfono son opcionales. Se valida antes de llamar a la API | `components/EmployeeForm.tsx`, `schemas/employee.schema.ts` |
| Alta | `POST /employees` → `201` con `active: true` y `user: null`. Un opcional vacío viaja como `null` y los textos sin espacios en los bordes | `api/employees.api.ts` |
| Después del alta | Aviso "Empleado registrado correctamente" y detalle del empleado. Sin usuario muestra "Este empleado todavía no tiene usuario." y el enlace "Crear usuario" (opcional) | `pages/EmployeeDetailPage.tsx` |
| Errores | `VALIDATION_ERROR` y `EMPLOYEE_DNI_TAKEN` se muestran en su campo según `details[].field`; se decide por `code`, no por el texto | `utils/errorMessages.ts` |
| Sin permiso | Otro rol ve "Acceso denegado" y el formulario no se monta; la API responde `403` | `app/router/guards.tsx` |
| Desde el usuario | `EmployeeFormModal` es el mismo formulario en una ventana, para "+ Registrar empleado" del alta de usuario (DTC-129) | `components/EmployeeFormModal.tsx` |

Reglas del contrato: DNI de 7 u 8 dígitos sin puntos, único entre todos los empleados (también los dados de baja); nombre y apellido hasta 100 caracteres; dirección 200, email 120 y teléfono 50. Un homónimo con otro DNI se registra sin pedir confirmación (D-18). El puesto no es el rol (RN44).

## Consultar empleados (DTC-201, CU-47)

| Paso | Qué pasa | Dónde |
| --- | --- | --- |
| Listado | `GET /employees` con `page` y `limit=20`. Viene ordenado por apellido y nombre; sin `includeInactive` sólo trae los activos. Columnas: Empleado (apellido, nombre y DNI), Puesto, Usuario y Roles (vacías si no tiene usuario) | `pages/EmployeesPage.tsx`, `api/employees.api.ts` |
| Encabezado | "11 empleados activos": una llamada aparte con `limit=1` y sin filtros, de la que se toma `total`. No cambia al buscar | `useEmployeesCount` |
| Búsqueda | "Buscar por nombre, apellido, DNI o puesto" manda `search` a la API (con 300 ms de espera al tipear); la API ignora mayúsculas y acentos. Buscar o filtrar vuelve a la página 1 | `pages/EmployeesPage.tsx` |
| Sin resultados | `200` con `items` vacío: "No hay empleados que coincidan con la búsqueda." (no es un error). Con la lista vacía y sin búsqueda: "Todavía no hay empleados registrados." | ídem |
| Dados de baja | "Incluir dados de baja" manda `includeInactive=true`; los inactivos se ven en gris con la etiqueta "Inactivo" | ídem |
| Detalle | Datos personales y contacto, y el recuadro "Usuario del sistema" con nombre de usuario, roles y **estado** (Activo, Bloqueado o Inactivo). Sin usuario: "Este empleado todavía no tiene usuario." y "Crear usuario" (a `/administracion/usuarios/nuevo?employeeId=…`) | `pages/EmployeeDetailPage.tsx` |
| Dado de baja | En el detalle aparece el aviso "Este empleado está dado de baja." y no se ofrece "Crear usuario" | ídem |
| No existe | `404 EMPLOYEE_NOT_FOUND`, `400 INVALID_PATH_PARAMETER` o un id que no es número (ni siquiera se llama a la API): "No se encontró el empleado." Cualquier otro error muestra "No se pudo cargar el empleado." | ídem |
| Sin permiso | Otro rol ve "No tenés permisos para realizar esta operación."; la API responde `403` | `app/router/guards.tsx` |

Fuera de esta historia: el buscador de empleado del alta de usuario (escenario 8, `limit=8`, etiqueta "Ya tiene usuario") es de DTC-129; el filtro `hasUser` y los parámetros inválidos (escenario 9) son sólo de la API. `listEmployees` ya acepta `limit` y `hasUser`, para reutilizarlo después.

## Qué hace cada archivo

| Archivo | Para qué sirve |
| --- | --- |
| `types/employee.ts` | Tipos del contrato (`Employee`, `EmployeeCreate`, `EmployeeListParams`), los puestos con sus rótulos y `USER_STATUS_LABELS` (estado del usuario en pantalla) |
| `api/employees.api.ts` | Llamadas HTTP: `listEmployees`, `countEmployees` (para el encabezado), `getEmployee` y `createEmployee` |
| `api/employees.keys.ts` | Claves de React Query. `list(params)` y `count()` cuelgan de `lists()`, así el alta refresca el listado **y** el encabezado |
| `api/employees.queries.ts` | Hooks: `useEmployees` (conserva la página anterior mientras carga la siguiente), `useEmployeesCount`, `useEmployee` (no pide nada si el id no es un entero positivo) y `useCreateEmployee` |
| `api/employees.mocks.ts`, `employees.db.ts` | Mocks de MSW y datos semilla (11 activos y Omar Giménez, id 12, dado de baja con usuario inactivo). Ya estaban hechos; no se tocaron |
| `schemas/employee.schema.ts` | Validación del formulario con zod |
| `utils/errorMessages.ts` | Traduce los errores de la API a mensajes por campo |
| `components/EmployeeForm.tsx`, `EmployeeFormModal.tsx` | Formulario de alta, en página y en ventana |
| `pages/EmployeesPage.tsx` | Listado de CU-47 con búsqueda, dados de baja, paginación y el acceso al alta |
| `pages/NewEmployeePage.tsx` | Pantalla del alta |
| `pages/EmployeeDetailPage.tsx` | Detalle del empleado y de su usuario |
| `index.ts` | Lo único que se usa desde afuera de la feature |

Fuera de la feature: el panel Administración en `catalogs/panels/panels.ts`, sus rutas en `app/router/index.tsx`, el grupo del menú en `app/layouts/AppLayout.tsx` y el ícono `empleado` en `shared/components/ui/EntityIcon.tsx`.

## Tests (`e2e/catalogs/employees/employees.e2e.spec.ts`)

El id `[DTC-28]` o `[DTC-201]` en el nombre marca los tests agregados con cada historia.

### DTC-28 (registrar)

| Escenario | Test |
| --- | --- |
| 1. Alta exitosa | `registra un empleado` |
| 2. Obligatorios incompletos y 3. DNI duplicado | `valida los obligatorios y no repite el DNI` |
| 4. Acceso denegado a otros roles | `[DTC-28] deniega el acceso al alta` (entra `mrios`, rol `ERP`) |
| 5. Formato inválido | `[DTC-28] marca los formatos inválidos y no registra` (DNI de 3 dígitos, email sin arroba) |
| 6. Homónimo con otro DNI | `[DTC-28] un homónimo con otro DNI se registra sin pedir confirmación` (otro Walter Castro, DNI distinto) |
| 7. Alta desde el formulario de usuario | **Pendiente:** depende del formulario de usuario (DTC-129) |

Ajustes a tests que ya existían: la opción `Jefe` se busca con `/^Jefe$/` (si no, también coincide con "Jefe de taller") y `wcastro` con `exact: true` (el email del empleado también lo contiene). El desplegable de Puesto muestra "Seleccioná un puesto" y no "Elegí el puesto" para que ese texto sea sólo el del error.

### DTC-201 (consultar)

| Escenario | Test |
| --- | --- |
| 1. Listado | `lista los empleados activos, busca por puesto e incluye los dados de baja` (ya existía; cubre el encabezado "11 empleados activos") y `[DTC-201] el listado muestra puesto, usuario y roles, ordenado por apellido y nombre` |
| 2. Búsqueda y 3. Sin resultados | `[DTC-201] busca sin distinguir mayúsculas ni acentos y avisa si no hay resultados` (`MONICA` encuentra a Mónica Ríos; `GIMENEZ` no encuentra a Omar porque está de baja) |
| 4. Acceso denegado | `[DTC-201] deniega el acceso al listado` (entra `mrios`) |
| 5. Dados de baja | Dentro de `lista los empleados activos…`: tilda "Incluir dados de baja" y Omar aparece como "Inactivo" |
| 6. Detalle | `[DTC-201] abre el detalle desde el listado`, `[DTC-201] el recuadro de usuario muestra el estado` y `[DTC-201] el detalle de un empleado dado de baja lo avisa` (Omar, id 12) |
| 7. Empleado inexistente | `[DTC-201] informa si el empleado no existe o el identificador no es un número` (id 99 y `/abc`) |
| 8. Buscador del alta de usuario | **Pendiente:** es de DTC-129 |
| 9. `hasUser` y parámetros inválidos | **Sin test:** son sólo de la API, no hay pantalla |

Sin cubrir: **la paginación de a 20**, porque los datos del mock tienen 12 empleados y no alcanzan para una segunda página.

Un test sigue fallando a propósito: el último paso de `el detalle muestra su usuario o el acceso para crearlo` espera ver "Matías Castro" en el alta de usuario, que es DTC-129.

Por qué se agregaron estos tests: el único que había cubría el listado de punta a punta pero no las columnas, el orden, la búsqueda sin acentos, el "sin resultados", el aviso de baja, el estado del usuario ni el empleado inexistente, que son criterios de aceptación de la historia.

## Correr

```bash
npx playwright test e2e/catalogs/employees --workers=2
```

Con los workers por defecto el servidor de desarrollo se satura y los `page.goto` dan timeout (también en tests que andan); con 2 anda bien.
