# Sesión: iniciar y cerrar sesión (DTC-33 CU-53, DTC-32 CU-52)

Este módulo resuelve el ingreso al sistema con nombre de usuario y contraseña, y todo lo que necesita una sesión abierta: guardar el token, renovarlo cuando vence, volver al ingreso cuando la sesión termina, cerrarla a mano y mostrar sólo lo que permiten los roles. La fuente de verdad es el contrato del Sprint 2 ([`API_CONTRACT_SPRINT_2.md`](../../../../docs/api-contract/API_CONTRACT_SPRINT_2.md), §3.1 y §4 "Sesión" y "Autorización").

## Cómo funciona

| Paso | Qué pasa | Dónde |
| --- | --- | --- |
| Arranque | Antes de mostrar nada, la app pide `POST /auth/refresh` con la cookie. Si hay sesión, sigue en la misma pantalla; si no, va al ingreso | `app/providers/SessionProvider.tsx` |
| Ingreso | El formulario valida los campos vacíos sin llamar a la API. Con `200` guarda la sesión; con `401` o `423` muestra el mensaje del contrato, conserva el usuario y limpia la contraseña | `pages/LoginPage.tsx`, `schemas/login.schema.ts`, `api/auth.queries.ts` |
| Token | El `accessToken` vive sólo en memoria, nunca en `localStorage`. `http` lo agrega a cada petición | `shared/api/http.ts` |
| Token vencido | Ante `401 ACCESS_TOKEN_EXPIRED`, `http` hace **un solo** refresh aunque venzan varias peticiones juntas, y las repite | `shared/api/http.ts` |
| Sesión terminada | Ante `SESSION_EXPIRED` o `UNAUTHENTICATED`, la sesión se cierra en el cliente y se va al ingreso. Sólo `SESSION_EXPIRED` muestra su mensaje | `shared/api/http.ts`, `SessionProvider.tsx` |
| Sin sesión | Cualquier pantalla lleva al ingreso y guarda la URL pedida, para volver a ella si los roles la permiten | `app/router/guards.tsx` (`RequireSession`) |
| Sin permiso | Una pantalla de otro rol muestra "Acceso denegado" sin montarse (no pide sus datos) | `guards.tsx` (`RequireAccess`), `app/router/AccessDeniedPage.tsx` |
| Inicio | Lleva a la primera pantalla del rol; Jefe de Taller y Encargado de Reportes ven "Todavía no hay módulos disponibles para tu rol." | `app/router/HomePage.tsx` |
| Cierre manual | "Cerrar sesión" está **una sola vez**, en el menú de usuario de la topbar, que es parte del marco (`AppLayout`) y se ve en todas las pantallas. Llama a `POST /auth/logout` (responde `204` siempre), descarta el token, vacía la caché de datos y deja "Cerraste sesión correctamente"; al quedar sin usuario, `RequireSession` lleva al ingreso. Si la llamada falla (sin red), la sesión sigue abierta y se avisa con un toast | `app/layouts/UserMenu.tsx`, `SessionProvider.tsx` (`logout`), `api/auth.api.ts` |
| Datos sin guardar | Un formulario con cambios avisa con `useUnsavedChanges(isDirty)`. Si el menú ve el aviso, "Cerrar sesión" pide confirmar ("Se van a perder los datos que no guardaste."); si el usuario cancela, no se llama a la API | `app/providers/UnsavedChangesContext.ts`, `UserMenu.tsx` |
| Menú y paneles | Sólo muestran los módulos que permiten los roles (`canAccess()` de `domain/roles.ts`) | `app/layouts/AppLayout.tsx`, `catalogs/panels/` |

`shared/` no puede importar features, así que `http.ts` no conoce `auth/`: `SessionProvider` le pasa con `configureSession()` cómo renovar el token y qué hacer cuando la sesión termina.

Con el login hecho, los mocks del Sprint 1 piden sesión y rol (`SPRINT_1_REQUIRES_SESSION = true` en `app/mocks/handlers.ts`, contrato §7.2).

## Tamaño de la pantalla de ingreso

El resto de la app se ve al 80% (`html { zoom: var(--rp-zoom) }` en escritorio, ver `styles/styles.css`), pero el prototipo se diseñó al 100%. Para que el ingreso mida lo mismo, `.login` cancela ese zoom con `zoom: calc(1 / var(--rp-zoom))`. Con eso la tarjeta mide 440 px, los campos 372 × 49 y el botón 372 × 50, como en el prototipo. En celular `--rp-zoom` vale 1 y no cambia nada; si se cambia el zoom global, el ingreso se ajusta solo. El corte de celular es el del prototipo (760 px).

## Volver a la pantalla pedida

`RequireSession` manda al ingreso con `state.from` (la ruta y los parámetros que se querían abrir). Al ingresar, `LoginPage` va a esa ruta si `canOpen()` dice que los roles la permiten; si no, va al inicio del rol. Funciona igual cuando la sesión se cierra mientras se usa el sistema (escenarios 6 y 11): el usuario vuelve a la pantalla en la que estaba.

## Errores `403` y cookie

Los roles se verifican en cada petición en el servidor (RNF09). Una URL de otro rol muestra "Acceso denegado" sin pedir datos. Si el backend responde `403 FORBIDDEN`, el mensaje es el del contrato, "No tenés permisos para realizar esta operación." (`http.ts` lo usa de respaldo si el servidor no manda texto).

`http` usa `withCredentials: true` para enviar la cookie `refresh_token` también cuando la API está en otro dominio (en ese caso el backend tiene que permitir CORS con credenciales). Con el proxy `/api`, lo habitual, no hace falta.

## Problemas conocidos al desarrollar

- **"Error del servidor. Intentá de nuevo en unos minutos." al ingresar:** la app le está pegando al backend real y no hay ninguno en `localhost:3000`. Para trabajar con mocks, `.env.local` tiene que tener `VITE_USE_MOCKS=true` guardado en UTF-8 o ASCII. En PowerShell, `echo ... > archivo` lo guarda en UTF-16 y Vite lo ignora; usá `Set-Content -Path .env.local -Value "VITE_USE_MOCKS=true" -Encoding ascii` y reiniciá `npm run dev`. En la consola del navegador tiene que aparecer `[MSW] Mocking enabled`.

## Tests

Los tests son **E2E con Playwright** ([ADR-012](../../../../docs/decisiones/012-frontend-e2e-tests.md), [TESTING.md](../../../frontend-Documents/TESTING.md)): abren un navegador, usan la app como un usuario y la API la responden los mocks. Están en `e2e/auth/session.e2e.spec.ts`.

### Por qué se agregaron tests nuevos

Los tests que ya existían cubrían el ingreso y la sesión vencida al recargar, pero tres escenarios de la historia estaban programados y **ningún test los comprobaba**: los mocks no podían producir esas situaciones (el token del mock no vencía, los 7 días sólo se revisaban al recargar y no existía el refresh token reusado). Si alguien rompía esa lógica, nada lo avisaba.

Para cubrirlos, primero se les enseñó a los mocks esos estados y después se escribieron los tests, en ese orden, como pide `frontend/CLAUDE.md`:

- **Mocks** (`shared/mocks/session.ts`, `api/auth.mocks.ts`): la sesión simulada suma `accessTokenExpired` y `refreshRevoked`, y `authorize()` ahora también revisa los 7 días, como el backend.
- **Soporte de los tests** (`e2e/support/session.ts`): `changeSession(page, cambios)` deja la sesión en ese estado en medio del test. Los tiempos (15 minutos, 7 días) no se esperan.
- **Tests:** un `describe` nuevo, `[DTC-33][CU-53] Sesión abierta`, con tres tests.

Después se sumaron tres tests más para el "vuelve a donde estaba" de los escenarios 6 y 7, que estaba programado pero sin comprobar. Para el primero, `changeSession` aprendió `expiredByInactivity`.

### Escenarios que antes no se cubrían

| Escenario de la historia | Test | Qué comprueba |
| --- | --- | --- |
| 5. Renovación transparente del token | "renueva el token vencido sin que se note, con un solo refresh" | Al abrir Encargados vencen tres peticiones juntas: se ve el listado, no aparece el ingreso y se pidió **un solo** `POST /auth/refresh` |
| 11. Duración máxima de la sesión | "a los 7 días del ingreso la sesión vence aunque se use el sistema" | Con la sesión abierta, la próxima acción lleva al ingreso con "Tu sesión expiró. Volvé a ingresar." |
| 12. Reuso de un refresh token ya reemplazado | "si el refresh token ya fue reemplazado, cierra la sesión sin mensaje" | El refresh responde `401 UNAUTHENTICATED`: la app va al ingreso sin mensaje y, al recargar, la sesión no vuelve |

### Cobertura de la historia

| Escenario | Test |
| --- | --- |
| 1. Inicio de sesión exitoso | "ingresa a la primera pantalla que permite el rol…" y "un rol sin módulos ve el inicio vacío" |
| 2. Credenciales incorrectas | "con datos incorrectos conserva el usuario y limpia la contraseña" |
| 3. Bloqueo por intentos fallidos | "bloquea al usuario al quinto intento fallido" y "un usuario bloqueado no ingresa" |
| 4. Usuario dado de baja | "un usuario dado de baja recibe el mismo mensaje que una contraseña mala" |
| 5. Renovación transparente del token | **nuevo** (ver arriba) |
| 6. Cierre por inactividad | "avisa cuando la sesión expiró por inactividad" y "…al reingresar vuelve a la pantalla en la que estaba" |
| 7. Acceso a una pantalla sin sesión | "sin sesión, cualquier pantalla lleva al ingreso" y los dos de `[DTC-33][CU-53] Volver a la pantalla pedida` (rol que la permite / rol que no) |
| 8. Acceso fuera de su rol | "una pantalla de otro rol muestra acceso denegado" |
| 9. Datos incompletos | "marca los campos vacíos sin contarlos como intento" |
| 10. Recargar mantiene la sesión | "ingresa a la primera pantalla… y la sesión sobrevive a una recarga" |
| 11. Duración máxima | **nuevo** (ver arriba) |
| 12. Reuso de un refresh token | **nuevo** (ver arriba) |

### Cómo se corren

Desde `frontend/`:

```bash
npx playwright test e2e/auth --project=sprint-2 --workers=2
```

Los tests de cerrar sesión están en dos `describe`:

- `[DTC-32][CU-52] Cerrar sesión desde el menú de usuario`: corre sobre una pantalla que ya existe (Clientes) y cubre el cierre, el aviso, "Atrás", la sesión ya vencida y el cierre sin confirmación.
- `[CU-52] Cerrar sesión` (los originales, más "Seguir acá"): usan el panel Administración y el alta de empleado, que son de DTC-28. Fallan hasta que se haga esa historia.

### Cobertura de DTC-32

| Escenario | Test |
| --- | --- |
| 1. Cierre exitoso | "cierra la sesión, avisa y no vuelve al recargar" |
| 2. Volver atrás después de cerrar | '"Atrás" después de cerrar no muestra la pantalla anterior' |
| 3. Token reutilizado | Sin test del lado del navegador: el `accessToken` vive en memoria y no se puede reenviar. Lo prueba el backend |
| 4. Cierre con datos sin guardar | "pide confirmación si hay datos sin guardar" y '"Seguir acá" mantiene la pantalla y los datos' (esperan a DTC-28) |
| 5. Sesión ya expirada | "con la sesión ya vencida cierra sin mostrar errores" |

## Límites

- **Escenario 12 en el servidor:** la regla de los 30 segundos de tolerancia después de la rotación (D-47) es del backend y se prueba allá. Del lado del frontend se prueba lo que le toca: un solo refresh a la vez y volver al ingreso si el servidor lo rechaza.
- **Los tests valen lo que valen los mocks** ([ADR-011](../../../../docs/decisiones/011-frontend-api-mocks.md)): no reemplazan una prueba contra el backend real.
- **Mostrar u ocultar la contraseña:** el `Input` compartido no admite un botón adentro, así que el campo de contraseña de `LoginPage` se arma con las mismas clases (`form-field`, `form-field__affix`) y lleva el ojito del prototipo.
- **Sin test:** el cambio de roles entre recargas (escenario 10, el mock no puede hacerlo) y el mensaje de respaldo del `403` de `http.ts`.
- **Contador de inactividad en pantalla:** el contrato describe que el prototipo lo lleva por su cuenta con `inactivityTimeoutSeconds`, pero la historia no lo exige: el cierre llega con el `401 SESSION_EXPIRED` de la siguiente acción.
- **Administrador del Sistema:** hasta que exista el panel Administración (DTC-28), ve el inicio sin módulos.
- **Paralelismo:** en algunas máquinas, con la cantidad de workers por defecto el dev server no da abasto y los tests se cortan por tiempo al abrir la página. Con `--workers=2` pasan.
