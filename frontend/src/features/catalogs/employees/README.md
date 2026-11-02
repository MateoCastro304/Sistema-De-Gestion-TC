# Empleados: registrar (DTC-28 CU-45)

Alta de las personas que trabajan en Tornería Castro, con sus datos personales y su puesto, para asignarlas como responsables y, si corresponde, crearles un usuario. Sólo el Administrador del Sistema (`AS`). La fuente de verdad es el contrato del Sprint 2 ([`API_CONTRACT_SPRINT_2.md`](../../../../../docs/api-contract/API_CONTRACT_SPRINT_2.md), §3.2). Consultar empleados es DTC-201; modificar y dar de baja quedan para otro sprint.

## Cómo funciona

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

## Tests (`e2e/catalogs/employees/employees.e2e.spec.ts`)

Cada escenario de la historia tiene su test, y el id `[DTC-28]` marca los agregados con esta historia.

| Escenario | Test |
| --- | --- |
| 1. Alta exitosa | `registra un empleado` |
| 2. Obligatorios incompletos y 3. DNI duplicado | `valida los obligatorios y no repite el DNI` |
| 4. Acceso denegado a otros roles | `[DTC-28] deniega el acceso al alta` (entra `mrios`, rol `ERP`) |
| 5. Formato inválido | `[DTC-28] marca los formatos inválidos y no registra` (DNI de 3 dígitos, email sin arroba) |
| 6. Homónimo con otro DNI | `[DTC-28] un homónimo con otro DNI se registra sin pedir confirmación` (otro Walter Castro, DNI distinto) |
| 7. Alta desde el formulario de usuario | **Pendiente:** depende del formulario de usuario (DTC-129) |

Dos tests quedan fallando a propósito, porque son de otras historias: "lista los empleados activos…" (el listado completo es DTC-201) y el último paso de "el detalle muestra su usuario…" (la pantalla de usuarios es DTC-129). Hoy `/administracion/empleados` sólo trae el botón "+ Nuevo empleado".

Ajustes a tests que ya existían: la opción `Jefe` se busca con `/^Jefe$/` (si no, también coincide con "Jefe de taller") y `wcastro` con `exact: true` (el email del empleado también lo contiene). El desplegable de Puesto muestra "Seleccioná un puesto" y no "Elegí el puesto" para que ese texto sea sólo el del error.

## Archivos

`api/` (`employees.api.ts`, `.keys.ts`, `.queries.ts`; los mocks ya estaban), `schemas/employee.schema.ts`, `utils/errorMessages.ts`, `components/EmployeeForm.tsx` y `EmployeeFormModal.tsx`, `pages/` (`EmployeesPage`, `NewEmployeePage`, `EmployeeDetailPage`) e `index.ts`. Fuera de la feature: el panel Administración en `catalogs/panels/panels.ts`, sus rutas en `app/router/index.tsx`, el grupo del menú en `app/layouts/AppLayout.tsx` y el ícono `empleado` en `shared/components/ui/EntityIcon.tsx`.

Correr: `npx playwright test e2e/catalogs/employees`.
