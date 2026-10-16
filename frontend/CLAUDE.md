# CLAUDE.md — Frontend de Castro Tornería

SPA de gestión del taller (React 19 + TypeScript + Vite · React Router · TanStack
Query · axios sólo a través de `http` · react-hook-form + zod · MSW para los
mocks · Playwright para los E2E). Este archivo dice **cómo se programa una
feature, paso a paso**, y **qué entra en el sprint en curso**. El resto ya está
documentado: no lo repito, leelo.

## Se programa por historia de usuario

Cada tarea es **una historia de Jira** (proyecto **DTC**, ej. "DTC-33"). Antes
que nada, leé la historia con el conector de Atlassian (`getJiraIssue`): la
descripción, los **criterios de aceptación** (escenarios) y los comentarios. Si
no tenés acceso a Jira, pedile al usuario que pegue los criterios; no los
supongas.

- **Los criterios de aceptación definen qué está terminado.** Cada escenario
  tiene que quedar cubierto por un test E2E (o, si no se puede probar en el
  navegador, decí cuál queda sin cubrir y por qué).
- **Si un criterio choca con el contrato o el prototipo**, manda el contrato:
  ya resolvió varias diferencias (ej. D-13, D-14, D-18, D-25; ver §8). Si el
  contrato no lo resuelve, frená y preguntá. Nunca programes las dos versiones.
- **No programes otra historia "de paso"**, aunque comparta pantalla o
  componentes: termina la que se pidió.

## Antes de escribir código, leé

Todo en `frontend/frontend-Documents/`, salvo el contrato y el prototipo:

1. `ESTRUCTURA.md` — el mapa de `src/`, las tres reglas entre carpetas (las
   hace cumplir ESLint), los nombres, los roles y qué épica va en qué módulo.
2. `SHARED.md` — los componentes, `http`, `ApiError` y las utilidades. Tiene
   la tabla "Si necesitás X, usá Y" y su propia guía para Claude al final.
3. `docs/api-contract/API_CONTRACT_SPRINT_2.md` — **la fuente de verdad del
   backend** para este sprint (el Sprint 1 está en `docs/openapi/`). Leé la
   sección de los endpoints de la feature, §4 (sesión y permisos), §5 (errores)
   y §8 (decisiones y lo que queda afuera).
4. El prototipo, `docs/prototipo/` — **la fuente de verdad de las pantallas y
   sus textos**. Empezá por `fuente/CONTEXTO.md`. El `.dc.html` es muy grande:
   no lo leas entero, buscá en él la pantalla (`LISTAS`, `defsEmp`, `validar`,
   `aviso(` …) con grep.
5. `MOCKS.md` — cómo funcionan los mocks, los usuarios de prueba y cómo se
   agrega un endpoint.
6. `TESTING.md` — cómo están armados los tests E2E y qué espera cada uno de las
   pantallas del Sprint 2.

Si un documento y el contrato no coinciden, manda el contrato; si el contrato y
el prototipo no coinciden en una pantalla, el contrato ya lo resolvió (§8).

**Lo ya hecho del Sprint 1 sigue al backend.** Sus pantallas y mocks copian lo
que hace hoy `backend/src/subsystems/` (`customers/`: rubros, fábricas y
encargados; `supplier/`: proveedores). Si el backend cambia y una pantalla del
Sprint 1 sigue andando, se adaptan los mocks (y el test, si esperaba algo que la
app ya no muestra), no la pantalla. Ojo con los nombres: el backend llama
`Manager` al encargado (`/managers`, `/factories/{factoryId}/managers`), pero en
el frontend el módulo sigue siendo `customers`.

## Cómo se programa una feature

Siempre en este orden. No pases al paso siguiente sin terminar el anterior.

1. **Mocks al día.** Compará los `*.mocks.ts` y `*.db.ts` de la feature con el
   contrato (endpoints, cuerpos, códigos de error, mensajes, permisos). Si algo
   falta o difiere, corregí el mock primero, siguiendo `MOCKS.md`. Correr
   `npm run lint`.
2. **Tests al día.** Buscá el archivo de la feature en `frontend/e2e/` y
   compará sus tests con **los criterios de aceptación de la historia**, uno por
   uno. Si falta alguno, escribilo ahora, antes que la pantalla, siguiendo
   `TESTING.md`, con el id de la historia en el `describe` (`[DTC-33][CU-53]`).
   Correlos: los nuevos tienen que **fallar** porque la pantalla no existe, no
   por un error del test.
3. **La feature.** Recién ahora: tipos (si faltan) → `*.api.ts` → `*.keys.ts` →
   hooks → schema → componentes → página → ruta, ítem del menú y tarjeta del
   panel → lo que otro módulo necesite, en el `index.ts`.
4. **Verificar.** `npm run lint`, `npm run build`, los tests de la feature y
   `npm run test:e2e:sprint1` (tiene que seguir en verde). Si un test falla,
   arreglá la pantalla; cambiá el test sólo si el test está mal, y decí por qué.
5. **Contar qué quedó.** Criterio por criterio de la historia: hecho y con qué
   test, o pendiente y por qué. Más cualquier duda del contrato que haya
   aparecido.

Trabajá de a una feature por vez y en pasos chicos que se puedan revisar.

## Reglas que no se negocian

- **Sólo el sprint en curso.** Lo que el prototipo muestra y el contrato deja
  afuera (§8.3: solicitudes, cotización, modificar y dar de baja empleados y
  usuarios, cambiar contraseña, "A futuro") **no se programa**, ni deshabilitado.
- **No inventes nada.** Ni endpoints, ni campos, ni reglas, ni textos de
  pantalla, ni roles. Todo sale del contrato o del prototipo. Si algo no está en
  ninguno de los dos, **frená y preguntá**.
- **No te vayas de la feature.** No refactorices, no "mejores" ni arregles al
  paso código que no es parte de la tarea. Si ves un bug o algo raro afuera,
  avisalo y seguí con lo tuyo. Si el build, el lint o un test fallan por algo que
  no tocaste, avisá; no lo arregles.
- **No copies código ajeno**: ni de otros proyectos, ni de internet, ni del
  prototipo (su HTML no es React). Este proyecto tiene su sistema de diseño en
  `shared/` y `styles/`.
- **No mezcles patrones.** Si ya existe una forma de hacer algo en el proyecto,
  seguila (por ejemplo, `customers` y `categories` para un formulario con
  react-hook-form + zod).
- **No instales dependencias** ni cambies configuración (Vite, ESLint, tsconfig,
  Playwright) sin preguntar.
- **No toques el backend, el contrato ni los documentos** salvo que la tarea lo
  pida. Si encontrás un error en el contrato, avisá.
- **Los roles son seis** (`JT`, `ERP`, `EC`, `ER`, `AT`, `AS`) y la matriz de
  permisos es `MODULE_ROLES` de `@/domain/roles`. Nunca escribas códigos de rol
  ni permisos a mano en una pantalla: usá `canAccess()`.
- **Los errores se deciden por `code`** (Sprint 2) o por los getters de
  `ApiError`, nunca comparando `status` a mano.
- **Accesibilidad**: todo campo con su rótulo, todo botón de ícono con
  `aria-label`. Los tests buscan por rol y rótulo.
- **Código en inglés; textos de pantalla y comentarios en castellano**, con el
  vocabulario del taller (encargado, fábrica, rubro, tipo de proceso).
- **Imports con `@/`** para salir de la carpeta, nunca `../../`.
- **Git lo maneja el equipo**: no hagas commits, push ni cambios de rama salvo
  que te lo pidan. Si te lo piden, sin línea `Co-Authored-By`.

---

## Sprint 2 — qué se programa y dónde

Las once historias del sprint "DTC Sprint 2" (contrato, tabla del principio).
**Los mocks, los tipos y los tests E2E ya están hechos para todas**; faltan las
pantallas. Las rutas son las de `frontend/e2e/support/routes.ts`.

| Jira | CU | Historia | Módulo | Ruta | Tests |
| --- | --- | --- | --- | --- | --- |
| DTC-33 | 53 | Iniciar sesión | `auth/` | `/ingresar` | `e2e/auth/session.e2e.spec.ts` |
| DTC-32 | 52 | Cerrar sesión | `auth/` | (menú) | ídem |
| DTC-28 | 45 | Registrar empleado | `catalogs/employees/` | `/administracion/empleados/nuevo` | `e2e/catalogs/employees/` |
| DTC-201 | 47 | Consultar empleados | `catalogs/employees/` | `/administracion/empleados[/:id]` | ídem |
| DTC-129 | 05 | Registrar usuario | `catalogs/users/` | `/administracion/usuarios/nuevo` | `e2e/catalogs/users/` |
| DTC-131 | 07 | Consultar usuarios | `catalogs/users/` | `/administracion/usuarios[/:id]` | ídem |
| DTC-203 | 09 | Registrar tipo de proceso | `catalogs/process-types/` | `/catalogos/tipos-de-proceso/nuevo` | `e2e/catalogs/process-types/` |
| DTC-204 | 10 | Modificar tipo de proceso | `catalogs/process-types/` | `/catalogos/tipos-de-proceso/:id` | ídem |
| DTC-205 | 11 | Consultar tipos de proceso | `catalogs/process-types/` | `/catalogos/tipos-de-proceso` | ídem |
| DTC-116 | 37 | Registrar material | `catalogs/materials/` | (modal del listado) | `e2e/catalogs/materials/` |
| DTC-118 | 39 | Consultar materiales | `catalogs/materials/` | `/catalogos/materiales` | ídem |

Orden sugerido: **sesión primero** (todo lo demás la necesita), después empleados
→ usuarios → tipos de proceso → materiales.

**Al terminar la sesión**, todo el Sprint 1 pasa a exigir token (contrato §7.2):
pasá `SPRINT_1_REQUIRES_SESSION` a `true` en `src/app/mocks/handlers.ts` y
corré `npm run test:e2e:sprint1`.

### Lo que cambia sobre lo que ya está

El contrato (§8.4) lo detalla. En resumen:

- **`shared/api/http.ts`**: `getToken()` devuelve el `accessToken` guardado **en
  memoria**; ante `401 ACCESS_TOKEN_EXPIRED`, un solo `POST /auth/refresh` y se
  repiten las peticiones; ante `SESSION_EXPIRED` o `UNAUTHENTICATED`, al ingreso.
- **`ApiError`** suma `code` y `details: { field, message }[]`. Un `409` o `400`
  de un campo se muestra **en ese campo**.
- **Arranque**: antes de decidir si se muestra el ingreso, `POST /auth/refresh`.
- **Rutas y menú**: guards con `canAccess()`, pantalla "Acceso denegado" e
  inicio vacío ("Todavía no hay módulos disponibles para tu rol.") para JT y ER.
- **Paneles**: Materiales y Tipos de proceso entran en Gestión; Empleados y
  Usuarios, en un panel nuevo, Administración.

### Reglas del dominio de este sprint

Las completas están en el contrato; estas son las que más se olvidan:

- El nombre de usuario se compara **sin mayúsculas**; el resto de los textos
  únicos (tipo de proceso, material) **sin mayúsculas, acentos ni espacios
  repetidos** (§4, "Comparación de textos").
- Los precios del tipo de proceso **los calcula el formulario** con el tipo de
  cambio (pesos ÷ tipo de cambio = dólares, dos decimales) y la API los guarda
  tal cual (D-29). Modificar muestra "Confirmar cambios" con "anterior → nuevo",
  y "No hay cambios para guardar" sin llamar a la API.
- El historial de precios va **en dólares** (`previousValueUsd`, `newValueUsd`,
  `exchangeRateArs`); nombre y descripción no se registran (D-32).
- Empleados y usuarios dados de baja **se ven** con "Incluir dados de baja"; los
  bloqueados se listan siempre (D-17, D-28).
- "Repetir contraseña", "Generar" y el nombre de usuario propuesto son del
  formulario; la API recibe una sola contraseña (D-23, D-24).
- Montos con formato argentino en pantalla (`$ 1.385,50`, `US$ 1,13`), números
  con dos decimales en la API. Fechas en UTC en la API, hora de Córdoba en
  pantalla.

## Verificar

Desde `frontend/`:

```bash
npm run lint
npm run build
npm run test:e2e:sprint1
npx playwright test e2e/catalogs/<feature>
```

- Si **todos** los tests fallan en milisegundos con `Executable doesn't exist`,
  falta el navegador de Playwright (no es un error del código): `npx playwright
  install chromium`. Pasa la primera vez y cada vez que se actualiza Playwright.
- Si un test falla, Playwright deja el reporte en `e2e/.report` y, mientras
  exista, `npm run lint` falla porque ESLint no ignora esa carpeta. Borrar
  `e2e/.report` y `e2e/.results` antes de correr el lint.

Para desarrollar sin backend: `VITE_USE_MOCKS=true` en `.env.local`. Usuarios
de prueba (contraseña `Castro1977`) en `MOCKS.md`.
