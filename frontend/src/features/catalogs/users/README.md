# Usuarios: registrar y consultar (DTC-129 CU-05 · DTC-131 CU-07)

Las cuentas de acceso al sistema. Cada usuario pertenece a un empleado ya registrado (de él toma nombre y apellido) y tiene uno o varios roles. Sólo el Administrador del Sistema (`AS`). La fuente de verdad es el contrato del Sprint 2 ([`API_CONTRACT_SPRINT_2.md`](../../../../../docs/api-contract/API_CONTRACT_SPRINT_2.md), §3.3). Modificar, desbloquear y dar de baja (CU-06, CU-08) y la contraseña provisoria (CU-54) quedan para otro sprint.

Rutas: `/administracion/usuarios` (listado), `/administracion/usuarios/nuevo` (alta, acepta `?employeeId=`) y `/administracion/usuarios/:id` (detalle).

## Registrar usuario (DTC-129, CU-05)

| Paso | Qué pasa | Dónde |
| --- | --- | --- |
| Entrada | "+ Nuevo usuario" del listado, o "Crear usuario" del detalle de un empleado sin usuario (llega con `?employeeId=` y ese empleado ya elegido) | `pages/UsersPage.tsx`, `pages/NewUserPage.tsx` |
| Empleado | Buscador "Empleado": al hacer clic muestra los primeros 8 empleados activos (`GET /employees?limit=8`) y al tipear, los que coinciden. Los que ya tienen usuario llevan "Ya tiene usuario"; si se elige uno así, aviso con enlace a su usuario | `components/EmployeePicker.tsx` |
| Empleado nuevo | "¿No aparece? + Registrar empleado" abre `EmployeeFormModal` (de Empleados). Al registrarlo queda elegido, con el aviso "Empleado registrado y elegido para el usuario.", sin perder lo ya cargado | `components/UserForm.tsx` |
| Nombre de usuario | Se propone inicial + apellido (`mcastro`), con un número si ya existe (`mcastro2`), sin pisar lo escrito a mano (D-23) | `utils/username.ts`, `UserForm.tsx` |
| Contraseña | 8 a 72 caracteres, "Repetir contraseña" y "Generar" son del formulario: a la API llega una sola (D-24) | `components/PasswordField.tsx`, `schemas/user.schema.ts` |
| Permisos | Desplegable de selección múltiple; al menos un rol. Viajan en el orden del catálogo | `components/RolesSelect.tsx` |
| Alta | `POST /users` → `201`, aviso "Usuario registrado correctamente" y detalle del usuario ("Nunca ingresó") | `api/users.api.ts`, `NewUserPage.tsx` |
| Errores | `VALIDATION_ERROR`, `USERNAME_TAKEN` y `EMPLOYEE_ALREADY_HAS_USER` van en su campo según `details`; `EMPLOYEE_INACTIVE` (sin `details`) sobre "Empleado" | `NewUserPage.tsx` |

La ventana de alta de empleado va **afuera** del `<form>` del usuario: si quedara adentro, su envío subiría por el árbol de React y mandaría también el formulario de usuario.

## Consultar usuarios (DTC-131, CU-07)

| Paso | Qué pasa | Dónde |
| --- | --- | --- |
| Listado | `GET /users` con `page` y `limit=20`, ordenado por nombre de usuario. Columnas: Nombre de usuario, Empleado, Roles, Estado y Último acceso ("Nunca ingresó" si es `null`) | `pages/UsersPage.tsx` |
| Encabezado | "8 usuarios activos": llamada aparte con `limit=1` sin filtros; cuenta activos y bloqueados (D-28) | `useUsersCount` |
| Búsqueda | "Buscar por usuario o empleado" manda `search` (300 ms de espera al tipear); la API ignora mayúsculas y acentos | `UsersPage.tsx` |
| Filtro por rol | "Todos los roles" y los seis, en el orden del catálogo; manda `role` | ídem |
| Dados de baja | "Incluir dados de baja" manda `includeInactive=true`; los inactivos van en gris. Los bloqueados se listan siempre | ídem |
| Sin resultados | "No se encontraron usuarios con ese criterio", "Probá con otro rol o incluí los dados de baja." y "+ Nuevo usuario" | ídem |
| Detalle | Usuario, empleado, roles, estado, último acceso y alta, con el aviso de inactivo o bloqueado. `404` o id no numérico: "No encontramos el usuario que buscabas." | `pages/UserDetailPage.tsx` |
| Sin permiso | Otro rol ve "Acceso denegado" | `app/router/guards.tsx` |

Estado en pantalla: Activo en verde, Bloqueado en ámbar (el prototipo lo pinta rojo, pero `Badge` no tiene rojo) e Inactivo en neutral.

## Tests (`e2e/catalogs/users/users.e2e.spec.ts`)

| Historia | Escenarios cubiertos | Sin test |
| --- | --- | --- |
| DTC-129 | 1 a 6 y 8; además el buscador al hacer clic y la llegada con `?employeeId=` | 7 (empleado dado de baja: el buscador no los ofrece) y 9 (lo cubre el guard de la ruta) |
| DTC-131 | 1 a 8 | El rol inexistente (400) es sólo de la API; la paginación, porque la semilla tiene 9 usuarios |

## Qué hace cada archivo

| Archivo | Para qué sirve |
| --- | --- |
| `types/user.ts`, `types/employee-option.ts` | Tipos del contrato y el recorte de empleado que usa el buscador |
| `api/users.api.ts` | `listUsers`, `countUsers`, `getUser`, `createUser`, `findSimilarUsernames`, `searchEmployeeOptions` y `getEmployeeOption` |
| `api/users.keys.ts` | Claves de React Query. `count()` cuelga de `lists()`; las del buscador cuelgan de `['employees']` |
| `api/users.queries.ts` | `useUsers`, `useUsersCount`, `useUser`, `useEmployeeOptions(search, enabled)`, `useEmployeeOption(id)` y `useCreateUser` |
| `api/users.mocks.ts`, `users.db.ts` | Mocks de MSW y la semilla (7 activos, `hfunes` bloqueado, `ogimenez` dado de baja) |
| `schemas/user.schema.ts` | Validación del alta con zod |
| `utils/` | Nombre propuesto, contraseña generada, fechas en hora de Córdoba y rutas |
| `components/` | `UserForm`, `EmployeePicker`, `PasswordField`, `RolesSelect` |
| `pages/` | `UsersPage`, `NewUserPage`, `UserDetailPage` |
| `index.ts` | Las tres páginas, lo único que se usa desde afuera |

Fuera de la feature: la tarjeta en el panel Administración (`catalogs/panels/panels.ts`) y las rutas en `app/router/index.tsx`.
