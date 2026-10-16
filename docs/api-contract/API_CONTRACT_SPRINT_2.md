# API Contract — Sprint 2

Contrato de la API para el **Sprint 2** de Castro Tornería S.R.L. Complementa al
contrato del Sprint 1 (`docs/openapi/`), que queda cerrado: este documento solo
describe lo que el Sprint 2 agrega y lo que cambia sobre lo ya implementado.

| Campo            | Valor                                                                                                 |
| ---------------- | ----------------------------------------------------------------------------------------------------- |
| Versión          | Sprint 2                                                                                              |
| Fecha            | 15/10/2026                                                                                            |
| Sprint           | DTC Sprint 2 (Jira, proyecto DTC)                                                                     |
| Complementa a    | `docs/openapi/` (Sprint 1)                                                                            |
| Fuente de verdad | `docs/prototipo/fuente/Castro Tornería - Prototipo.dc.html` (versión del 15/10/2026)                  |
| Relacionado      | `docs/domain/Matriz de permisos.md`, `docs/domain/*.pdf` (Casos de Uso, ERS y Modelo de Dominio V1.1) |

Cuando una historia de usuario, los documentos de `docs/domain` y el prototipo no
coinciden, este contrato **sigue al prototipo** y lo deja asentado en la
[sección 8](#8-observaciones). Los documentos se usan para lo que el prototipo no
define (reglas de seguridad, trazabilidad, formatos).

**Alcance del Sprint 2:** las once historias que tiene el sprint "DTC Sprint 2"
en Jira.

| Jira    | CU  | Historia                  | Endpoints                                                                                                |
| ------- | --- | ------------------------- | -------------------------------------------------------------------------------------------------------- |
| DTC-33  | 53  | Iniciar sesión            | `POST /auth/login`, `POST /auth/refresh`                                                                 |
| DTC-32  | 52  | Cerrar sesión             | `POST /auth/logout`                                                                                      |
| DTC-28  | 45  | Registrar empleado        | `POST /employees`                                                                                        |
| DTC-201 | 47  | Consultar empleados       | `GET /employees`, `GET /employees/{employeeId}`                                                          |
| DTC-129 | 05  | Registrar usuario         | `POST /users`                                                                                            |
| DTC-131 | 07  | Consultar usuarios        | `GET /users`, `GET /users/{userId}`                                                                      |
| DTC-203 | 09  | Registrar tipo de proceso | `POST /process-types`, `GET /exchange-rate`                                                              |
| DTC-204 | 10  | Modificar tipo de proceso | `PATCH /process-types/{processTypeId}`, `GET /process-types/{processTypeId}/history`                     |
| DTC-205 | 11  | Consultar tipo de proceso | `GET /process-types`, `GET /process-types/{processTypeId}`, `GET /process-types/{processTypeId}/history` |
| DTC-116 | 37  | Registrar material        | `POST /materials`, `GET /materials/names`                                                                |
| DTC-118 | 39  | Consultar materiales      | `GET /materials`, `GET /materials/names`                                                                 |

Además de las historias, el inicio de sesión cambia algo de lo ya implementado:
**todos los endpoints del Sprint 1 pasan a exigir sesión y rol** (ver
[§7.2](#72-endpoints-del-sprint-1-que-cambian)).

El prototipo muestra más de lo que entra en este sprint: la solicitud de
cotización (CU-13), la cotización (CU-14), modificar y dar de baja empleados
(CU-46 y CU-48), modificar y dar de baja usuarios (CU-06 y CU-08) y cambiar la
contraseña (CU-54). Nada de eso tiene endpoint en este contrato; el detalle está
en [§8.3](#83-visto-en-el-prototipo-y-fuera-de-este-contrato).

## Tabla de contenidos

- [1. Resumen de Endpoints](#1-resumen-de-endpoints)
- [2. Enumerados](#2-enumerados)
- [3. Endpoints](#3-endpoints)
    - [3.1 Sesión: /auth](#31-sesión-auth)
    - [3.2 Empleados: /employees](#32-empleados-employees)
    - [3.3 Usuarios: /users](#33-usuarios-users)
    - [3.4 Tipos de proceso: /process-types](#34-tipos-de-proceso-process-types)
    - [3.5 Tipo de cambio: /exchange-rate](#35-tipo-de-cambio-exchange-rate)
    - [3.6 Materiales: /materials](#36-materiales-materials)
- [4. Información general](#4-información-general)
- [5. Convenciones de respuestas](#5-convenciones-de-respuestas)
- [6. Códigos HTTP](#6-códigos-http)
- [7. Cambios respecto del Sprint 1](#7-cambios-respecto-del-sprint-1)
- [8. Observaciones](#8-observaciones)
- [9. Resumen por historia](#9-resumen-por-historia)

---

## 1. Resumen de Endpoints

| Método  | Endpoint                                 | Autenticación | Rol         | Descripción                                  | CU     |
| ------- | ---------------------------------------- | :-----------: | ----------- | -------------------------------------------- | ------ |
| `POST`  | `/auth/login`                            |      No       | -           | Iniciar sesión                               | 53     |
| `POST`  | `/auth/refresh`                          |   Cookie ¹    | -           | Renovar el token de acceso                   | 53     |
| `POST`  | `/auth/logout`                           |   Cookie ¹    | -           | Cerrar sesión                                | 52     |
| `POST`  | `/employees`                             |      Sí       | `AS`        | Registrar empleado                           | 45     |
| `GET`   | `/employees`                             |      Sí       | `AS`        | Consultar empleados                          | 47     |
| `GET`   | `/employees/{employeeId}`                |      Sí       | `AS`        | Consultar empleado                           | 47     |
| `POST`  | `/users`                                 |      Sí       | `AS`        | Registrar usuario                            | 05     |
| `GET`   | `/users`                                 |      Sí       | `AS`        | Consultar usuarios                           | 07     |
| `GET`   | `/users/{userId}`                        |      Sí       | `AS`        | Consultar usuario                            | 07     |
| `POST`  | `/process-types`                         |      Sí       | `AT` o `EC` | Registrar tipo de proceso                    | 09     |
| `GET`   | `/process-types`                         |      Sí       | `AT` o `EC` | Consultar tipos de proceso                   | 11     |
| `GET`   | `/process-types/{processTypeId}`         |      Sí       | `AT` o `EC` | Consultar tipo de proceso                    | 11     |
| `PATCH` | `/process-types/{processTypeId}`         |      Sí       | `AT` o `EC` | Modificar tipo de proceso                    | 10     |
| `GET`   | `/process-types/{processTypeId}/history` |      Sí       | `AT` o `EC` | Consultar el historial de un tipo de proceso | 10, 11 |
| `GET`   | `/exchange-rate`                         |      Sí       | `AT` o `EC` | Consultar el tipo de cambio actual           | 09, 10 |
| `POST`  | `/materials`                             |      Sí       | `AT` o `EC` | Registrar material                           | 37     |
| `GET`   | `/materials`                             |      Sí       | `AT` o `EC` | Consultar materiales                         | 39     |
| `GET`   | `/materials/names`                       |      Sí       | `AT` o `EC` | Consultar los nombres de material            | 37, 39 |

¹ No llevan `Authorization`: la sesión se identifica con la cookie
`refresh_token` que emite el login (ver [§3.1](#31-sesión-auth)).

En total, **18 endpoints nuevos**. La columna **Rol** sale de la
[matriz de permisos](#permisos-por-rol) de la sección 4. "`AT` o `EC`" significa
que alcanza con tener uno de los dos.

---

## 2. Enumerados

Valores cerrados del contrato. El backend envía y recibe el código; el rótulo en
castellano lo pone el cliente al mostrarlo.

### `Role`

| Código | Rótulo                    | Descripción (la que muestra el prototipo al asignar roles)                                                           |
| ------ | ------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `JT`   | Jefe de Taller            | Coordina y supervisa las órdenes de trabajo en el taller. No ve precios ni costos.                                   |
| `ERP`  | Encargado de Recepción    | Registra las solicitudes de cotización y mantiene clientes, fábricas y rubros.                                       |
| `EC`   | Encargado de Cotización   | Elabora y administra las cotizaciones solicitadas por los clientes. Incluye los permisos del Administrativo Técnico. |
| `ER`   | Encargado de Reportes     | Obtiene información estadística y gerencial de la actividad.                                                         |
| `AT`   | Administrativo Técnico    | Administra los catálogos de materiales, tipos de proceso y proveedores.                                              |
| `AS`   | Administrador del Sistema | Gestiona empleados y usuarios, y asigna sus roles.                                                                   |

Es un catálogo cerrado (RN44): los roles se corresponden con los actores internos
del sistema y no se administran. Un usuario puede tener **más de un rol**; sus
permisos son la suma de los de cada uno.

El orden de la tabla es el del prototipo. Las listas de roles que devuelve la API
vienen siempre en ese orden, sin importar el orden en que se enviaron.

### `EmployeePosition`

Puesto del empleado.

| Código           | Rótulo         |
| ---------------- | -------------- |
| `ADMINISTRATION` | Administración |
| `WORKSHOP_HEAD`  | Jefe de taller |
| `HEAD`           | Jefe           |
| `EMPLOYEE`       | Empleado       |

No confundir con `Role`: el puesto es un dato del empleado; el rol es un permiso
del usuario (RN44). Un empleado con puesto "Jefe de taller" no tiene el rol `JT`
salvo que su usuario lo tenga asignado.

### `UserStatus`

Estado de un usuario. Lo calcula el backend; no se envía en ningún cuerpo.

| Código     | Rótulo    | Significado                                                            |
| ---------- | --------- | ---------------------------------------------------------------------- |
| `ACTIVE`   | Activo    | Puede iniciar sesión                                                   |
| `BLOCKED`  | Bloqueado | Llegó a 5 intentos fallidos consecutivos. No puede iniciar sesión      |
| `INACTIVE` | Inactivo  | Dado de baja (o su empleado fue dado de baja). No puede iniciar sesión |

Si un usuario está dado de baja y además bloqueado, su estado es `INACTIVE`.

---

## 3. Endpoints

### 3.1 Sesión: /auth

Iniciar, renovar y cerrar sesión (CU-53 y CU-52). Las reglas completas
(duración, inactividad, bloqueo, revocación) están en [Sesión](#sesión), en la
sección 4.

La sesión usa **dos tokens**:

| Token         | Dura                         | Dónde viaja                                                                  | Para qué                                              |
| ------------- | ---------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------- |
| `accessToken` | **15 minutos**               | En el cuerpo de la respuesta; el cliente lo manda en `Authorization: Bearer` | Autenticar cada petición a la API                     |
| Refresh token | **7 días**, desde el ingreso | Solo en la cookie `refresh_token` (`HttpOnly`); nunca en el cuerpo           | Pedir un `accessToken` nuevo con `POST /auth/refresh` |

Los 7 días del refresh token son la **duración máxima de la sesión**: pasado ese
plazo hay que volver a ingresar, aunque se haya usado el sistema sin parar.
Dentro de esos 7 días, la sesión además se cierra tras **30 minutos sin
actividad** (RNF08).

La sesión también vive **en el servidor**: cada ingreso registra una sesión en
la base, con su inicio, su última actividad y, cuando termina, su fin y su
motivo. Cada petición la verifica, así que cerrar sesión la invalida de verdad
en el momento, aunque al `accessToken` le queden minutos (CU-52, escenario 3). El
último acceso de un usuario sale de sus sesiones.

---

#### `POST /auth/login`

Inicia una sesión con el nombre de usuario y la contraseña (CU-53).

**Autenticación requerida:** No.

**Cuerpo de la petición**

```json
{
	"username": "wcastro",
	"password": "Castro1977"
}
```

| Campo      | Tipo   | Requerido | Restricciones                                                |
| ---------- | ------ | :-------: | ------------------------------------------------------------ |
| `username` | String |    Sí     | No vacío. Se compara sin distinguir mayúsculas de minúsculas |
| `password` | String |    Sí     | No vacía. Se compara tal cual                                |

**Parámetros de consulta**

No requiere parámetros de consulta.

**Efectos**

- **Ingreso correcto.** Se abre una sesión nueva, el contador de intentos
  fallidos vuelve a `0` y el inicio de la sesión pasa a ser el "Último acceso"
  del usuario (`lastAccessAt`).
- **Contraseña incorrecta de un usuario activo.** Suma un intento fallido. Al
  **quinto intento fallido consecutivo** el usuario queda bloqueado (RNF08) y la
  respuesta ya es la del bloqueo.
- **Usuario bloqueado.** Se rechaza **aunque la contraseña sea correcta**. No
  suma intentos.
- **Usuario inexistente o dado de baja.** Se rechaza con el mismo mensaje que
  una contraseña incorrecta. No suma intentos: no hay a quién sumárselos.
- **Campo vacío.** Se rechaza con `400` antes de intentar autenticar y **no
  cuenta como intento** (CU-53, escenario 9).

**Cómo lo usa el prototipo**

| Pantalla                             | Respuesta                 | Qué muestra                                                                                    |
| ------------------------------------ | ------------------------- | ---------------------------------------------------------------------------------------------- |
| Ingreso, usuario o contraseña vacíos | `400 VALIDATION_ERROR`    | El error debajo de cada campo vacío                                                            |
| Ingreso, datos incorrectos           | `401 INVALID_CREDENTIALS` | "Usuario o contraseña incorrectos"; conserva el usuario y limpia la contraseña                 |
| Ingreso, usuario bloqueado           | `423 USER_BLOCKED`        | El mensaje del bloqueo; conserva el usuario y limpia la contraseña                             |
| Ingreso correcto                     | `200`                     | La primera pantalla que permiten los roles, o "Todavía no hay módulos disponibles para tu rol" |

**Respuestas**

**`200 OK`**

```json
{
	"accessToken": "eyJhbGciOi...",
	"tokenType": "Bearer",
	"expiresIn": 900,
	"inactivityTimeoutSeconds": 1800,
	"sessionExpiresAt": "2026-10-22T12:30:00.000Z",
	"user": {
		"id": 1,
		"username": "wcastro",
		"employee": {
			"id": 1,
			"firstName": "Walter",
			"lastName": "Castro"
		},
		"roles": ["AS"],
		"status": "ACTIVE",
		"lastAccessAt": "2026-10-15T12:30:00.000Z",
		"createdAt": "2026-03-12T12:00:00.000Z"
	}
}
```

Además, la respuesta emite la cookie del refresh token:

```http
Set-Cookie: refresh_token=<valor opaco>; HttpOnly; Secure; SameSite=Strict; Path=/api/auth; Max-Age=604800
```

| Campo                      | Tipo              | Descripción                                                                                                                                             |
| -------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `accessToken`              | String            | Token que el cliente envía en `Authorization: Bearer` en todas las peticiones. Opaco para el cliente                                                    |
| `tokenType`                | String            | Siempre `Bearer`                                                                                                                                        |
| `expiresIn`                | Integer           | Segundos de vida del `accessToken`: `900` (15 minutos)                                                                                                  |
| `inactivityTimeoutSeconds` | Integer           | Tiempo sin actividad tras el que la sesión se cierra, en segundos: `1800` (30 minutos). Permite que el cliente lleve su propio reloj, como el prototipo |
| `sessionExpiresAt`         | String (ISO 8601) | Fin de la sesión por su duración máxima: el ingreso más 7 días. Es también el vencimiento del refresh token                                             |
| `user`                     | Object            | El usuario de la sesión, con la misma estructura que [`GET /users/{userId}`](#get-usersuserid)                                                          |

**Sobre la cookie:** el refresh token viaja **solo** en ella, nunca en el
cuerpo, y `HttpOnly` impide que el código del navegador la lea. `Path=/api/auth`
hace que el navegador la mande únicamente a los endpoints de sesión, no al
resto de la API. `Max-Age` son los 7 días. El frontend y la API comparten origen
(nginx deriva `/api` al backend), por eso alcanza con `SameSite=Strict`.

**Sobre el `accessToken`:** el cliente lo guarda **en memoria**, no en
`localStorage`: al recargar la página se pierde y se pide uno nuevo con
[`POST /auth/refresh`](#post-authrefresh), que usa la cookie.

`user.employee` trae el nombre de la persona: es lo que el prototipo muestra en
el menú de usuario y en "Hola, Walter". `user.roles` es lo que el cliente usa
para armar el menú (ver [Permisos por rol](#permisos-por-rol)).

En esta respuesta `lastAccessAt` es el inicio de la sesión que se acaba de abrir.

**`400 Bad Request`**

```json
{
	"statusCode": 400,
	"error": "Bad Request",
	"code": "VALIDATION_ERROR",
	"message": "Los datos enviados no son válidos.",
	"path": "/api/auth/login",
	"timestamp": "2026-10-15T12:30:00.000Z",
	"details": [
		{ "field": "username", "message": "Ingresá tu nombre de usuario" },
		{ "field": "password", "message": "Ingresá tu contraseña" }
	]
}
```

**`401 Unauthorized`**

```json
{
	"statusCode": 401,
	"error": "Unauthorized",
	"code": "INVALID_CREDENTIALS",
	"message": "Usuario o contraseña incorrectos",
	"path": "/api/auth/login",
	"timestamp": "2026-10-15T12:30:00.000Z"
}
```

El mensaje es el mismo si el usuario no existe, si la contraseña es incorrecta o
si el usuario está dado de baja (CU-53, escenarios 2 y 4): no revela cuál de los
dos datos falló.

**`423 Locked`**

```json
{
	"statusCode": 423,
	"error": "Locked",
	"code": "USER_BLOCKED",
	"message": "Tu usuario fue bloqueado por intentos fallidos. Contactá al Administrador del Sistema.",
	"path": "/api/auth/login",
	"timestamp": "2026-10-15T12:30:00.000Z"
}
```

Se responde en el quinto intento fallido consecutivo y en todo intento posterior,
con la contraseña correcta o no. El usuario no se desbloquea solo: lo desbloquea
el Administrador del Sistema desde "Modificar usuario" (CU-06), que no es de este
sprint: llega en el próximo (D-49).

---

#### `POST /auth/refresh`

Entrega un `accessToken` nuevo a partir del refresh token de la cookie
`refresh_token` (CU-53).

**Autenticación requerida:** No. El `accessToken` puede estar vencido; la
sesión se identifica con la cookie. El endpoint no recibe cuerpo ni encabezado
`Authorization`.

El cliente lo usa en dos momentos:

| Momento                                          | Qué pasa                                                                                                                                                                                |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Una petición responde `401 ACCESS_TOKEN_EXPIRED` | Pide un token nuevo y repite la petición. El usuario no se entera                                                                                                                       |
| Al cargar o recargar la página                   | Como el `accessToken` vive en memoria, lo pide de nuevo. Si responde `200`, la sesión sigue y el prototipo vuelve a la pantalla en la que estaba; si responde `401`, muestra el ingreso |

**Cuerpo de la petición**

No requiere cuerpo.

**Parámetros de consulta**

No requiere parámetros de consulta.

**Efectos**

- **Rotación.** En cada uso el refresh token se **reemplaza** por uno nuevo, que
  viaja en la misma cookie, y el anterior queda revocado. El nuevo vence **en el
  mismo momento** que el original (`sessionExpiresAt`): renovar no estira la
  sesión más allá de los 7 días desde el ingreso.
- **Reuso de un refresh revocado.** Si llega un refresh token que ya fue
  reemplazado, se considera robado y se **cierra la sesión entera**. La única
  excepción son los 30 segundos siguientes a la rotación, para que dos pestañas
  que renuevan a la vez no se cierren la sesión entre ellas (D-47).
- **No cuenta como actividad.** Renovar el token no corre el reloj de
  inactividad: si no, una pestaña abierta que renueva sola cada 15 minutos
  mantendría la sesión viva para siempre. Cuenta la actividad del usuario, es
  decir, las peticiones a la API con el `accessToken` (D-46).

**Respuestas**

**`200 OK`**

```json
{
	"accessToken": "eyJhbGciOi...",
	"tokenType": "Bearer",
	"expiresIn": 900,
	"inactivityTimeoutSeconds": 1800,
	"sessionExpiresAt": "2026-10-22T14:02:00.000Z",
	"user": {
		"id": 7,
		"username": "dcastro",
		"employee": {
			"id": 7,
			"firstName": "Daniel",
			"lastName": "Castro"
		},
		"roles": ["ERP", "EC"],
		"status": "ACTIVE",
		"lastAccessAt": "2026-10-15T14:02:00.000Z",
		"createdAt": "2026-03-12T12:00:00.000Z"
	}
}
```

Además, la respuesta trae la cookie con el refresh token rotado:

```http
Set-Cookie: refresh_token=<nuevo valor opaco>; HttpOnly; Secure; SameSite=Strict; Path=/api/auth; Max-Age=<segundos hasta sessionExpiresAt>
```

Misma estructura que la respuesta de `POST /auth/login`. `user` trae los datos
**vigentes**: si el Administrador cambió los roles del usuario después del
ingreso, ya vienen los nuevos. `lastAccessAt` sigue siendo el inicio de esta
sesión.

**`401 Unauthorized`**

La sesión se cerró por 30 minutos de inactividad:

```json
{
	"statusCode": 401,
	"error": "Unauthorized",
	"code": "SESSION_EXPIRED",
	"message": "Tu sesión expiró por inactividad",
	"path": "/api/auth/refresh",
	"timestamp": "2026-10-15T15:00:00.000Z"
}
```

O se cumplieron los 7 días desde el ingreso:

```json
{
	"statusCode": 401,
	"error": "Unauthorized",
	"code": "SESSION_EXPIRED",
	"message": "Tu sesión expiró. Volvé a ingresar.",
	"path": "/api/auth/refresh",
	"timestamp": "2026-10-22T12:31:00.000Z"
}
```

O no hay una sesión válida por cualquier otro motivo: no hay cookie, el refresh
token no existe, la sesión se cerró con `POST /auth/logout`, se detectó el reuso
de un refresh revocado, o el usuario quedó bloqueado o inactivo:

```json
{
	"statusCode": 401,
	"error": "Unauthorized",
	"code": "UNAUTHENTICATED",
	"message": "La autenticación es requerida.",
	"path": "/api/auth/refresh",
	"timestamp": "2026-10-15T15:00:00.000Z"
}
```

En todos los casos, la respuesta borra la cookie:

```http
Set-Cookie: refresh_token=; HttpOnly; Secure; SameSite=Strict; Path=/api/auth; Max-Age=0
```

y el cliente muestra el ingreso, con "Tu sesión expiró por inactividad" cuando
el `code` es `SESSION_EXPIRED`.

---

#### `POST /auth/logout`

Cierra la sesión del usuario (CU-52).

**Autenticación requerida:** No. La sesión se identifica con la cookie
`refresh_token` o, si no llega, con el `accessToken` de `Authorization`. Así se
puede cerrar sesión aunque el `accessToken` esté vencido.

**Cuerpo de la petición**

No requiere cuerpo.

**Parámetros de consulta**

No requiere parámetros de consulta.

**Efectos**

- La sesión queda cerrada en el servidor, con su fecha y hora de fin y el motivo
  `MANUAL`. Desde la próxima petición, el `accessToken` de esa sesión responde
  `401 UNAUTHENTICATED` aunque no hayan pasado sus 15 minutos, y el refresh token
  deja de servir (CU-52, escenario 3).
- No afecta otras sesiones del mismo usuario en otros equipos.
- La confirmación "Se van a perder los datos que no guardaste" es del cliente:
  la pide antes de llamar a este endpoint.

**Respuestas**

**`204 No Content`**

La respuesta no contiene cuerpo y borra la cookie:

```http
Set-Cookie: refresh_token=; HttpOnly; Secure; SameSite=Strict; Path=/api/auth; Max-Age=0
```

Responde `204` **siempre**, también si la sesión ya había expirado, ya estaba
cerrada o no llegó ningún token: el usuario quería salir y ya está afuera, así
que no hay error que mostrar (CU-52, escenario 5).

---

### 3.2 Empleados: /employees

**Autenticación requerida:** Sí.
**Rol requerido:** `AS`.

Personal de la empresa (CU-45 y CU-47). Un empleado puede existir sin usuario:
no todo el personal del taller usa el sistema.

El recurso empleado tiene la siguiente estructura:

| Campo       | Tipo               | Nulo | Descripción                                             |
| ----------- | ------------------ | :--: | ------------------------------------------------------- |
| `id`        | Integer            |  No  | Identificador único                                     |
| `firstName` | String             |  No  | Nombre                                                  |
| `lastName`  | String             |  No  | Apellido                                                |
| `dni`       | String             |  No  | DNI, solo números (7 u 8). Único                        |
| `position`  | `EmployeePosition` |  No  | Puesto                                                  |
| `address`   | String \| `null`   |  Sí  | Dirección                                               |
| `email`     | String \| `null`   |  Sí  | Correo electrónico                                      |
| `phone`     | String \| `null`   |  Sí  | Teléfono                                                |
| `active`    | Boolean            |  No  | `false` si fue dado de baja                             |
| `user`      | Object \| `null`   |  Sí  | Su usuario del sistema, o `null` si no tiene. Ver abajo |
| `createdAt` | String (ISO 8601)  |  No  | Fecha y hora del alta                                   |
| `updatedAt` | String (ISO 8601)  |  No  | Fecha y hora de la última modificación                  |

`user` es un resumen del usuario, para las columnas "Usuario" y "Roles" del
listado y el recuadro "Usuario del sistema" del detalle:

| Campo      | Tipo         | Descripción               |
| ---------- | ------------ | ------------------------- |
| `id`       | Integer      | Identificador del usuario |
| `username` | String       | Nombre de usuario         |
| `roles`    | `Role[]`     | Roles asignados           |
| `status`   | `UserStatus` | Estado del usuario        |

**Sobre `active`:** a diferencia de los proveedores del Sprint 1, un empleado
dado de baja **no desaparece**: el prototipo lo sigue mostrando en el listado,
en gris y con el estado "Inactivo", cuando se tilda "Incluir dados de baja"
(D-17). La baja en sí (CU-48) no es de este sprint, así que en la práctica solo
hay empleados inactivos si se cargaron así en la base.

**Sobre `dni`:** viaja sin puntos. No puede haber dos empleados con el mismo DNI,
**incluidos los dados de baja** (D-15).

---

#### `POST /employees`

Registra un empleado (CU-45).

También lo usa el formulario de usuario: "+ Registrar empleado" abre el mismo
formulario en una ventana y, al registrarlo, el empleado queda elegido para el
usuario nuevo.

**Cuerpo de la petición**

```json
{
	"firstName": "Julián",
	"lastName": "Ferreyra",
	"dni": "42345678",
	"position": "EMPLOYEE",
	"address": null,
	"email": null,
	"phone": "+54 351 555-1013"
}
```

| Campo       | Tipo               | Requerido | Restricciones                                                     |
| ----------- | ------------------ | :-------: | ----------------------------------------------------------------- |
| `firstName` | String             |    Sí     | "Nombre". No vacío. Hasta 100 caracteres                          |
| `lastName`  | String             |    Sí     | "Apellido". No vacío. Hasta 100 caracteres                        |
| `dni`       | String             |    Sí     | "DNI". 7 u 8 dígitos, sin puntos. Único entre todos los empleados |
| `position`  | `EmployeePosition` |    Sí     | "Puesto"                                                          |
| `address`   | String \| `null`   |    No     | "Dirección". Hasta 200 caracteres                                 |
| `email`     | String \| `null`   |    No     | "Email". Formato de correo válido. Hasta 120 caracteres           |
| `phone`     | String \| `null`   |    No     | "Teléfono". Hasta 50 caracteres                                   |

Los textos se guardan sin espacios al principio ni al final. Un campo opcional
vacío (`""`) se guarda como `null`.

**Efectos del alta**

- El empleado queda **activo** y **sin usuario** (`user` en `null`).
- No se avisa de un posible homónimo (D-18): lo que identifica a la persona es
  el DNI.

**Respuestas**

**`201 Created`**

```json
{
	"id": 13,
	"firstName": "Julián",
	"lastName": "Ferreyra",
	"dni": "42345678",
	"position": "EMPLOYEE",
	"address": null,
	"email": null,
	"phone": "+54 351 555-1013",
	"active": true,
	"user": null,
	"createdAt": "2026-10-15T13:05:00.000Z",
	"updatedAt": "2026-10-15T13:05:00.000Z"
}
```

**`400 Bad Request`**

Faltan los obligatorios:

```json
{
	"statusCode": 400,
	"error": "Bad Request",
	"code": "VALIDATION_ERROR",
	"message": "Los datos enviados no son válidos.",
	"path": "/api/employees",
	"timestamp": "2026-10-15T13:05:00.000Z",
	"details": [
		{ "field": "firstName", "message": "Ingresá el nombre" },
		{ "field": "lastName", "message": "Ingresá el apellido" },
		{ "field": "dni", "message": "Ingresá el DNI" },
		{ "field": "position", "message": "Elegí el puesto" }
	]
}
```

Formato inválido:

```json
{
	"statusCode": 400,
	"error": "Bad Request",
	"code": "VALIDATION_ERROR",
	"message": "Los datos enviados no son válidos.",
	"path": "/api/employees",
	"timestamp": "2026-10-15T13:05:00.000Z",
	"details": [
		{ "field": "dni", "message": "El DNI tiene que tener 7 u 8 números" },
		{ "field": "email", "message": "Revisá el formato del email" }
	]
}
```

**`401 Unauthorized`**

```json
{
	"statusCode": 401,
	"error": "Unauthorized",
	"code": "UNAUTHENTICATED",
	"message": "La autenticación es requerida.",
	"path": "/api/employees",
	"timestamp": "2026-10-15T13:05:00.000Z"
}
```

**`403 Forbidden`**

```json
{
	"statusCode": 403,
	"error": "Forbidden",
	"code": "FORBIDDEN",
	"message": "No tenés permisos para realizar esta operación.",
	"path": "/api/employees",
	"timestamp": "2026-10-15T13:05:00.000Z"
}
```

**`409 Conflict`**

```json
{
	"statusCode": 409,
	"error": "Conflict",
	"code": "EMPLOYEE_DNI_TAKEN",
	"message": "Ya existe un empleado con ese DNI",
	"path": "/api/employees",
	"timestamp": "2026-10-15T13:05:00.000Z",
	"details": [
		{ "field": "dni", "message": "Ya existe un empleado con ese DNI" }
	]
}
```

---

#### `GET /employees`

Obtiene una lista paginada de empleados (CU-47), ordenada por apellido y nombre.

**Parámetros de consulta**

| Parámetro         | Tipo    | Requerido | Valor por defecto | Restricciones        | Descripción                                                                                 |
| ----------------- | ------- | :-------: | ----------------- | -------------------- | ------------------------------------------------------------------------------------------- |
| `page`            | Integer |    No     | `1`               | Mayor o igual a `1`  | Número de página                                                                            |
| `limit`           | Integer |    No     | `20`              | Entre `1` y `1000`   | Cantidad máxima de elementos por página                                                     |
| `search`          | String  |    No     | -                 | Hasta 120 caracteres | Busca en nombre, apellido, DNI y el rótulo del puesto. Sin distinguir mayúsculas ni acentos |
| `includeInactive` | Boolean |    No     | `false`           | `true` o `false`     | `true` incluye a los empleados dados de baja                                                |
| `hasUser`         | Boolean |    No     | -                 | `true` o `false`     | `true`: solo los que tienen usuario; `false`: solo los que no tienen                        |

Ejemplo:

```http
GET /api/employees?page=1&limit=20&search=castro&includeInactive=false
```

**Cómo lo usa el prototipo**

| Pantalla                                                          | Petición                                                                                        |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Empleados → listado ("Buscar por nombre, apellido, DNI o puesto") | `search` con lo escrito; `includeInactive=true` si está tildado "Incluir dados de baja"         |
| Empleados → encabezado ("11 empleados activos")                   | `limit=1` sin filtros; el número es `total`                                                     |
| Nuevo usuario → buscador de empleado                              | `search` con lo escrito, `limit=8`. Los que tienen `user` llevan la etiqueta "Ya tiene usuario" |

El buscador del usuario nuevo muestra solo empleados activos, que es lo que
devuelve el listado sin `includeInactive`.

**Respuestas**

**`200 OK`**

```json
{
	"items": [
		{
			"id": 6,
			"firstName": "Gabriela",
			"lastName": "Torres",
			"dni": "28789012",
			"position": "ADMINISTRATION",
			"address": null,
			"email": "gtorres@castrotorneria.com.ar",
			"phone": null,
			"active": true,
			"user": {
				"id": 6,
				"username": "gtorres",
				"roles": ["ER"],
				"status": "ACTIVE"
			},
			"createdAt": "2026-03-12T12:00:00.000Z",
			"updatedAt": "2026-03-12T12:00:00.000Z"
		},
		{
			"id": 11,
			"firstName": "Carla",
			"lastName": "Videla",
			"dni": "41234567",
			"position": "EMPLOYEE",
			"address": null,
			"email": null,
			"phone": null,
			"active": true,
			"user": null,
			"createdAt": "2026-03-12T12:00:00.000Z",
			"updatedAt": "2026-03-12T12:00:00.000Z"
		}
	],
	"total": 11,
	"page": 1,
	"limit": 20
}
```

Sin resultados, `items` vacío y `total` en `0`: no es un error. El prototipo
muestra "No hay empleados que coincidan con la búsqueda."

**`400 Bad Request`**

```json
{
	"statusCode": 400,
	"error": "Bad Request",
	"code": "VALIDATION_ERROR",
	"message": "Los parámetros de consulta no son válidos.",
	"path": "/api/employees?page=0",
	"timestamp": "2026-10-15T13:05:00.000Z",
	"details": [
		{
			"field": "page",
			"message": "Debe ser un número entero mayor o igual a 1."
		}
	]
}
```

**`401 Unauthorized`**

`ACCESS_TOKEN_EXPIRED`, `SESSION_EXPIRED` o `UNAUTHENTICATED`, según el estado
de la sesión (ver [Sesión](#sesión)). Desde acá, el resto de los endpoints lo
indican como "`401` de sesión".

**`403 Forbidden`**

```json
{
	"statusCode": 403,
	"error": "Forbidden",
	"code": "FORBIDDEN",
	"message": "No tenés permisos para realizar esta operación.",
	"path": "/api/employees",
	"timestamp": "2026-10-15T13:05:00.000Z"
}
```

---

#### `GET /employees/{employeeId}`

Obtiene un empleado (CU-47). Es la pantalla de detalle del empleado, con el
recuadro "Usuario del sistema".

**Parámetros de ruta**

| Parámetro    | Tipo    | Descripción                      |
| ------------ | ------- | -------------------------------- |
| `employeeId` | Integer | Identificador único del empleado |

**Respuestas**

**`200 OK`**

```json
{
	"id": 1,
	"firstName": "Walter",
	"lastName": "Castro",
	"dni": "20112233",
	"position": "HEAD",
	"address": "Av. Colón 1820, Córdoba",
	"email": "wcastro@castrotorneria.com.ar",
	"phone": "+54 351 555-1001",
	"active": true,
	"user": {
		"id": 1,
		"username": "wcastro",
		"roles": ["AS"],
		"status": "ACTIVE"
	},
	"createdAt": "2026-03-12T12:00:00.000Z",
	"updatedAt": "2026-03-12T12:00:00.000Z"
}
```

Un empleado dado de baja también se devuelve, con `active` en `false`: el
prototipo muestra su detalle con el aviso "Este empleado está dado de baja."

Con `user` en `null`, el prototipo muestra "Este empleado todavía no tiene
usuario." y el enlace "Crear usuario" (que abre el alta de usuario con el
empleado ya elegido).

**`400 Bad Request`**

```json
{
	"statusCode": 400,
	"error": "Bad Request",
	"code": "INVALID_PATH_PARAMETER",
	"message": "El identificador del empleado no es válido.",
	"path": "/api/employees/abc",
	"timestamp": "2026-10-15T13:05:00.000Z",
	"details": [
		{
			"field": "employeeId",
			"message": "Debe ser un número entero válido."
		}
	]
}
```

**`401 Unauthorized`**

`401` de sesión: `ACCESS_TOKEN_EXPIRED`, `SESSION_EXPIRED` o `UNAUTHENTICATED`.

**`403 Forbidden`**

`FORBIDDEN`, igual que en `GET /employees`.

**`404 Not Found`**

```json
{
	"statusCode": 404,
	"error": "Not Found",
	"code": "EMPLOYEE_NOT_FOUND",
	"message": "No se encontró el empleado solicitado.",
	"path": "/api/employees/99",
	"timestamp": "2026-10-15T13:05:00.000Z"
}
```

---

### 3.3 Usuarios: /users

**Autenticación requerida:** Sí.
**Rol requerido:** `AS`.

Cuentas de acceso al sistema (CU-05 y CU-07). Cada usuario pertenece a un
empleado; el nombre de la persona es el del empleado.

El recurso usuario tiene la siguiente estructura:

| Campo          | Tipo                        | Nulo | Descripción                                                           |
| -------------- | --------------------------- | :--: | --------------------------------------------------------------------- |
| `id`           | Integer                     |  No  | Identificador único                                                   |
| `username`     | String                      |  No  | Nombre de usuario. Único                                              |
| `employee`     | Object                      |  No  | Empleado del usuario: `id`, `firstName` y `lastName`                  |
| `roles`        | `Role[]`                    |  No  | Al menos uno, sin repetir, en el orden de la tabla de [`Role`](#role) |
| `status`       | `UserStatus`                |  No  | Activo, bloqueado o inactivo. Calculado                               |
| `lastAccessAt` | String (ISO 8601) \| `null` |  Sí  | Inicio de su última sesión. `null` si nunca ingresó ("Nunca ingresó") |
| `createdAt`    | String (ISO 8601)           |  No  | Fecha y hora del alta                                                 |

**La contraseña no se devuelve en ninguna respuesta**, ni en texto plano ni
cifrada (RNF08). Se guarda con un algoritmo de hash con sal y no se escribe en
los registros del servidor.

**Sobre `status`:** un usuario dado de baja o bloqueado sigue apareciendo en la
API, porque el prototipo lo muestra en el listado y en el detalle con su estado.
Los bloqueados se listan siempre; los inactivos, solo con `includeInactive`.

---

#### `POST /users`

Registra un usuario para un empleado (CU-05).

**Cuerpo de la petición**

```json
{
	"employeeId": 9,
	"username": "mcastro",
	"password": "Tz8kq4Rmw2",
	"roles": ["EC", "ER"]
}
```

| Campo        | Tipo     | Requerido | Restricciones                                                                                                             |
| ------------ | -------- | :-------: | ------------------------------------------------------------------------------------------------------------------------- |
| `employeeId` | Integer  |    Sí     | "Empleado". Un empleado registrado, activo y sin usuario                                                                  |
| `username`   | String   |    Sí     | "Nombre de usuario". No vacío. Hasta 30 caracteres. Único sin distinguir mayúsculas, incluidos los usuarios dados de baja |
| `password`   | String   |    Sí     | "Contraseña". Mínimo 8 caracteres, máximo 72                                                                              |
| `roles`      | `Role[]` |    Sí     | "Permisos". Al menos un rol, sin repetir                                                                                  |

**Lo que resuelve el cliente, no la API**

- **"Repetir contraseña"** se compara en el formulario; a la API llega una sola
  contraseña (D-24).
- **"Generar"** arma una contraseña al azar en el navegador.
- **El nombre de usuario propuesto** (inicial del nombre + apellido, con un
  número si ya existe: `mcastro`, `mcastro2`) lo arma el cliente al elegir el
  empleado (D-23). Si choca con uno existente, la API lo rechaza igual con
  `409 USERNAME_TAKEN`.

**Efectos del alta**

- El usuario queda **activo**, sin intentos fallidos y sin sesiones
  (`lastAccessAt` en `null`).
- Puede iniciar sesión de inmediato con esa contraseña. No hay contraseña
  provisoria ni cambio obligatorio en el primer ingreso (D-25).

**Respuestas**

**`201 Created`**

```json
{
	"id": 10,
	"username": "mcastro",
	"employee": {
		"id": 9,
		"firstName": "Matías",
		"lastName": "Castro"
	},
	"roles": ["EC", "ER"],
	"status": "ACTIVE",
	"lastAccessAt": null,
	"createdAt": "2026-10-15T13:10:00.000Z"
}
```

**`400 Bad Request`**

Faltan obligatorios o no cumplen el formato:

```json
{
	"statusCode": 400,
	"error": "Bad Request",
	"code": "VALIDATION_ERROR",
	"message": "Los datos enviados no son válidos.",
	"path": "/api/users",
	"timestamp": "2026-10-15T13:10:00.000Z",
	"details": [
		{ "field": "employeeId", "message": "Elegí el empleado" },
		{ "field": "username", "message": "Ingresá el nombre de usuario" },
		{
			"field": "password",
			"message": "La contraseña debe tener al menos 8 caracteres"
		},
		{ "field": "roles", "message": "Asigná al menos un rol" }
	]
}
```

`employeeId` de un empleado que no existe también es un `400` sobre ese campo
(D-21): es un dato del formulario a corregir.

```json
{
	"statusCode": 400,
	"error": "Bad Request",
	"code": "VALIDATION_ERROR",
	"message": "Los datos enviados no son válidos.",
	"path": "/api/users",
	"timestamp": "2026-10-15T13:10:00.000Z",
	"details": [
		{
			"field": "employeeId",
			"message": "No existe un empleado con ese identificador."
		}
	]
}
```

**`401 Unauthorized`**

`401` de sesión: `ACCESS_TOKEN_EXPIRED`, `SESSION_EXPIRED` o `UNAUTHENTICATED`.

**`403 Forbidden`**

```json
{
	"statusCode": 403,
	"error": "Forbidden",
	"code": "FORBIDDEN",
	"message": "No tenés permisos para realizar esta operación.",
	"path": "/api/users",
	"timestamp": "2026-10-15T13:10:00.000Z"
}
```

**`409 Conflict`**

Nombre de usuario repetido (CU-05, escenario 3):

```json
{
	"statusCode": 409,
	"error": "Conflict",
	"code": "USERNAME_TAKEN",
	"message": "El nombre de usuario ya está en uso",
	"path": "/api/users",
	"timestamp": "2026-10-15T13:10:00.000Z",
	"details": [
		{
			"field": "username",
			"message": "El nombre de usuario ya está en uso"
		}
	]
}
```

El empleado ya tiene usuario (CU-05, escenario 4):

```json
{
	"statusCode": 409,
	"error": "Conflict",
	"code": "EMPLOYEE_ALREADY_HAS_USER",
	"message": "Este empleado ya tiene el usuario «gtorres»",
	"path": "/api/users",
	"timestamp": "2026-10-15T13:10:00.000Z",
	"details": [
		{
			"field": "employeeId",
			"message": "Este empleado ya tiene el usuario «gtorres»"
		}
	]
}
```

Son dos códigos distintos porque el prototipo los resuelve distinto: el primero
marca el campo "Nombre de usuario"; el segundo muestra el aviso en el buscador de
empleado con el enlace al usuario existente.

**`422 Unprocessable Content`**

```json
{
	"statusCode": 422,
	"error": "Unprocessable Content",
	"code": "EMPLOYEE_INACTIVE",
	"message": "El empleado está dado de baja: no se le puede crear un usuario.",
	"path": "/api/users",
	"timestamp": "2026-10-15T13:10:00.000Z"
}
```

---

#### `GET /users`

Obtiene una lista paginada de usuarios (CU-07), ordenada por nombre de usuario.

**Parámetros de consulta**

| Parámetro         | Tipo    | Requerido | Valor por defecto | Restricciones        | Descripción                                                                                                |
| ----------------- | ------- | :-------: | ----------------- | -------------------- | ---------------------------------------------------------------------------------------------------------- |
| `page`            | Integer |    No     | `1`               | Mayor o igual a `1`  | Número de página                                                                                           |
| `limit`           | Integer |    No     | `20`              | Entre `1` y `1000`   | Cantidad máxima de elementos por página                                                                    |
| `search`          | String  |    No     | -                 | Hasta 120 caracteres | Busca en el nombre de usuario y en el nombre y apellido del empleado. Sin distinguir mayúsculas ni acentos |
| `role`            | `Role`  |    No     | -                 | Rol válido           | Solo los usuarios que tienen ese rol                                                                       |
| `includeInactive` | Boolean |    No     | `false`           | `true` o `false`     | `true` incluye a los usuarios dados de baja                                                                |

Ejemplo:

```http
GET /api/users?page=1&limit=20&role=EC
```

**Cómo lo usa el prototipo**

| Pantalla                                             | Petición                                                                  |
| ---------------------------------------------------- | ------------------------------------------------------------------------- |
| Usuarios → listado ("Buscar por usuario o empleado") | `search` con lo escrito                                                   |
| Usuarios → filtro "Todos los roles"                  | `role` con el rol elegido; sin el parámetro, todos                        |
| Usuarios → "Incluir dados de baja"                   | `includeInactive=true`                                                    |
| Usuarios → encabezado ("8 usuarios activos")         | `limit=1` sin filtros; el número es `total` (cuenta activos y bloqueados) |

**Respuestas**

**`200 OK`**

```json
{
	"items": [
		{
			"id": 7,
			"username": "dcastro",
			"employee": {
				"id": 7,
				"firstName": "Daniel",
				"lastName": "Castro"
			},
			"roles": ["ERP", "EC"],
			"status": "ACTIVE",
			"lastAccessAt": "2026-10-14T11:02:00.000Z",
			"createdAt": "2026-03-12T12:00:00.000Z"
		},
		{
			"id": 8,
			"username": "hfunes",
			"employee": {
				"id": 8,
				"firstName": "Hugo",
				"lastName": "Funes"
			},
			"roles": ["AT"],
			"status": "BLOCKED",
			"lastAccessAt": "2026-10-06T11:40:00.000Z",
			"createdAt": "2026-03-12T12:00:00.000Z"
		}
	],
	"total": 8,
	"page": 1,
	"limit": 20
}
```

Sin resultados, `items` vacío y `total` en `0`. El prototipo muestra "No se
encontraron usuarios con ese criterio" y ofrece "+ Nuevo usuario".

**`400 Bad Request`**

```json
{
	"statusCode": 400,
	"error": "Bad Request",
	"code": "VALIDATION_ERROR",
	"message": "Los parámetros de consulta no son válidos.",
	"path": "/api/users?role=XX",
	"timestamp": "2026-10-15T13:10:00.000Z",
	"details": [
		{ "field": "role", "message": "No existe un rol con ese código." }
	]
}
```

**`401 Unauthorized`**

`401` de sesión: `ACCESS_TOKEN_EXPIRED`, `SESSION_EXPIRED` o `UNAUTHENTICATED`.

**`403 Forbidden`**

`FORBIDDEN`, igual que en `POST /users`.

---

#### `GET /users/{userId}`

Obtiene un usuario (CU-07). Es la pantalla de detalle del usuario.

**Parámetros de ruta**

| Parámetro | Tipo    | Descripción                     |
| --------- | ------- | ------------------------------- |
| `userId`  | Integer | Identificador único del usuario |

**Respuestas**

**`200 OK`**

```json
{
	"id": 8,
	"username": "hfunes",
	"employee": {
		"id": 8,
		"firstName": "Hugo",
		"lastName": "Funes"
	},
	"roles": ["AT"],
	"status": "BLOCKED",
	"lastAccessAt": "2026-10-06T11:40:00.000Z",
	"createdAt": "2026-03-12T12:00:00.000Z"
}
```

Un usuario dado de baja también se devuelve, con `status` en `INACTIVE`. El
prototipo muestra el aviso que corresponde a cada estado:

| `status`   | Aviso del prototipo                                                                             |
| ---------- | ----------------------------------------------------------------------------------------------- |
| `INACTIVE` | "Este usuario está inactivo: no puede ingresar al sistema."                                     |
| `BLOCKED`  | "Este usuario está bloqueado por 5 intentos fallidos de ingreso: no puede ingresar al sistema." |

**`400 Bad Request`**

```json
{
	"statusCode": 400,
	"error": "Bad Request",
	"code": "INVALID_PATH_PARAMETER",
	"message": "El identificador del usuario no es válido.",
	"path": "/api/users/abc",
	"timestamp": "2026-10-15T13:10:00.000Z",
	"details": [
		{ "field": "userId", "message": "Debe ser un número entero válido." }
	]
}
```

**`401 Unauthorized`**

`401` de sesión: `ACCESS_TOKEN_EXPIRED`, `SESSION_EXPIRED` o `UNAUTHENTICATED`.

**`403 Forbidden`**

`FORBIDDEN`.

**`404 Not Found`**

```json
{
	"statusCode": 404,
	"error": "Not Found",
	"code": "USER_NOT_FOUND",
	"message": "No se encontró el usuario solicitado.",
	"path": "/api/users/99",
	"timestamp": "2026-10-15T13:10:00.000Z"
}
```

---

### 3.4 Tipos de proceso: /process-types

**Autenticación requerida:** Sí.
**Rol requerido:** `AT` o `EC`, para la lectura y para la escritura.

Procesos propios del taller con su precio por hora (CU-09, CU-10 y CU-11). El
Encargado de Cotización los elige al cotizar y el sistema le propone el costo
hora (eso es CU-14, de un sprint posterior).

El recurso tipo de proceso tiene la siguiente estructura:

| Campo           | Tipo              | Nulo | Descripción                                                                                           |
| --------------- | ----------------- | :--: | ----------------------------------------------------------------------------------------------------- |
| `id`            | Integer           |  No  | Identificador único. No cambia nunca, aunque se renombre el tipo                                      |
| `name`          | String            |  No  | Nombre: "Mecanizado Torno CNC". Único                                                                 |
| `description`   | String \| `null`  |  Sí  | Qué incluye el proceso                                                                                |
| `hourlyRateArs` | Number            |  No  | Precio hora en pesos. Mayor a 0, hasta dos decimales                                                  |
| `hourlyRateUsd` | Number            |  No  | Precio hora en dólares. Mayor a 0, hasta dos decimales                                                |
| `exchangeRate`  | Number            |  No  | Tipo de cambio (pesos por dólar) con el que se vincularon los dos precios la última vez que cambiaron |
| `createdAt`     | String (ISO 8601) |  No  | Fecha y hora del alta ("Alta")                                                                        |
| `updatedAt`     | String (ISO 8601) |  No  | Fecha y hora del último cambio; igual a `createdAt` si nunca cambió ("Última actualización")          |

**Sobre los precios:** cada tipo de proceso tiene su precio hora en pesos y en
dólares (RN16). En el formulario los dos están **vinculados por el tipo de
cambio**:

| Cuando el usuario cambia… | El formulario recalcula…                                        |
| ------------------------- | --------------------------------------------------------------- |
| El precio en pesos        | Dólares = pesos ÷ tipo de cambio                                |
| El precio en dólares      | Pesos = dólares × tipo de cambio                                |
| El tipo de cambio         | Dólares = pesos ÷ tipo de cambio (los pesos se mantienen, RN18) |

Todos los resultados se redondean a dos decimales. **El cálculo lo hace el
cliente**: la API recibe los dos precios y el tipo de cambio, y guarda los
precios tal como llegan, sin recalcularlos (D-29). Así lo que el usuario vio en
pantalla es exactamente lo que queda guardado.

**Sobre `name`:** no puede haber dos tipos de proceso con el mismo nombre, sin
distinguir mayúsculas, acentos ni espacios repetidos: "mecanizado torno manual"
choca con "Mecanizado Torno Manual" (D-34).

**Sobre `updatedAt`:** es la columna "Última actualización" del listado. Cambia
con cualquier modificación (nombre, descripción o precios), igual que en el
prototipo. Si el último cambio fue de precio, coincide con el registro más reciente del historial.

**Sobre las cotizaciones:** modificar un precio no toca las cotizaciones ya
cargadas: cada una conserva el costo hora con el que se cotizó (RN17).

---

#### `POST /process-types`

Registra un tipo de proceso (CU-09).

**Cuerpo de la petición**

```json
{
	"name": "Mecanizado Torno CNC",
	"description": "Torneado por control numérico para series y piezas de precisión.",
	"hourlyRateArs": 2547,
	"hourlyRateUsd": 1.84,
	"exchangeRate": 1385.5
}
```

| Campo           | Tipo             | Requerido | Restricciones                                                |
| --------------- | ---------------- | :-------: | ------------------------------------------------------------ |
| `name`          | String           |    Sí     | "Nombre". No vacío. Hasta 100 caracteres. Único (ver arriba) |
| `description`   | String \| `null` |    No     | "Descripción". Hasta 500 caracteres                          |
| `hourlyRateArs` | Number           |    Sí     | "Precio hora en pesos". Mayor a 0. Hasta dos decimales       |
| `hourlyRateUsd` | Number           |    Sí     | "Precio hora en dólares". Mayor a 0. Hasta dos decimales     |
| `exchangeRate`  | Number           |    Sí     | "Tipo de cambio (USD → ARS)". Mayor a 0. Hasta dos decimales |

El formulario precarga `exchangeRate` con [`GET /exchange-rate`](#get-exchange-rate);
el usuario lo puede cambiar.

**Efectos del alta**

- El tipo de proceso queda disponible en el catálogo con `createdAt` y
  `updatedAt` iguales.
- **El alta no genera registros en el historial**: el historial empieza con la
  primera modificación (en el prototipo, "Todavía no hubo cambios en este tipo
  de proceso").

**Respuestas**

**`201 Created`**

```json
{
	"id": 8,
	"name": "Mecanizado Torno CNC 5 ejes",
	"description": null,
	"hourlyRateArs": 3100,
	"hourlyRateUsd": 2.24,
	"exchangeRate": 1385.5,
	"createdAt": "2026-10-15T13:20:00.000Z",
	"updatedAt": "2026-10-15T13:20:00.000Z"
}
```

**`400 Bad Request`**

Faltan los obligatorios:

```json
{
	"statusCode": 400,
	"error": "Bad Request",
	"code": "VALIDATION_ERROR",
	"message": "Los datos enviados no son válidos.",
	"path": "/api/process-types",
	"timestamp": "2026-10-15T13:20:00.000Z",
	"details": [
		{ "field": "name", "message": "Ingresá el nombre del tipo de proceso" },
		{
			"field": "hourlyRateArs",
			"message": "Ingresá el precio hora en pesos"
		},
		{
			"field": "hourlyRateUsd",
			"message": "Ingresá el precio hora en dólares"
		},
		{
			"field": "exchangeRate",
			"message": "Ingresá un tipo de cambio mayor a 0, con hasta dos decimales"
		}
	]
}
```

Precios inválidos (CU-09, escenario 3):

```json
{
	"statusCode": 400,
	"error": "Bad Request",
	"code": "VALIDATION_ERROR",
	"message": "Los datos enviados no son válidos.",
	"path": "/api/process-types",
	"timestamp": "2026-10-15T13:20:00.000Z",
	"details": [
		{
			"field": "hourlyRateArs",
			"message": "El precio hora en pesos tiene que ser un número mayor a 0"
		},
		{
			"field": "hourlyRateUsd",
			"message": "El precio hora en dólares admite como máximo dos decimales"
		}
	]
}
```

**`401 Unauthorized`**

`401` de sesión: `ACCESS_TOKEN_EXPIRED`, `SESSION_EXPIRED` o `UNAUTHENTICATED`.

**`403 Forbidden`**

```json
{
	"statusCode": 403,
	"error": "Forbidden",
	"code": "FORBIDDEN",
	"message": "No tenés permisos para realizar esta operación.",
	"path": "/api/process-types",
	"timestamp": "2026-10-15T13:20:00.000Z"
}
```

**`409 Conflict`**

```json
{
	"statusCode": 409,
	"error": "Conflict",
	"code": "PROCESS_TYPE_NAME_TAKEN",
	"message": "Ya existe un tipo de proceso con ese nombre",
	"path": "/api/process-types",
	"timestamp": "2026-10-15T13:20:00.000Z",
	"details": [
		{
			"field": "name",
			"message": "Ya existe un tipo de proceso con ese nombre"
		}
	]
}
```

---

#### `GET /process-types`

Obtiene una lista paginada de tipos de proceso (CU-11), ordenada por nombre.

**Parámetros de consulta**

| Parámetro | Tipo    | Requerido | Valor por defecto | Restricciones        | Descripción                                                               |
| --------- | ------- | :-------: | ----------------- | -------------------- | ------------------------------------------------------------------------- |
| `page`    | Integer |    No     | `1`               | Mayor o igual a `1`  | Número de página                                                          |
| `limit`   | Integer |    No     | `20`              | Entre `1` y `1000`   | Cantidad máxima de elementos por página                                   |
| `search`  | String  |    No     | -                 | Hasta 120 caracteres | Tipos cuyo nombre contiene el texto. Sin distinguir mayúsculas ni acentos |

Ejemplo:

```http
GET /api/process-types?page=1&limit=20&search=torno
```

**Cómo lo usa el prototipo**

| Pantalla                                                         | Petición                                    |
| ---------------------------------------------------------------- | ------------------------------------------- |
| Tipos de proceso → listado ("Buscar por nombre")                 | `search` con lo escrito                     |
| Tipos de proceso → encabezado ("7 tipos de proceso registrados") | `limit=1` sin filtros; el número es `total` |

Columnas del listado: nombre y descripción, "Precio hora en pesos", "Precio hora
en dólares" y "Última actualización" (`updatedAt`).

**Respuestas**

**`200 OK`**

```json
{
	"items": [
		{
			"id": 7,
			"name": "Armado / Desarmado",
			"description": "Desarme, inspección y rearmado en trabajos de reparación.",
			"hourlyRateArs": 1180,
			"hourlyRateUsd": 0.86,
			"exchangeRate": 1385.5,
			"createdAt": "2026-06-02T11:34:00.000Z",
			"updatedAt": "2026-06-02T11:34:00.000Z"
		},
		{
			"id": 2,
			"name": "Mecanizado Torno CNC",
			"description": "Torneado por control numérico para series y piezas de precisión.",
			"hourlyRateArs": 2547,
			"hourlyRateUsd": 1.85,
			"exchangeRate": 1376.76,
			"createdAt": "2026-03-12T12:14:00.000Z",
			"updatedAt": "2026-10-01T13:24:00.000Z"
		}
	],
	"total": 7,
	"page": 1,
	"limit": 20
}
```

Sin resultados, `items` vacío y `total` en `0`. El prototipo muestra "No se
encontraron tipos de proceso con ese criterio" y ofrece "+ Nuevo tipo de
proceso".

**`400 Bad Request`**

`VALIDATION_ERROR` sobre `page` o `limit`, igual que en `GET /employees`.

**`401 Unauthorized`**

`401` de sesión: `ACCESS_TOKEN_EXPIRED`, `SESSION_EXPIRED` o `UNAUTHENTICATED`.

**`403 Forbidden`**

`FORBIDDEN`. Lo reciben también el Jefe de Taller, el Encargado de Recepción y el
Encargado de Reportes: el precio hora es información interna (D-13).

---

#### `GET /process-types/{processTypeId}`

Obtiene un tipo de proceso (CU-11). Es el bloque "Datos del tipo de proceso" y
el recuadro "Registro" del detalle; el historial se pide aparte con
[`GET /process-types/{processTypeId}/history`](#get-process-typesprocesstypeidhistory).

**Parámetros de ruta**

| Parámetro       | Tipo    | Descripción                             |
| --------------- | ------- | --------------------------------------- |
| `processTypeId` | Integer | Identificador único del tipo de proceso |

**Respuestas**

**`200 OK`**

```json
{
	"id": 1,
	"name": "Mecanizado Torno Manual",
	"description": "Torneado convencional: cilindrado, refrentado, roscado y ranurado.",
	"hourlyRateArs": 1557,
	"hourlyRateUsd": 1.13,
	"exchangeRate": 1377.88,
	"createdAt": "2026-03-12T12:10:00.000Z",
	"updatedAt": "2026-10-01T13:22:00.000Z"
}
```

**`400 Bad Request`**

```json
{
	"statusCode": 400,
	"error": "Bad Request",
	"code": "INVALID_PATH_PARAMETER",
	"message": "El identificador del tipo de proceso no es válido.",
	"path": "/api/process-types/abc",
	"timestamp": "2026-10-15T13:20:00.000Z",
	"details": [
		{
			"field": "processTypeId",
			"message": "Debe ser un número entero válido."
		}
	]
}
```

**`401 Unauthorized`**

`401` de sesión: `ACCESS_TOKEN_EXPIRED`, `SESSION_EXPIRED` o `UNAUTHENTICATED`.

**`403 Forbidden`**

`FORBIDDEN`.

**`404 Not Found`**

```json
{
	"statusCode": 404,
	"error": "Not Found",
	"code": "PROCESS_TYPE_NOT_FOUND",
	"message": "No se encontró el tipo de proceso solicitado.",
	"path": "/api/process-types/99",
	"timestamp": "2026-10-15T13:20:00.000Z"
}
```

---

#### `PATCH /process-types/{processTypeId}`

Modifica un tipo de proceso (CU-10).

**Parámetros de ruta**

| Parámetro       | Tipo    | Descripción                             |
| --------------- | ------- | --------------------------------------- |
| `processTypeId` | Integer | Identificador único del tipo de proceso |

**Cuerpo de la petición**

Todos los campos son opcionales, pero tiene que llegar al menos uno. Mismas
restricciones que en el alta.

Actualización por variación del dólar (CU-10, escenario 1): el usuario cambia el
tipo de cambio, los pesos se mantienen y los dólares se recalculan.

```json
{
	"hourlyRateUsd": 1.12,
	"exchangeRate": 1390
}
```

| Campo           | Tipo             | Descripción                                                                                             |
| --------------- | ---------------- | ------------------------------------------------------------------------------------------------------- |
| `name`          | String           | Nuevo nombre                                                                                            |
| `description`   | String \| `null` | Nueva descripción. `null` o `""` la borra                                                               |
| `hourlyRateArs` | Number           | Nuevo precio hora en pesos                                                                              |
| `hourlyRateUsd` | Number           | Nuevo precio hora en dólares                                                                            |
| `exchangeRate`  | Number           | Tipo de cambio con el que se calcularon los precios. **Obligatorio si llega alguno de los dos precios** |

**Efectos de la modificación**

- Si cambió **alguno de los dos precios hora** (`hourlyRateArs` o
  `hourlyRateUsd`), se agrega **un** registro al historial de precios con el
  precio hora en dólares anterior y el nuevo, el tipo de cambio usado, el
  usuario de la sesión y la fecha y hora (RNF10). Es lo que muestra la tabla
  "Historial de precios" del prototipo: fecha y hora, usuario, valor anterior
  (US$), valor nuevo (US$) y tipo de cambio (D-32).
- Cambiar solo el nombre o la descripción **no genera registro**: el historial
  es de precios.
- Un campo que llega con el mismo valor que ya tenía no cuenta como cambio.
- `updatedAt` pasa a ser la fecha y hora de la modificación.
- **Sin cambios** (CU-10, escenario 6): si ningún campo cambió, la respuesta es
  `200` con el tipo de proceso tal como estaba, sin registros nuevos en el
  historial y sin tocar `updatedAt` (D-31). El cliente igual compara antes de
  enviar y muestra "No hay cambios para guardar" sin llamar a la API.

**Cómo lo usa el prototipo**

"Modificar" abre el formulario con los valores actuales y el tipo de cambio de
[`GET /exchange-rate`](#get-exchange-rate). Al guardar, el prototipo muestra el
modal "Confirmar cambios" con cada campo modificado como "anterior → nuevo",
armado por el cliente con los valores que ya tiene; recién al confirmar se envía
el `PATCH` con los campos que cambiaron.

**Respuestas**

**`200 OK`**

```json
{
	"id": 1,
	"name": "Mecanizado Torno Manual",
	"description": "Torneado convencional: cilindrado, refrentado, roscado y ranurado.",
	"hourlyRateArs": 1557,
	"hourlyRateUsd": 1.12,
	"exchangeRate": 1390,
	"createdAt": "2026-03-12T12:10:00.000Z",
	"updatedAt": "2026-10-15T13:30:00.000Z"
}
```

**`400 Bad Request`**

```json
{
	"statusCode": 400,
	"error": "Bad Request",
	"code": "VALIDATION_ERROR",
	"message": "Los datos enviados no son válidos.",
	"path": "/api/process-types/1",
	"timestamp": "2026-10-15T13:30:00.000Z",
	"details": [
		{
			"field": "exchangeRate",
			"message": "Ingresá un tipo de cambio mayor a 0, con hasta dos decimales"
		}
	]
}
```

Un cuerpo vacío (`{}`) también es `400 VALIDATION_ERROR`, con el mensaje "Enviá
al menos un campo para modificar."

**`401 Unauthorized`**

`401` de sesión: `ACCESS_TOKEN_EXPIRED`, `SESSION_EXPIRED` o `UNAUTHENTICATED`.

**`403 Forbidden`**

`FORBIDDEN`.

**`404 Not Found`**

`PROCESS_TYPE_NOT_FOUND`, igual que en `GET /process-types/{processTypeId}`.

**`409 Conflict`**

`PROCESS_TYPE_NAME_TAKEN`, igual que en el alta, cuando el nombre nuevo ya es de
**otro** tipo de proceso (CU-10, escenario 5).

---

#### `GET /process-types/{processTypeId}/history`

Obtiene el historial de cambios de un tipo de proceso, **del más reciente al más
antiguo** (CU-10, escenario 4). Es la tabla "Historial de precios" del detalle.

El historial no se puede modificar ni borrar por ningún rol (RNF10): no existe
ningún endpoint de escritura sobre él.

**Parámetros de ruta**

| Parámetro       | Tipo    | Descripción                             |
| --------------- | ------- | --------------------------------------- |
| `processTypeId` | Integer | Identificador único del tipo de proceso |

**Parámetros de consulta**

No requiere parámetros de consulta. La lista **no se pagina** (D-32): un tipo de
proceso cambia unas pocas veces al año y el prototipo la muestra completa, sin
paginador.

**Respuestas**

**`200 OK`**

```json
{
	"items": [
		{
			"id": 14,
			"changedAt": "2026-10-01T13:22:00.000Z",
			"changedBy": {
				"id": 4,
				"username": "lbenitez"
			},
			"exchangeRateArs": 1365,
			"previousValueUsd": 1.21,
			"newValueUsd": 1.13
		},
		{
			"id": 6,
			"changedAt": "2026-07-04T14:05:00.000Z",
			"changedBy": {
				"id": 3,
				"username": "fpaz"
			},
			"exchangeRateArs": 1565,
			"previousValueUsd": 1.13,
			"newValueUsd": 2.8
		}
	]
}
```

| Campo             | Tipo                       | Descripción                                                                                                         |
| ----------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `id`              | Integer                    | Identificador del registro                                                                                          |
| `changedAt`       | String (ISO 8601)          | "Fecha y hora"                                                                                                      |
| `changedBy`       | Object                     | "Usuario": `id` y `username` del usuario que hizo el cambio                                                         |
| `exchangeRateArs` | Number                     | "Tipo de cambio": pesos por dólar con el que se calculó el precio nuevo                                             |
| `previousValueUsd` | Number                    | "Valor anterior (US$)": precio hora en dólares antes del cambio                                                     |
| `newValueUsd`     | Number                     | "Valor nuevo (US$)": precio hora en dólares después del cambio                                                      |

Los dos valores van **siempre en dólares**: son las columnas "Valor anterior
(US$)" y "Valor nuevo (US$)" de la tabla del detalle (D-32).

Un tipo de proceso sin cambios devuelve `items` vacío. El prototipo muestra
"Todavía no hubo cambios en este tipo de proceso."

**`400 Bad Request`**

`INVALID_PATH_PARAMETER`, igual que en `GET /process-types/{processTypeId}`.

**`401 Unauthorized`**

`401` de sesión: `ACCESS_TOKEN_EXPIRED`, `SESSION_EXPIRED` o `UNAUTHENTICATED`.

**`403 Forbidden`**

`FORBIDDEN`.

**`404 Not Found`**

`PROCESS_TYPE_NOT_FOUND`.

---

### 3.5 Tipo de cambio: /exchange-rate

**Autenticación requerida:** Sí.
**Rol requerido:** `AT` o `EC`.

El formulario de tipo de proceso precarga el tipo de cambio "con la cotización
del backend" y muestra cuándo se actualizó ("Cotización actualizada al
15/10/2026 09:30"). Si el usuario lo cambia, el formulario avisa "Valor
modificado" y ofrece "↺ Restablecer cotización actual", que vuelve a este valor.

---

#### `GET /exchange-rate`

Devuelve la cotización actual del dólar en pesos.

**Parámetros de consulta**

No requiere parámetros de consulta.

**Respuestas**

**`200 OK`**

```json
{
	"rate": 1385.5,
	"updatedAt": "2026-10-15T12:30:00.000Z"
}
```

| Campo       | Tipo              | Descripción                                                       |
| ----------- | ----------------- | ----------------------------------------------------------------- |
| `rate`      | Number            | Pesos por dólar, con dos decimales                                |
| `updatedAt` | String (ISO 8601) | Momento de la cotización. Es el "actualizada al …" del formulario |

La cotización sale de una **API externa gratuita** (D-48). Cuál se usa y cada
cuánto se renueva son detalles de implementación: el contrato fija solo la forma
de la respuesta, así que cambiar de proveedor no cambia el endpoint.

**`401 Unauthorized`**

`401` de sesión: `ACCESS_TOKEN_EXPIRED`, `SESSION_EXPIRED` o `UNAUTHENTICATED`.

**`403 Forbidden`**

`FORBIDDEN`.

**`502 Bad Gateway`**

```json
{
	"statusCode": 502,
	"error": "Bad Gateway",
	"code": "EXCHANGE_RATE_UNAVAILABLE",
	"message": "No se pudo obtener la cotización del dólar. Ingresá el tipo de cambio a mano.",
	"path": "/api/exchange-rate",
	"timestamp": "2026-10-15T13:20:00.000Z"
}
```

Solo si el backend nunca pudo obtener una cotización. Si tiene una anterior,
responde `200` con ella y su `updatedAt` real, que el formulario muestra. Ante
el `502` el formulario deja el campo vacío para que el usuario lo complete: el
alta y la modificación de tipos de proceso no dependen de este endpoint.

---

### 3.6 Materiales: /materials

**Autenticación requerida:** Sí.
**Rol requerido:** `AT` o `EC`.

Catálogo de materiales (CU-37 y CU-39). Un material se identifica por su
**nombre y su calidad**: "Acero 1010" y "Acero 1045" son dos materiales
distintos, porque se cotizan a precios distintos. El catálogo no guarda precio,
proveedor ni presentación: eso se elige al cotizar (Modelo de Dominio V1.1).

El recurso material tiene la siguiente estructura:

| Campo       | Tipo              | Nulo | Descripción                           |
| ----------- | ----------------- | :--: | ------------------------------------- |
| `id`        | Integer           |  No  | Identificador único                   |
| `name`      | String            |  No  | Material: "Acero", "Bronce", "Nylon"  |
| `quality`   | String            |  No  | Calidad: "1045", "SAE 65", "AISI 304" |
| `createdAt` | String (ISO 8601) |  No  | Fecha y hora del alta                 |

**Sobre la unicidad:** la combinación de nombre y calidad no se repite, sin
distinguir mayúsculas, acentos ni espacios repetidos (D-36).

**Sobre `name`:** el formulario ofrece los nombres que ya existen y permite
escribir uno nuevo. Si el nombre que llega coincide con uno existente (con el
mismo criterio de comparación), **se guarda con la grafía del existente**: un
"acero" escrito a mano queda como "Acero" y no abre un nombre nuevo en el filtro
(D-37).

---

#### `POST /materials`

Registra un material (CU-37). Es la ventana "Nuevo material" del listado.

**Cuerpo de la petición**

```json
{
	"name": "Acero",
	"quality": "4140"
}
```

| Campo     | Tipo   | Requerido | Restricciones                             |
| --------- | ------ | :-------: | ----------------------------------------- |
| `name`    | String |    Sí     | "Material". No vacío. Hasta 60 caracteres |
| `quality` | String |    Sí     | "Calidad". No vacío. Hasta 60 caracteres  |

**Respuestas**

**`201 Created`**

```json
{
	"id": 14,
	"name": "Acero",
	"quality": "4140",
	"createdAt": "2026-10-15T13:40:00.000Z"
}
```

**`400 Bad Request`**

```json
{
	"statusCode": 400,
	"error": "Bad Request",
	"code": "VALIDATION_ERROR",
	"message": "Los datos enviados no son válidos.",
	"path": "/api/materials",
	"timestamp": "2026-10-15T13:40:00.000Z",
	"details": [
		{ "field": "name", "message": "Ingresá el material" },
		{ "field": "quality", "message": "Ingresá la calidad" }
	]
}
```

**`401 Unauthorized`**

`401` de sesión: `ACCESS_TOKEN_EXPIRED`, `SESSION_EXPIRED` o `UNAUTHENTICATED`.

**`403 Forbidden`**

```json
{
	"statusCode": 403,
	"error": "Forbidden",
	"code": "FORBIDDEN",
	"message": "No tenés permisos para realizar esta operación.",
	"path": "/api/materials",
	"timestamp": "2026-10-15T13:40:00.000Z"
}
```

**`409 Conflict`**

```json
{
	"statusCode": 409,
	"error": "Conflict",
	"code": "MATERIAL_ALREADY_EXISTS",
	"message": "Ya existe un material registrado con ese nombre y calidad",
	"path": "/api/materials",
	"timestamp": "2026-10-15T13:40:00.000Z",
	"details": [
		{
			"field": "quality",
			"message": "Ya existe un material registrado con ese nombre y calidad"
		}
	]
}
```

El error va sobre `quality` porque así lo marca el prototipo: el nombre puede
repetirse, lo que no se repite es la calidad dentro de ese nombre.

---

#### `GET /materials`

Obtiene una lista paginada de materiales (CU-39), ordenada por nombre y, dentro
de cada nombre, por calidad (con orden natural de los números: "SAE 62" antes
que "SAE 65", "1010" antes que "1045").

**Parámetros de consulta**

| Parámetro | Tipo    | Requerido | Valor por defecto | Restricciones       | Descripción                                                                                   |
| --------- | ------- | :-------: | ----------------- | ------------------- | --------------------------------------------------------------------------------------------- |
| `page`    | Integer |    No     | `1`               | Mayor o igual a `1` | Número de página                                                                              |
| `limit`   | Integer |    No     | `20`              | Entre `1` y `1000`  | Cantidad máxima de elementos por página                                                       |
| `name`    | String  |    No     | -                 | Hasta 60 caracteres | Solo los materiales con ese nombre. Coincidencia exacta, sin distinguir mayúsculas ni acentos |
| `quality` | String  |    No     | -                 | Hasta 60 caracteres | Materiales cuya calidad contiene el texto. Sin distinguir mayúsculas ni acentos               |

Ejemplo:

```http
GET /api/materials?page=1&limit=20&name=Acero&quality=10
```

**Cómo lo usa el prototipo**

| Pantalla                                              | Petición                                                |
| ----------------------------------------------------- | ------------------------------------------------------- |
| Materiales → filtro "Todos los materiales"            | `name` con el material elegido; sin el parámetro, todos |
| Materiales → buscador ("Buscar por calidad")          | `quality` con lo escrito                                |
| Materiales → encabezado ("13 materiales registrados") | `limit=1` sin filtros; el número es `total`             |

Columnas del listado: "Material" y "Calidad". El listado no tiene detalle ni
acciones por fila.

**Respuestas**

**`200 OK`**

```json
{
	"items": [
		{
			"id": 1,
			"name": "Acero",
			"quality": "1010",
			"createdAt": "2026-03-12T12:00:00.000Z"
		},
		{
			"id": 2,
			"name": "Acero",
			"quality": "1045",
			"createdAt": "2026-03-12T12:00:00.000Z"
		}
	],
	"total": 2,
	"page": 1,
	"limit": 20
}
```

Sin resultados, `items` vacío y `total` en `0`. El prototipo muestra "No se
encontraron materiales con ese criterio" y ofrece "+ Nuevo material".

**`400 Bad Request`**

`VALIDATION_ERROR` sobre `page` o `limit`, igual que en `GET /employees`.

**`401 Unauthorized`**

`401` de sesión: `ACCESS_TOKEN_EXPIRED`, `SESSION_EXPIRED` o `UNAUTHENTICATED`.

**`403 Forbidden`**

`FORBIDDEN`.

---

#### `GET /materials/names`

Devuelve los nombres de material distintos, en orden alfabético.

Lo usan dos lugares del prototipo: el filtro "Todos los materiales" del listado y
el campo "Material" de la ventana "Nuevo material" ("Elegí uno de la lista o
escribí uno nuevo").

**Parámetros de consulta**

No requiere parámetros de consulta. La lista **no se pagina** (D-38): son unas
decenas de nombres como mucho.

**Respuestas**

**`200 OK`**

```json
{
	"items": [
		"Acero",
		"Acero inoxidable",
		"Aluminio",
		"Bronce",
		"Fundición gris",
		"Nylon",
		"POM",
		"Teflón"
	]
}
```

**`401 Unauthorized`**

`401` de sesión: `ACCESS_TOKEN_EXPIRED`, `SESSION_EXPIRED` o `UNAUTHENTICATED`.

**`403 Forbidden`**

`FORBIDDEN`.

---

## 4. Información general

### Base URL

```text
/api
```

Igual que en el Sprint 1: el frontend llama a `/api` y el proxy (nginx) lo deriva
al backend. Las rutas de este documento se escriben sin el prefijo.

### Autenticación

Todos los endpoints, salvo los de sesión (`/auth/login`, `/auth/refresh` y
`/auth/logout`), requieren el `accessToken` de la sesión:

```http
Authorization: Bearer <accessToken>
```

Esto incluye a **los endpoints del Sprint 1**, que hasta ahora eran públicos
(ver [§7.2](#72-endpoints-del-sprint-1-que-cambian)).

### Sesión

Reglas de CU-53, CU-52 y RNF08.

**Tiempos**

| Qué                             | Tiempo                      | Qué pasa al cumplirse                                                                                                                      |
| ------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Vida del `accessToken`          | **15 minutos**              | La API responde `401 ACCESS_TOKEN_EXPIRED`; el cliente pide otro con `POST /auth/refresh` y repite la petición, sin que el usuario lo note |
| Inactividad                     | **30 minutos**              | La sesión se cierra (motivo `INACTIVITY`) y responde `401 SESSION_EXPIRED`                                                                 |
| Duración máxima (refresh token) | **7 días** desde el ingreso | La sesión se cierra (motivo `EXPIRED`) y responde `401 SESSION_EXPIRED`, aunque haya habido actividad                                      |

Los tres tiempos son configuración del servidor. Lo contractual es cómo se
informan: `expiresIn`, `inactivityTimeoutSeconds` y `sessionExpiresAt` en la
respuesta del login y del refresh, y los códigos de error.

**Reglas**

- **Una sesión por ingreso.** Cada `POST /auth/login` correcto abre una sesión
  nueva en el servidor, con su propio refresh token. Un usuario puede tener
  varias abiertas (en distintos equipos).
- **La sesión se verifica en cada petición.** El `accessToken` no alcanza por sí
  solo: el backend comprueba además que su sesión siga abierta. Por eso un cierre
  de sesión, un bloqueo o una baja cortan el acceso desde la petición siguiente,
  sin esperar a que el `accessToken` venza (CU-52, escenario 3).
- **Qué es actividad.** Cada petición a la API con el `accessToken` renueva la
  última actividad de la sesión. **`POST /auth/refresh` no la renueva** (D-46).
  El prototipo, además, cuenta la inactividad en la pantalla y cierra la sesión
  por su cuenta; `inactivityTimeoutSeconds` le dice cuánto esperar.
- **Rotación del refresh token.** Cada `POST /auth/refresh` reemplaza el refresh
  token por uno nuevo con el mismo vencimiento. Presentar uno ya reemplazado,
  pasados 30 segundos de la rotación, cierra la sesión (motivo `REVOKED`).
- **Cierre manual.** `POST /auth/logout` cierra la sesión con motivo `MANUAL`.
- **Bloqueo.** Cinco intentos fallidos consecutivos bloquean al usuario
  (`423 USER_BLOCKED`). El contador vuelve a `0` con cada ingreso correcto. Si
  el usuario tenía sesiones abiertas (alguien probó contraseñas desde otro
  equipo), se cierran desde la petición siguiente con `401 UNAUTHENTICATED`.
- **Roles en cada petición.** Los permisos se verifican en el backend en cada
  operación con los roles vigentes del usuario (RNF09), no con los que tenía al
  ingresar.
- **Usuario que deja de estar activo.** Si un usuario pasa a inactivo con
  sesiones abiertas, la petición siguiente responde `401 UNAUTHENTICATED`. En
  este sprint no hay forma de que ocurra por API (las bajas son de sprints
  posteriores), pero la regla queda fijada.

**Qué hace el cliente con cada `401`**

| `code`                 | Qué hace el cliente                                                                                   |
| ---------------------- | ----------------------------------------------------------------------------------------------------- |
| `ACCESS_TOKEN_EXPIRED` | Llama a `POST /auth/refresh` y repite la petición. Si el refresh también falla, sigue según su `code` |
| `SESSION_EXPIRED`      | Pantalla de ingreso con el mensaje de la respuesta ("Tu sesión expiró por inactividad")               |
| `UNAUTHENTICATED`      | Pantalla de ingreso sin mensaje                                                                       |

Si varias peticiones reciben `ACCESS_TOKEN_EXPIRED` a la vez, el cliente hace
**un solo** refresh y las repite todas con el token nuevo.

Después de ingresar de nuevo, el prototipo vuelve a la pantalla en la que
estaba (CU-53, escenario 6) si los roles la permiten.

Los datos de la sesión que guarda el servidor son los del CU-53 más los del
refresh token: usuario, inicio, última actividad, vencimiento, refresh token
vigente (guardado como hash, nunca en claro), fin y motivo de cierre (`MANUAL`,
`INACTIVITY`, `EXPIRED` o `REVOKED`). No se exponen como recurso en este sprint;
lo único que sale de ellos es el `lastAccessAt` de cada usuario.

### Autorización

Un endpoint indicado con un rol requiere que el usuario lo tenga. Cuando se
indican dos roles ("`AT` o `EC`"), alcanza con **uno**. Un usuario con varios
roles tiene la suma de sus permisos. Si no tiene ninguno de los roles pedidos,
la respuesta es `403 FORBIDDEN` y no devuelve ningún dato de la operación
(CU-53, escenario 8).

#### Permisos por rol

Tomada de `docs/domain/Matriz de permisos.md` (15/10/2026), que coincide con los
permisos del prototipo (`PERM`). Solo las filas de este sprint y las del Sprint
1, que ahora se aplican:

| Funcionalidad                                        | CU                        | US  | ERP | EC  | AT  | JT  | ER  | AS  |
| ---------------------------------------------------- | ------------------------- | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| Iniciar y cerrar sesión                              | 52, 53                    |  ✓  |     |     |     |     |     |     |
| Registrar y consultar empleados                      | 45, 47                    |     |     |     |     |     |     |  ✓  |
| Registrar y consultar usuarios                       | 05, 07                    |     |     |     |     |     |     |  ✓  |
| Registrar, modificar y consultar tipos de proceso    | 09, 10, 11                |     |     | ✓¹  |  ✓  |     |     |     |
| Registrar y consultar materiales                     | 37, 39                    |     |     | ✓¹  |  ✓  |     |     |     |
| Administrar proveedores (Sprint 1)                   | 33 – 36                   |     |     | ✓¹  |  ✓  |     |     |     |
| Administrar encargados, fábricas y rubros (Sprint 1) | 01 – 04, 41 – 44, 58 – 61 |     |  ✓  |     |     |     |     |     |

**US** es cualquier usuario autenticado, tenga el rol que tenga.

¹ El Encargado de Cotización hereda los permisos del Administrativo Técnico.

El Jefe de Taller y el Encargado de Reportes **no tienen ningún endpoint** en
este sprint, más allá de la sesión: el prototipo les muestra "Todavía no hay
módulos disponibles para tu rol".

#### Matriz por recurso

| Recurso                                              | Lectura (`GET`) | Escritura                                                        |
| ---------------------------------------------------- | --------------- | ---------------------------------------------------------------- |
| `/auth`                                              | -               | Público (`login`); con la cookie de sesión (`refresh`, `logout`) |
| `/employees`                                         | `AS`            | `AS`                                                             |
| `/users`                                             | `AS`            | `AS`                                                             |
| `/process-types`                                     | `AT` o `EC`     | `AT` o `EC`                                                      |
| `/process-types/{id}/history`                        | `AT` o `EC`     | -                                                                |
| `/exchange-rate`                                     | `AT` o `EC`     | -                                                                |
| `/materials`                                         | `AT` o `EC`     | `AT` o `EC`                                                      |
| `/suppliers` (Sprint 1)                              | `AT` o `EC`     | `AT` o `EC`                                                      |
| `/categories` (Sprint 1)                             | `ERP`           | `ERP`                                                            |
| `/factories` (Sprint 1)                              | `ERP`           | `ERP`                                                            |
| `/factories/{id}/customers`, `/customers` (Sprint 1) | `ERP`           | `ERP`                                                            |

### Formato de intercambio

Todas las solicitudes y respuestas usan JSON.

```http
Content-Type: application/json
Accept: application/json
```

La única excepción es el refresh token, que viaja en la cookie `refresh_token`
y no en JSON (ver [§3.1](#31-sesión-auth)).

- **Identificadores:** enteros.
- **Nombres de campos:** en inglés y `camelCase`, como en el Sprint 1. Los
  valores que ve el usuario (mensajes, nombres) van en castellano.
- **Fechas y horas:** ISO 8601 en UTC, como en el Sprint 1:
  `2026-10-15T12:30:00.000Z`. El cliente las muestra en la hora de Córdoba
  (`America/Argentina/Cordoba`): ese ejemplo es "15/10/2026 09:30".
- **Montos y tipo de cambio:** números JSON con hasta dos decimales (`1557`,
  `1.13`, `1385.5`). El backend los guarda como decimales exactos de dos
  posiciones, no como punto flotante. El formato con separadores
  ("$ 1.557,00", "US$ 1,13") lo pone el cliente.
- **Textos:** se guardan sin espacios al principio ni al final. Un campo
  opcional que llega vacío (`""`) se guarda como `null`.
- **Campos desconocidos:** un cuerpo o una consulta con campos que el endpoint no
  declara responde `400 VALIDATION_ERROR`, igual que en el Sprint 1.

### Comparación de textos

Varias reglas comparan textos "sin distinguir mayúsculas, acentos ni espacios
repetidos". Significa: se pasan a minúsculas, se quitan los acentos, se quitan
los espacios de los extremos y se reduce a uno cada grupo de espacios. Con ese
criterio, "Teflón", "teflon" y " TEFLON " son el mismo texto. Lo usan:

| Regla                                    | Dónde                             |
| ---------------------------------------- | --------------------------------- |
| Unicidad del nombre de tipo de proceso   | `POST` y `PATCH /process-types`   |
| Unicidad de nombre y calidad de material | `POST /materials`                 |
| Grafía del nombre de material            | `POST /materials`                 |
| Búsquedas (`search`, `name`, `quality`)  | Todos los listados de este sprint |

El nombre de usuario se compara solo sin distinguir mayúsculas: "MCastro" y
"mcastro" son el mismo usuario.

### Estado de los registros

| Recurso         | ¿Se puede dar de baja en este sprint? | Cómo se ve un registro dado de baja                                  |
| --------------- | :-----------------------------------: | -------------------------------------------------------------------- |
| Empleado        |     No (CU-48 es de otro sprint)      | `active: false`; aparece con `includeInactive=true` y en su `GET`    |
| Usuario         |     No (CU-08 es de otro sprint)      | `status: INACTIVE`; aparece con `includeInactive=true` y en su `GET` |
| Tipo de proceso |     No (CU-12 es de otro sprint)      | -                                                                    |
| Material        |     No (CU-40 es de otro sprint)      | -                                                                    |

Los empleados y los usuarios inactivos que muestra el prototipo vienen de los
datos de ejemplo. El contrato los contempla para que las consultas no cambien
cuando lleguen las bajas.

---

## 5. Convenciones de respuestas

### 5.1 Respuestas exitosas

Se mantienen las del Sprint 1.

**POST / PATCH / GET — Recurso individual**

El recurso, sin sobre:

```json
{
	"id": 1,
	"name": "Mecanizado Torno Manual"
}
```

**GET — Colección paginada**

```json
{
	"items": [],
	"total": 57,
	"page": 1,
	"limit": 20
}
```

`total` cuenta los registros que cumplen los filtros en todas las páginas, no los
de esta página. `page` y `limit` repiten los aplicados, porque el servidor
completa los valores por defecto. Una colección sin resultados devuelve `items`
vacío y `total` en `0`.

**GET — Colección no paginada**

Dos listas cortas se devuelven completas, con el mismo `items` pero sin `total`,
`page` ni `limit`:

```json
{
	"items": []
}
```

| Endpoint                                     | Por qué no se pagina                                     |
| -------------------------------------------- | -------------------------------------------------------- |
| `GET /process-types/{processTypeId}/history` | Pocos cambios por tipo; el prototipo la muestra completa |
| `GET /materials/names`                       | Unas decenas de nombres; alimenta un desplegable         |

**DELETE / logout — Sin contenido**

`204 No Content`, sin cuerpo.

### 5.2 Respuesta de error

Todas las respuestas de error usan la estructura del Sprint 1
(`docs/openapi/components/schemas/Error.yaml`), con un campo nuevo, `code`:

```json
{
	"statusCode": 409,
	"error": "Conflict",
	"code": "USERNAME_TAKEN",
	"message": "El nombre de usuario ya está en uso",
	"path": "/api/users",
	"timestamp": "2026-10-15T13:10:00.000Z",
	"details": [
		{
			"field": "username",
			"message": "El nombre de usuario ya está en uso"
		}
	]
}
```

| Campo        | Descripción                                                                                                                            |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `statusCode` | Código HTTP, repetido en el cuerpo                                                                                                     |
| `error`      | Nombre corto del código HTTP ("Bad Request", "Conflict")                                                                               |
| `code`       | **Nuevo.** Código del [catálogo](#53-catálogo-de-códigos-de-error). Es lo que el cliente usa para decidir qué hacer                    |
| `message`    | Mensaje para el usuario, en castellano. Cuando el error es de un campo, es el mismo texto que el prototipo muestra debajo del campo    |
| `path`       | Ruta de la petición                                                                                                                    |
| `timestamp`  | Momento del error (ISO 8601)                                                                                                           |
| `details`    | Lista `{ field, message }`, una entrada por campo. Aparece en los `400` de validación y en los `409` de unicidad; se omite en el resto |

**El cliente decide por `code`, no por el texto de `message`.** Dos situaciones
que la pantalla resuelve distinto tienen códigos distintos aunque compartan el
código HTTP: `USERNAME_TAKEN` y `EMPLOYEE_ALREADY_HAS_USER` son ambos `409`, pero
uno marca un campo y el otro muestra un aviso en el buscador.

**`details` en los `409`.** En el Sprint 1 cada módulo informaba el campo de un
`409` a su manera (`field` suelto en proveedores, `details` en rubros, fábricas
y encargados). Desde este sprint **todos los `409` usan `details`**, igual que
los `400`, así el formulario marca el campo con la misma lógica en los dos
casos.

**General — `500 Internal Server Error`**

```json
{
	"statusCode": 500,
	"error": "Internal Server Error",
	"code": "INTERNAL_SERVER_ERROR",
	"message": "Ocurrió un error inesperado.",
	"path": "/api/process-types",
	"timestamp": "2026-10-15T13:20:00.000Z"
}
```

El detalle del error va al registro del servidor (RNF13: fecha, hora, usuario y
descripción), nunca al cliente.

### 5.3 Catálogo de códigos de error

| Código                      | HTTP | Situación                                                                                                  |
| --------------------------- | :--: | ---------------------------------------------------------------------------------------------------------- |
| `VALIDATION_ERROR`          | 400  | Datos del cuerpo o de la consulta inválidos. Incluye `details` campo por campo                             |
| `INVALID_PATH_PARAMETER`    | 400  | Identificador de la ruta que no es un entero                                                               |
| `INVALID_CREDENTIALS`       | 401  | Usuario o contraseña incorrectos, o usuario dado de baja. Exclusivo de `POST /auth/login`                  |
| `ACCESS_TOKEN_EXPIRED`      | 401  | El `accessToken` pasó sus 15 minutos y la sesión sigue abierta: hay que renovarlo con `POST /auth/refresh` |
| `SESSION_EXPIRED`           | 401  | La sesión se cerró por 30 minutos de inactividad o por cumplir sus 7 días                                  |
| `UNAUTHENTICATED`           | 401  | Sin token, token desconocido o adulterado, sesión cerrada o revocada, o usuario bloqueado o inactivo       |
| `FORBIDDEN`                 | 403  | Usuario autenticado sin ninguno de los roles que pide el endpoint                                          |
| `EMPLOYEE_NOT_FOUND`        | 404  | Empleado inexistente                                                                                       |
| `USER_NOT_FOUND`            | 404  | Usuario inexistente                                                                                        |
| `PROCESS_TYPE_NOT_FOUND`    | 404  | Tipo de proceso inexistente                                                                                |
| `RESOURCE_NOT_FOUND`        | 404  | Ruta inexistente                                                                                           |
| `EMPLOYEE_DNI_TAKEN`        | 409  | DNI ya registrado en otro empleado                                                                         |
| `USERNAME_TAKEN`            | 409  | Nombre de usuario ya registrado, aunque sea de un usuario dado de baja                                     |
| `EMPLOYEE_ALREADY_HAS_USER` | 409  | El empleado ya tiene un usuario                                                                            |
| `PROCESS_TYPE_NAME_TAKEN`   | 409  | Nombre de tipo de proceso ya registrado                                                                    |
| `MATERIAL_ALREADY_EXISTS`   | 409  | Combinación de nombre y calidad ya registrada                                                              |
| `EMPLOYEE_INACTIVE`         | 422  | Alta de usuario para un empleado dado de baja                                                              |
| `USER_BLOCKED`              | 423  | Usuario bloqueado por intentos fallidos. Exclusivo de `POST /auth/login`                                   |
| `INTERNAL_SERVER_ERROR`     | 500  | Error interno inesperado                                                                                   |
| `EXCHANGE_RATE_UNAVAILABLE` | 502  | El backend no pudo obtener ninguna cotización del dólar                                                    |

---

## 6. Códigos HTTP

| Código | Nombre                  | Uso                                                                   |
| ------ | ----------------------- | --------------------------------------------------------------------- |
| `200`  | `OK`                    | Solicitud procesada                                                   |
| `201`  | `Created`               | Recurso creado                                                        |
| `204`  | `No Content`            | Operación sin cuerpo de respuesta                                     |
| `400`  | `Bad Request`           | Datos o parámetros inválidos                                          |
| `401`  | `Unauthorized`          | Sin sesión válida o credenciales incorrectas                          |
| `403`  | `Forbidden`             | Sesión válida sin el rol requerido                                    |
| `404`  | `Not Found`             | Recurso inexistente                                                   |
| `409`  | `Conflict`              | Unicidad: el dato ya está registrado                                  |
| `422`  | `Unprocessable Content` | Datos válidos que una regla de negocio no admite (nuevo)              |
| `423`  | `Locked`                | Usuario bloqueado (nuevo)                                             |
| `500`  | `Internal Server Error` | Error interno inesperado                                              |
| `502`  | `Bad Gateway`           | Un servicio externo del que depende la operación no respondió (nuevo) |

`400` y `422` no son intercambiables: `400` señala datos a corregir en el
formulario; `422` dice que los datos están bien pero la operación no procede, y
se informa como aviso.

`423` se usa solo para el bloqueo del ingreso: el usuario existe y la petición
está bien formada, pero la cuenta está trabada hasta que la destrabe el
Administrador.

`502` separa una falla ajena (la fuente de la cotización del dólar) de un error
propio (`500`): para el cliente es "seguí sin ese dato", no "algo se rompió".

---

## 7. Cambios respecto del Sprint 1

El Sprint 1 está cerrado y su contrato (`docs/openapi/`) no se reescribe. Esta
sección resume lo que el Sprint 2 le cambia.

**Un cambio rompe a un cliente del Sprint 1: todos los endpoints exigen sesión.**
El resto suma campos a la respuesta de error o endpoints nuevos.

### 7.1 Endpoints incorporados

| Endpoint                                                   | CU     | Motivo                                                     |
| ---------------------------------------------------------- | ------ | ---------------------------------------------------------- |
| `POST /auth/login`                                         | 53     | Ingreso con usuario y contraseña                           |
| `POST /auth/refresh`                                       | 53     | Renovar el `accessToken` y recuperar la sesión al recargar |
| `POST /auth/logout`                                        | 52     | Cierre de sesión en el servidor                            |
| `POST /employees`                                          | 45     | Alta de empleado, también desde el alta de usuario         |
| `GET /employees`, `GET /employees/{employeeId}`            | 47     | Listado, detalle y buscador de empleados                   |
| `POST /users`                                              | 05     | Alta de usuario con roles                                  |
| `GET /users`, `GET /users/{userId}`                        | 07     | Listado y detalle de usuarios                              |
| `POST /process-types`                                      | 09     | Alta de tipo de proceso                                    |
| `GET /process-types`, `GET /process-types/{processTypeId}` | 11     | Listado y detalle                                          |
| `PATCH /process-types/{processTypeId}`                     | 10     | Modificación con historial                                 |
| `GET /process-types/{processTypeId}/history`               | 10, 11 | Tabla "Historial de precios"                               |
| `GET /exchange-rate`                                       | 09, 10 | Tipo de cambio precargado en el formulario                 |
| `POST /materials`                                          | 37     | Alta de material                                           |
| `GET /materials`                                           | 39     | Listado con filtro por material y búsqueda por calidad     |
| `GET /materials/names`                                     | 37, 39 | Filtro "Todos los materiales" y combo del alta             |

### 7.2 Endpoints del Sprint 1 que cambian

| Endpoints                                                                                                   | Antes                                            | Desde el Sprint 2                                    |      ¿Rompe?       | Decisión |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------- | :----------------: | -------- |
| `/suppliers`, `/suppliers/{id}`                                                                             | Público                                          | Sesión y rol `AT` o `EC`                             |       **Sí**       | D-40     |
| `/categories`, `/categories/{id}`, `/categories/{id}/restore`                                               | Público                                          | Sesión y rol `ERP`                                   |       **Sí**       | D-40     |
| `/factories`, `/factories/{id}`, `/factories/{id}/deactivate`                                               | Público                                          | Sesión y rol `ERP`                                   |       **Sí**       | D-40     |
| `/customers`, `/factories/{factoryId}/customers`, `/factories/{factoryId}/customers/{id}` y su `deactivate` | Público                                          | Sesión y rol `ERP`                                   |       **Sí**       | D-40     |
| Todas las respuestas de error                                                                               | Sin `code`; el campo de un `409` según el módulo | Con `code`; los `409` informan el campo en `details` | No (suma un campo) | D-41     |

Ningún cuerpo ni respuesta exitosa del Sprint 1 cambia. Lo que cambia es que sin
`Authorization` responden `401` y, con un rol que no corresponde, `403`.

### 7.3 Enumerados incorporados

| Enumerado          | Motivo                                                 |
| ------------------ | ------------------------------------------------------ |
| `Role`             | Roles de los usuarios (RN44)                           |
| `EmployeePosition` | Puesto del empleado, un desplegable fijo del prototipo |
| `UserStatus`       | Estado del usuario: activo, bloqueado o inactivo       |

### 7.4 Códigos de error y códigos HTTP

**Códigos de error:** el campo `code` es nuevo, así que todo el catálogo de
[§5.3](#53-catálogo-de-códigos-de-error) se incorpora con este sprint.

**Códigos HTTP incorporados:** `422 Unprocessable Content`, `423 Locked` y
`502 Bad Gateway`.

### 7.5 Convenciones incorporadas

- **Autenticación** con `accessToken` Bearer de 15 minutos, refresh token de 7
  días en cookie `HttpOnly` y sesión verificada en el servidor en cada petición.
- **Roles alternativos:** "`AT` o `EC`" en un endpoint.
- **Registros inactivos visibles:** empleados y usuarios dados de baja se
  consultan (`includeInactive`), a diferencia de los proveedores del Sprint 1.
- **Colecciones no paginadas** para listas cortas (`{ items }`).
- **Montos** como números con dos decimales.
- **Comparación de textos** sin mayúsculas, acentos ni espacios repetidos.
- **`code`** en todas las respuestas de error y **`details`** en todos los `409`.

---

## 8. Observaciones

Decisiones de diseño de este contrato y puntos que quedan abiertos.

### 8.1 Decisiones tomadas

| ID   | Decisión                                                                                                                                                                                                                                                                              | Fundamento                                                                                                                                                                                                                                                                                                                         |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-01 | El alcance son las once historias del sprint "DTC Sprint 2" de Jira: CU-53, 52, 45, 47, 05, 07, 09, 10, 11, 37 y 39                                                                                                                                                                   | Jira al 15/10/2026. El Sprint 1 está cerrado                                                                                                                                                                                                                                                                                       |
| D-02 | La solicitud de cotización (CU-13, DTC-2) no entra en este contrato aunque el prototipo la tenga completa y su `CONTEXTO.md` la ubique en el Sprint 2                                                                                                                                 | No figura en el sprint de Jira. Confirmado por el equipo el 15/10/2026                                                                                                                                                                                                                                                             |
| D-03 | Se mantienen las convenciones ya implementadas en el Sprint 1: recurso sin sobre, listas `{ items, total, page, limit }`, límite máximo de `1000`, cuerpo de error con `statusCode`, `error`, `message`, `path`, `timestamp` y `details`, nombres de campos en inglés y fechas en UTC | El backend, los tests de contrato (`test/shared/contract/envelopes.ts`) y el frontend (`shared/api/pagination.ts`) ya las usan. Cambiarlas obligaría a tocar todo el Sprint 1                                                                                                                                                      |
| D-04 | La sesión vive en el servidor y cada petición la verifica, además de validar el `accessToken`                                                                                                                                                                                         | CU-52 pide que cerrar sesión la invalide en el servidor ("borrar el token sólo en el navegador no alcanza") y que un token reutilizado se rechace. Con un `accessToken` de 15 minutos y sin esa verificación, un token seguiría sirviendo hasta 15 minutos después del cierre. CU-53 guarda inicio, última actividad, fin y motivo |
| D-05 | Hay tres `401` de sesión: `ACCESS_TOKEN_EXPIRED` (renovar y seguir), `SESSION_EXPIRED` (volver a ingresar, con mensaje) y `UNAUTHENTICATED` (volver a ingresar, sin mensaje)                                                                                                          | El cliente reacciona distinto a cada uno. El prototipo muestra "Tu sesión expiró por inactividad" solo cuando la sesión venció                                                                                                                                                                                                     |
| D-06 | Al quinto fallo consecutivo el usuario queda bloqueado y responde `423 USER_BLOCKED` con el mensaje del prototipo, también con la contraseña correcta. Cuentan solo los fallos de usuarios existentes y activos                                                                       | RNF08, CU-53 escenario 3 y el prototipo. El mensaje revela que la cuenta existe; se acepta porque el caso de uso y el prototipo lo piden explícitamente                                                                                                                                                                            |
| D-07 | Un usuario dado de baja que intenta ingresar recibe el mismo `401 INVALID_CREDENTIALS` que una contraseña incorrecta                                                                                                                                                                  | CU-53, escenario 4                                                                                                                                                                                                                                                                                                                 |
| D-08 | Usuario o contraseña vacíos responden `400` y no cuentan como intento                                                                                                                                                                                                                 | CU-53, escenario 9, y el prototipo                                                                                                                                                                                                                                                                                                 |
| D-09 | `POST /auth/logout` identifica la sesión por la cookie (o por el `accessToken`) y responde siempre `204`, también si la sesión ya había expirado                                                                                                                                      | CU-52, escenario 5: "sin mostrar ningún error". Con la cookie se puede cerrar sesión aunque el `accessToken` esté vencido                                                                                                                                                                                                          |
| D-10 | `POST /auth/refresh` devuelve lo mismo que el login, incluido `user` con sus datos vigentes                                                                                                                                                                                           | El prototipo conserva la sesión al recargar. Como el `accessToken` vive en memoria, al recargar el cliente llama a refresh y con esa única respuesta sabe quién es el usuario y qué roles tiene. Por eso no hace falta un `GET /auth/me`                                                                                           |
| D-11 | `Role` es un enumerado cerrado de seis códigos: `JT`, `ERP`, `EC`, `ER`, `AT` y `AS`                                                                                                                                                                                                  | RN44 y el prototipo. Son los códigos que ya usan el prototipo y `frontend/src/domain/roles.ts`. El rol `A` ("Administrativo") de ese archivo no existe en el prototipo ni en los documentos                                                                                                                                        |
| D-12 | Los endpoints del Administrativo Técnico aceptan también al Encargado de Cotización                                                                                                                                                                                                   | Matriz de permisos ("EC hereda de AT") y prototipo (`PERM`)                                                                                                                                                                                                                                                                        |
| D-13 | El Encargado de Reportes no accede a los tipos de proceso                                                                                                                                                                                                                             | Prototipo y matriz de permisos. La HU DTC-205 (escenario 5) le daba lectura; manda el prototipo                                                                                                                                                                                                                                    |
| D-14 | El empleado tiene puesto, DNI, dirección, email y teléfono, además de nombre y apellido                                                                                                                                                                                               | El prototipo los pide. La HU DTC-28 solo pedía nombre y apellido                                                                                                                                                                                                                                                                   |
| D-15 | El DNI es obligatorio, de 7 u 8 dígitos y único entre todos los empleados, incluidos los dados de baja                                                                                                                                                                                | Validación del prototipo, que compara contra todos los empleados                                                                                                                                                                                                                                                                   |
| D-16 | El puesto es un enumerado cerrado de cuatro valores                                                                                                                                                                                                                                   | El prototipo lo ofrece como desplegable fijo (`PUESTOS`)                                                                                                                                                                                                                                                                           |
| D-17 | Empleados y usuarios dados de baja se pueden consultar (`includeInactive`, `GET` por id)                                                                                                                                                                                              | El prototipo los muestra en gris con su estado y CU-47 / CU-07 piden el filtro. Difiere de los proveedores del Sprint 1, que al darse de baja desaparecen                                                                                                                                                                          |
| D-18 | El alta de empleado no avisa de homónimos                                                                                                                                                                                                                                             | El prototipo no tiene ese aviso (la HU DTC-28 sí). Lo que distingue a dos personas es el DNI                                                                                                                                                                                                                                       |
| D-19 | El usuario no tiene nombre ni apellido propios: los toma de su empleado                                                                                                                                                                                                               | CU-05: el usuario se crea "a un empleado previamente registrado"; el prototipo muestra el nombre del empleado                                                                                                                                                                                                                      |
| D-20 | Un empleado tiene como máximo un usuario, contando los dados de baja                                                                                                                                                                                                                  | CU-05 y el prototipo, que compara contra todos los usuarios                                                                                                                                                                                                                                                                        |
| D-21 | `employeeId` inexistente responde `400` sobre ese campo; empleado dado de baja, `422 EMPLOYEE_INACTIVE`                                                                                                                                                                               | El primero es un dato mal elegido en el formulario; el segundo, una regla de negocio (el usuario es para un empleado activo)                                                                                                                                                                                                       |
| D-22 | El nombre de usuario es único sin distinguir mayúsculas, incluidos los usuarios dados de baja, y no se reutiliza                                                                                                                                                                      | CU-05: los registros históricos lo referencian como responsable                                                                                                                                                                                                                                                                    |
| D-23 | El nombre de usuario propuesto lo arma el cliente                                                                                                                                                                                                                                     | Es una ayuda del formulario; la unicidad la garantiza la API igual                                                                                                                                                                                                                                                                 |
| D-24 | "Repetir contraseña" y "Generar" son del cliente; la API recibe una sola contraseña                                                                                                                                                                                                   | La confirmación evita errores de tipeo en la pantalla; no agrega nada a la regla del servidor                                                                                                                                                                                                                                      |
| D-25 | No hay contraseña provisoria ni cambio obligatorio en el primer ingreso                                                                                                                                                                                                               | El prototipo no lo tiene y "Cambiar contraseña" (CU-54) figura como "A futuro". La HU DTC-129 lo pedía                                                                                                                                                                                                                             |
| D-26 | `status` se calcula: `INACTIVE` si está dado de baja, si no `BLOCKED` si está bloqueado, si no `ACTIVE`                                                                                                                                                                               | Es el criterio del prototipo (`estUsu`)                                                                                                                                                                                                                                                                                            |
| D-27 | `lastAccessAt` es el inicio de la última sesión del usuario                                                                                                                                                                                                                           | "Último acceso = última sesión" del prototipo                                                                                                                                                                                                                                                                                      |
| D-28 | El listado de usuarios incluye los bloqueados por defecto y los inactivos solo con `includeInactive`                                                                                                                                                                                  | Es como filtra el prototipo                                                                                                                                                                                                                                                                                                        |
| D-29 | El tipo de proceso guarda los dos precios tal como llegan y el tipo de cambio con que se vincularon; el cálculo lo hace el cliente                                                                                                                                                    | El prototipo calcula en el formulario y deja editar cualquiera de los tres valores. Si el servidor recalculara, el redondeo podría guardar un valor distinto del que el usuario confirmó                                                                                                                                           |
| D-30 | El tipo de cambio lo provee el backend en `GET /exchange-rate`                                                                                                                                                                                                                        | El prototipo lo precarga "con la cotización del backend" y muestra la fecha de actualización                                                                                                                                                                                                                                       |
| D-31 | Un `PATCH` sin cambios responde `200` sin tocar nada                                                                                                                                                                                                                                  | CU-10, escenario 6: no se registra nada en el historial. El aviso "No hay cambios para guardar" es del cliente, que compara antes de enviar                                                                                                                                                                                        |
| D-32 | El historial es de precios: un registro por modificación que cambia alguno de los dos precios hora, con el precio en dólares anterior y el nuevo en dólares (`previousValueUsd`, `newValueUsd`) y el tipo de cambio usado. Los cambios de nombre o descripción no se registran. Se consulta en su propio endpoint, sin paginar, del más reciente al más antiguo | Definido por el equipo: la tabla "Historial de precios" del prototipo muestra los valores en US$ ("Valor anterior (US$)", "Valor nuevo (US$)", "Tipo de cambio") |
| D-33 | `updatedAt` cambia con cualquier modificación y es la "Última actualización" del listado                                                                                                                                                                                              | Es como la calcula el prototipo (último registro del historial o el alta)                                                                                                                                                                                                                                                          |
| D-34 | El nombre del tipo de proceso es único sin distinguir mayúsculas, acentos ni espacios repetidos                                                                                                                                                                                       | CU-09, escenario 2, y el prototipo, que además ignora los acentos                                                                                                                                                                                                                                                                  |
| D-35 | Montos y tipo de cambio viajan como números con hasta dos decimales y mayores a 0                                                                                                                                                                                                     | Validación del prototipo (`parseMonto`) y RNF12 (dos decimales)                                                                                                                                                                                                                                                                    |
| D-36 | Un material es nombre más calidad; la combinación es única con la comparación de textos de §4. No tiene precio, proveedor ni presentación                                                                                                                                             | Modelo de Dominio V1.1 y el prototipo                                                                                                                                                                                                                                                                                              |
| D-37 | Si el nombre de un material nuevo coincide con uno existente, se guarda con la grafía existente                                                                                                                                                                                       | Evita que el filtro "Todos los materiales" muestre "Acero" y "acero" como dos opciones                                                                                                                                                                                                                                             |
| D-38 | `GET /materials/names` devuelve los nombres distintos, sin paginar                                                                                                                                                                                                                    | Alimenta el filtro del listado y el combo del alta                                                                                                                                                                                                                                                                                 |
| D-39 | Los materiales no tienen detalle ni modificación en este sprint                                                                                                                                                                                                                       | CU-38 (modificar) no está en el sprint y el listado del prototipo no tiene acciones por fila. La edición que aparece en la cotización es parte de CU-14                                                                                                                                                                            |
| D-40 | Los endpoints del Sprint 1 pasan a exigir sesión y el rol de la matriz                                                                                                                                                                                                                | Hasta ahora no había usuarios. La matriz de permisos fija quién opera cada catálogo                                                                                                                                                                                                                                                |
| D-41 | Las respuestas de error suman `code`, y los `409` informan el campo en `details`                                                                                                                                                                                                      | El cliente necesita distinguir errores con el mismo código HTTP. Sumar un campo no rompe a los clientes del Sprint 1                                                                                                                                                                                                               |
| D-42 | Las longitudes máximas (nombres 100, DNI 8, dirección 200, email 120, teléfono 50, usuario 30, contraseña 72, nombre de tipo de proceso 100, descripción 500, material y calidad 60) las fija este contrato                                                                           | El prototipo no las define. La contraseña tope en 72 por el límite del algoritmo de hash habitual (bcrypt)                                                                                                                                                                                                                         |
| D-43 | Los recursos devuelven solo lo que el prototipo muestra o necesita                                                                                                                                                                                                                    | Por ejemplo, el usuario que dio de alta un registro se guarda por trazabilidad pero no se expone                                                                                                                                                                                                                                   |
| D-44 | El `accessToken` dura **15 minutos** y el refresh token **7 días**. Los 7 días son la duración máxima de la sesión: se cuentan desde el ingreso y la rotación no los extiende                                                                                                         | Definido por el equipo (15/10/2026). Cierra el punto abierto de la duración máxima de la sesión                                                                                                                                                                                                                                    |
| D-45 | El refresh token viaja solo en la cookie `refresh_token` (`HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/api/auth`) y el `accessToken` se guarda en memoria                                                                                                                          | Ningún código del navegador puede leer el refresh token, que es el que vale 7 días. `Strict` alcanza porque frontend y API comparten origen detrás de nginx                                                                                                                                                                        |
| D-46 | `POST /auth/refresh` no cuenta como actividad: los 30 minutos de inactividad se miden sobre las peticiones con `accessToken`                                                                                                                                                          | Si renovar contara, una pestaña abierta que renueva sola cada 15 minutos mantendría la sesión viva hasta los 7 días, y no se cumpliría RNF08                                                                                                                                                                                       |
| D-47 | El refresh token rota en cada uso. Presentar uno ya reemplazado cierra la sesión, salvo en los 30 segundos siguientes a la rotación                                                                                                                                                   | La rotación limita el daño de un refresh robado. El margen evita que dos pestañas que renuevan a la vez se cierren la sesión entre ellas (CU-52: la sesión es una sola para todas las pestañas del navegador)                                                                                                                      |
| D-48 | El tipo de cambio sale de una API externa gratuita, que el backend consulta y cuyo último valor conserva                                                                                                                                                                              | Definido por el equipo (15/10/2026). Cuál API se usa es un detalle de implementación: el contrato fija solo `rate` y `updatedAt`, así que cambiar de proveedor no cambia el endpoint                                                                                                                                               |
| D-49 | Desbloquear un usuario no se implementa en este sprint: llega con "Modificar usuario" (CU-06), en el próximo                                                                                                                                                                          | Definido por el equipo (15/10/2026). Mientras tanto, un usuario bloqueado queda bloqueado; en desarrollo se puede destrabar desde la base de datos                                                                                                                                                                                 |
| D-50 | Modificar y dar de baja empleados (CU-46 y CU-48) van al próximo sprint, aunque el prototipo ya muestre "Editar" y "Dar de baja"                                                                                                                                                      | Definido por el equipo (15/10/2026). El recurso empleado ya trae `active` para cuando lleguen                                                                                                                                                                                                                                      |

### 8.2 Puntos abiertos

No quedan puntos abiertos. Los que tuvo este contrato se cerraron el 15/10/2026
con las decisiones D-44 (duración de la sesión), D-48 (fuente del tipo de
cambio), D-49 (desbloqueo de usuarios) y D-50 (modificar y dar de baja
empleados).

### 8.3 Visto en el prototipo y fuera de este contrato

Estos elementos del prototipo **no tienen endpoint ni campo** en esta versión:

- **Solicitudes de cotización:** listado, alta con documentación, detalle y
  cotizaciones pendientes (CU-13, ver D-02).
- **Cotización:** la pantalla "Registrar cotización" y su selector de materiales
  con "Agregar material" y "Editar" (CU-14, marcada "Próximo sprint").
- **Empleados:** "Editar" y "Dar de baja" en el detalle (CU-46 y CU-48, ver
  D-50).
- **Usuarios:** "Modificar" y "Dar de baja" en el detalle, marcados "A futuro"
  (CU-06 y CU-08).
- **Menú de usuario:** "Cambiar contraseña", marcado "A futuro" (CU-54).
- **Barra "Prototipo":** "Ingresar como…", "Roles (n)", "Ingresar con roles",
  "Simular sesión expirada", los estados de listado y "Reiniciar datos". Son
  herramientas de la demostración, no funciones del sistema.

### 8.4 Impacto sobre lo ya implementado

**Lo que rompe.** Todo el Sprint 1 pasa a exigir sesión (D-40): sin
`Authorization`, sus endpoints responden `401`. Backend y frontend tienen que
incorporar la autenticación a la vez.

**Backend**

- **Módulos nuevos:** autenticación y sesiones, empleados, usuarios, tipos de
  proceso (con su historial), tipo de cambio y materiales.
- **Esquema:** tablas de empleados, usuarios con sus roles, sesiones, tipos de
  proceso, historial de tipos de proceso y materiales. El usuario guarda el hash
  de la contraseña, los intentos fallidos y si está bloqueado. La sesión guarda
  su vencimiento a 7 días, la última actividad y el hash del refresh token
  vigente (y del anterior, para el margen de 30 segundos de D-47).
- **Autenticación global:** un guard que valide el `accessToken` (firma y
  15 minutos) y la sesión en cada petición, renueve la actividad y deje pasar
  solo los endpoints de `/auth`.
- **Cookies:** leer la cookie `refresh_token` en `/auth/refresh` y
  `/auth/logout` (por ejemplo, con `cookie-parser`), emitirla al ingresar y al
  renovar, y borrarla al cerrar. Los tres tiempos (15 minutos, 30 minutos y
  7 días) y el secreto de firma van como configuración en `jwt.config.ts`.
- **Autorización:** un guard de roles con "al menos uno de", aplicado también a
  los controladores del Sprint 1 (`suppliers`, `categories`, `factories`,
  `customers`).
- **Errores:** `AllExceptionsFilter` y los filtros de cada módulo agregan `code`;
  el de proveedores pasa su `field` de los `409` a `details`. Sumar `422`, `423` y
  `502` a `STATUS_NAMES`.
- **Tipo de cambio:** el adaptador a la API externa gratuita (D-48), con el último
  valor conservado.
- **Datos iniciales:** al menos un usuario `AS` en `prisma/seed.ts`, porque sin él
  nadie puede crear el resto.

**Frontend**

- **Cliente HTTP:** `shared/api/http.ts` ya envía `Authorization`, pero
  `getToken()` devuelve `null`; tiene que devolver el `accessToken`, guardado en
  memoria. El interceptor de respuestas, ante `401 ACCESS_TOKEN_EXPIRED`, llama
  una sola vez a `POST /auth/refresh` y repite las peticiones pendientes; ante
  `SESSION_EXPIRED` o `UNAUTHENTICATED`, manda al ingreso. `ApiError` tiene que
  leer `code` y `details` (hoy lee `message` y `field`).
- **Arranque:** al cargar la aplicación, llamar a `POST /auth/refresh` para
  recuperar la sesión antes de decidir si se muestra el ingreso.
- **Roles:** `domain/roles.ts` tiene exactamente los seis roles del contrato
  (D-11) y la matriz por recurso (`MODULE_ROLES`, `canAccess()`). Ya corregido:
  tenía un rol `A` ("Administrativo") que no existe.
- **Rutas:** guards por rol con los permisos de la matriz, pantalla de acceso
  denegado e inicio vacío para JT y ER.
- **Pantallas nuevas:** ingreso, Administración (empleados y usuarios), y en
  Gestión, materiales y tipos de proceso.

**Documentación**

- **OpenAPI:** `docs/openapi` describe el Sprint 1 sin seguridad; hay que sumar
  el esquema `bearerAuth`, el campo `code` en `Error.yaml` y los recursos de este
  contrato.
- **Glosario:** sumar `Employee`, `EmployeePosition`, `User`, `UserStatus`,
  `Role`, `Session`, `ProcessType`, `ProcessTypeHistory`, `ExchangeRate`,
  `Material`, `hourlyRateArs`, `hourlyRateUsd`, `exchangeRate`, `quality` y
  `lastAccessAt`.

---

## 9. Resumen por historia

| Jira    | CU  | Qué entra al contrato                                                                                                                                                                      |
| ------- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| DTC-33  | 53  | `POST /auth/login` con bloqueo al quinto fallo y `POST /auth/refresh`: `accessToken` de 15 minutos, refresh token de 7 días, 30 minutos de inactividad y control de roles en cada petición |
| DTC-32  | 52  | `POST /auth/logout`, que invalida la sesión en el servidor                                                                                                                                 |
| DTC-28  | 45  | `POST /employees`, con puesto y DNI único                                                                                                                                                  |
| DTC-201 | 47  | `GET /employees` con búsqueda, inactivos y "tiene usuario"; `GET /employees/{employeeId}`                                                                                                  |
| DTC-129 | 05  | `POST /users`, un usuario por empleado activo, nombre único y al menos un rol                                                                                                              |
| DTC-131 | 07  | `GET /users` con búsqueda, filtro por rol e inactivos; `GET /users/{userId}`                                                                                                               |
| DTC-203 | 09  | `POST /process-types` con los dos precios vinculados y `GET /exchange-rate`                                                                                                                |
| DTC-204 | 10  | `PATCH /process-types/{processTypeId}` con historial de precios en dólares y `GET /process-types/{processTypeId}/history`                                                                              |
| DTC-205 | 11  | `GET /process-types` y `GET /process-types/{processTypeId}`                                                                                                                                |
| DTC-116 | 37  | `POST /materials`, nombre y calidad únicos, y `GET /materials/names`                                                                                                                       |
| DTC-118 | 39  | `GET /materials` con filtro por material y búsqueda por calidad                                                                                                                            |

Además: los endpoints del Sprint 1 pasan a exigir sesión y rol (D-40), y las
respuestas de error suman `code` (D-41).

En números: **18 endpoints nuevos**, **4 grupos de endpoints del Sprint 1** que
pasan a exigir sesión, 3 enumerados, 20 códigos de error, 3 códigos HTTP nuevos,
50 decisiones (D-01 a D-50) y ningún punto abierto.
