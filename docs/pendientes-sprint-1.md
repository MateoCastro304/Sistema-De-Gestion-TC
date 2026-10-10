# Pendientes para cerrar el Sprint 1

Relevamiento del 6 de octubre de 2026 sobre `develop` (commit `9e72345`), para la reunión del jueves.

**Actualizado el 7 de octubre de 2026:** ya se resolvió lo del frontend que no dependía de una decisión del equipo. El resumen está en "Qué se resolvió y qué queda"; los puntos resueltos siguen en su lugar, marcados como tales.

**Actualizado el 8 de octubre de 2026:** se cerraron las reglas de encargados y fábricas (bajas, unicidad, CUIT inmutable, nombre único; ver `docs/decisiones-clientes-fabricas.md`, sección 5.3). Lo que depende del resto del equipo está en "Para hablar con el grupo".

## Cómo se hizo

- Se levantaron los contenedores de desarrollo (`make dev-up`) y se probó cada pantalla contra el backend y la base reales, sin mocks.
- Se probó la API directamente con casos borde: validaciones, duplicados, paginado, ids inválidos.
- Se compilaron backend y frontend, y se corrieron lint y tests.
- Se leyó el código de los cuatro módulos, el esquema de la base, el contrato OpenAPI y la configuración de Docker.

Cada punto de abajo dice cómo se comprobó. Lo que no se pudo comprobar está al final, en "No verificado".

## Estado general

Los cuatro catálogos funcionan de punta a punta contra el backend real: **Encargados, Fábricas, Rubros y Proveedores**. Alta, edición y baja andan donde existen. La reactivación se quitó a propósito: una baja es definitiva (ver decisiones, sección 5.3).

| Chequeo | Resultado |
|---|---|
| Frontend: compilación, tipos y lint | Pasa, sin errores |
| Frontend: tests | No tiene ninguno |
| Backend: compilación de `src` | Pasa |
| Backend: tests unitarios | 171 de 171 pasan |
| Backend: tests de integración y API | Rotos (ver B-05) |
| Backend: lint | 449 problemas (ver B-17) |
| Contrato OpenAPI: validación de sintaxis | Pasa, pero no describe la API real (ver D-01) |
| Contenedores de desarrollo | Levantan; las migraciones se aplican |
| Integración continua | No hay (ver I-01) |

El módulo más atrasado es **Proveedores en el backend**: es el único que sigue sin base de datos.

## Qué se resolvió y qué queda

Resuelto después del relevamiento, todo en el frontend y probado contra el backend real:

| Punto | Qué se hizo |
|---|---|
| F-01 | Proveedores muestra todos y cuenta bien. Es un parche hasta que el backend devuelva el total (B-03). |
| F-02 | Un rubro nuevo aparece al instante al crear una fábrica. |
| F-05 | Pantalla propia para errores inesperados, en vez de la de React Router en inglés. |
| F-07 | Detalles visuales: botones del panel, guardar en celular, paginador, guiones, estados vacíos. |
| F-09 (parte) | `styles.css` pasó de 4820 a 2020 líneas; quedó sólo lo que está en uso. |
| B-10 | El teléfono del encargado se valida con `Phone` (8 a 15 dígitos) y se guarda sin separadores. |
| B-11 | Obsoleto: se quitó la reactivación de encargados y de fábricas, así que ese estado ya no se puede producir. |
| B-12 | Los filtros de error de fábricas y encargados solo convierten en 400 los errores de validación del dominio; el resto es 500 sin mensaje interno. |
| B-13 (parte) | Filtros en `GET /factories`, `PATCH` con cuerpo vacío, mail único con índice, choque simultáneo de CUIT/nombre/mail → 409, id del encargado, nombre de fábrica repetido. Ver B-13. |
| F-03 | Baja de fábrica desde el detalle (con el 409 si tiene encargados activos). La reactivación se descartó. |
| Decisiones 7 y 8 | El CUIT es inmutable y el nombre de la fábrica es único (entre activas). |

Quedan **28 puntos** de los 36:

| Área | Bloqueantes (P0) | Importantes (P1) | Menores (P2) |
|---|---|---|---|
| Backend | 2 | 8 | 6 |
| Frontend | 0 | 1 | 3 |
| Contrato y documentación | 0 | 2 | 1 |
| Infraestructura y proceso | 0 | 2 | 3 |

- Los **2 bloqueantes** son de proveedores en el backend: se guardan en memoria (B-01) y no se pueden eliminar (B-02).
- El **importante del frontend** que queda espera una decisión: restaurar rubros (F-04). La baja de fábricas (F-03) ya se resolvió.
- En el frontend no queda nada que se pueda cerrar sin el backend o sin una decisión del equipo, salvo deuda: tests (F-06) y el tamaño del bundle (F-09).

## Prioridades

- **P0 — Bloqueante.** Hay una función a la vista que no anda o se pierden datos.
- **P1 — Importante.** Anda, pero mal, o hay una regla inconsistente.
- **P2 — Menor.** Prolijidad, deuda técnica o documentación.

---

## 1. Backend — Proveedores

Historial de git: mmachuca.

### B-01 · P0 · Los proveedores se guardan en memoria

`SuppliersModule` usa `InMemorySupplierRepository`. Los otros tres módulos ya usan Prisma. Todo proveedor cargado se pierde al reiniciar el contenedor del backend.

- **Cómo se ve:** se cargaron proveedores, se reinició el backend y el listado volvió vacío. La tabla `supplier` tiene 0 filas.
- **Qué hacer:** escribir el repositorio Prisma de proveedores. Antes hay que resolver B-04.

### B-02 · P0 · Falta `DELETE /suppliers/:id`

El contrato lo define y el frontend lo usa, pero el controlador no lo tiene. Tampoco se puede dar de baja por `PATCH`: `active` se rechaza como propiedad desconocida.

- **Cómo se ve:** `DELETE /suppliers/3` responde `404 Cannot DELETE`. En pantalla, "Eliminar proveedores" termina siempre en "No se pudo eliminar el proveedor".
- **Qué hacer:** agregar el endpoint de baja lógica. El contrato pide 409 si el proveedor está asignado a órdenes de trabajo abiertas.

### B-03 · P1 · El listado devuelve como máximo 20 y no informa el total

`GET /suppliers` pagina de a 20 pero responde un array pelado. El frontend no tiene forma de saber que hay más.

- **Cómo se ve:** se cargaron 22 proveedores y `GET /suppliers` devolvió 20, sin indicar que había más. La pantalla mostraba 20 y decía "20 proveedores registrados". El frontend lo esquiva pidiendo una página de 1000 (ver F-01), por eso dejó de ser bloqueante.
- **Qué hacer:** responder `{ items, total, page, limit }`, como ya hacen `/customers` y `/factories`. Del lado del frontend, ver F-01.

### B-04 · P1 · La tabla no puede guardar lo que la API acepta

**Hoy esto no se nota.** Crear un proveedor con dos tipos funciona, porque los proveedores todavía se guardan en memoria (B-01) y la tabla no se usa: tiene 0 filas. El problema aparece al conectar proveedores a la base.

| Dato | API | Base (`supplier`) |
|---|---|---|
| Tipos | `supplierTypes`, una lista con al menos uno | `supplierType`, un solo valor |
| Razón social | hasta 120 caracteres | `legal_name` de 80 |
| Observación | no existe | columna `observation` sin uso |

- **Qué hacer:** decidir si un proveedor tiene uno o varios tipos (ver "Decisiones pendientes") y ajustar la base o la API antes de B-01.

### B-05 · P1 · Tests de integración y de API rotos

`npx tsc --noEmit` da 2 errores, en `test/shared/factories/supplier-factory.ts:41` y `test/modules/suppliers/int/cu33-register-supplier.int.spec.ts:30`: usan `name`, que en la base ahora es `legalName`.

Renombrar no alcanza. Esos tests están escritos para una API que ya no existe:

| Los tests esperan | La API real |
|---|---|
| `type` (un valor) | `supplierTypes` (una lista) |
| `name` | `legalName` |
| La lista dentro de `response.body.data` | La lista directa |
| `id` como texto | `id` como número |

- **Efecto:** `make test-int` y `make test-api` fallan. No afecta al arranque de la app ni a los tests unitarios.
- **Qué hacer:** reescribirlos mirando el controlador actual.

### B-06 · P1 · La razón social repetida distingue mayúsculas

- **Cómo se ve:** existiendo "Proveedor prueba 01", se pudo crear "PROVEEDOR PRUEBA 01" (201). Con el mismo texto exacto sí responde 409.
- **Referencia:** rubros compara sin distinguir mayúsculas ("AUTOPARTES" responde 409).

### B-07 · P2 · Formato de errores distinto al resto

Los errores de proveedores no traen `path` ni `timestamp`, que el contrato exige. Los mensajes están en inglés ("CUIT check digit is invalid"). El frontend ya no los muestra tal cual, pero conviene unificar (ver B-18).

### B-08 · P2 · El teléfono se devuelve sin formato

Se carga `+54 9 351 444-5678` y vuelve `+5493514445678`. La pantalla lo muestra así.

---

## 2. Backend — Encargados y Fábricas

Historial de git: magali.

### B-09 · P1 · La búsqueda de encargados distingue acentos

- **Cómo se ve:** `nameContains=gomez` no encuentra a "Gómez". En pantalla, buscar "gomez" o "perez" devuelve la lista vacía.
- **Nota:** el frontend ya ignora acentos en las búsquedas que filtra él (fábricas, rubros, proveedores). Ésta la resuelve el backend.
- **Qué hacer:** `unaccent()` de Postgres en `CustomerPrismaRepository.list`. Requiere habilitar la extensión `unaccent` en la base: es un cambio compartido, ver "Para hablar con el grupo".

### B-10 · Resuelto · El backend aceptaba cualquier texto como teléfono del encargado

- **Cómo se ve:** `POST /factories/3/customers` con `phone: "abc"` responde 201. El frontend lo valida, pero la API queda abierta.
- **Resuelto:** `Customer.create`, `update` y `setPhone` validan con `Phone` (8 a 15 dígitos) y guardan el teléfono normalizado, sin separadores. `reconstruct` no revalida lo que ya está en la base, para no romper filas viejas.

### B-11 · Obsoleto · Se podía reactivar un encargado de una fábrica dada de baja

Crear un encargado en una fábrica inactiva responde 409. Pero reactivar uno que ya existía responde 204.

- **Cómo se veía:** se dio de baja un encargado y después su fábrica; al reactivar el encargado quedó activo dentro de una fábrica inactiva. Es justo el estado que la baja de fábrica intenta impedir ("has active customers").
- **Por qué ya no aplica:** se quitó la reactivación de encargados y de fábricas (decisiones, sección 5.3).

### B-12 · Resuelto · Los filtros de error convertían cualquier fallo en un 400

`CustomerExceptionFilter` y `FactoryExceptionFilter` están declarados con `@Catch()` sin argumentos. Cualquier `Error`, incluido un bug o un error de Prisma, sale como **400** con el mensaje interno tal cual.

- **Cómo se veía:** `PATCH /factories/3/deactivate` sobre una fábrica ya inactiva respondía 400 con `details: [{ field: "name" }]`, aunque el nombre no tiene nada que ver. El campo se adivina buscando palabras dentro del mensaje.
- **Riesgo:** un fallo de base llega al cliente como error de validación, con el texto de Prisma incluido.
- **Resuelto:** los dominios de fábrica y encargado lanzan `DomainValidationError` y los filtros solo convierten esos en 400 (el campo se sigue deduciendo del mensaje, pero solo para errores de validación). Todo lo demás es 500 con mensaje genérico y el detalle va al log. Dar de baja algo ya dado de baja responde 409.

### B-13 · P2 · Detalles de la API

| Tema | Situación |
|---|---|
| `GET /factories` sin filtros | **Resuelto**: el controlador acepta `categoryId`, `nameContains` y `active`. El frontend todavía pide 1000 y filtra en el navegador. |
| `active=xx` en `/customers` | No da error: se interpreta como `false`. |
| `PATCH` con cuerpo vacío | **Resuelto** en fábricas y encargados: responde 400. |
| `limit` sin tope | `limit=100000` se acepta. **Pendiente**: tope compartido por todos los módulos, ver "Para hablar con el grupo". |
| Mail único por fábrica | **Resuelto**: índice único parcial `(factory_id, lower(mail))` entre encargados activos, además del chequeo del código. |
| CUIT duplicado simultáneo | **Resuelto**: el repositorio captura `P2002` y responde 409 (CUIT o nombre en fábricas, mail en encargados). |
| Id del encargado | **Resuelto**: se queda con el `max + 1` del repositorio (con reintento ante colisión) y se eliminó el trigger `fn_gen_id_manager` en la migración `20261008000000_customers_factories_rules`. |
| `Cuit` | `factory` ya importa `Cuit` desde `shared/domain/cuit`. **Falta** que el cambio de proveedores lo mueva ahí (ver I-04); hasta entonces no compila. |
| Nombre de fábrica repetido | **Resuelto**: el nombre es único entre fábricas activas, sin distinguir mayúsculas (409). |

### Código de fábrica

Sigue pendiente, por decisión documentada en `docs/decisiones-clientes-fabricas.md` (sección 5.1). La historia CU-58 lo pide obligatorio y único. Hay que definir si entra en este sprint.

---

## 3. Backend — Rubros

Historial de git: Montse.

### B-14 · P2 · El alta responde distinto al resto de los endpoints

`POST /categories` devuelve `{ message, category }`. Editar, ver, restaurar y eliminar devuelven el rubro directo. El frontend ya lo contempla, pero es una excepción que conviene sacar.

### B-15 · P2 · Detalles

| Tema | Situación |
|---|---|
| `DELETE /categories/:id` | Responde 200 con el rubro. El contrato dice 204 sin cuerpo. |
| 404 | No trae `path` ni `timestamp`; trae un campo `id`. |
| `category.name` | La columna admite `NULL`. |
| Listado | Devuelve sólo activos, como array, de a 20. El frontend pide 100. |

---

## 4. Backend — General

### B-16 · P1 · Ningún endpoint pide autenticación

No hay guards ni módulo de auth. Existen `jwt.config.ts` y las variables `JWT_SECRET`, pero nada las usa. Toda la API es pública.

- **Qué hacer:** confirmar si el login entra en el Sprint 1. En el frontend, `features/auth` está vacío.

### B-17 · P1 · Lint del backend: 449 problemas

421 errores y 28 advertencias. 313 son de formato (`prettier`) y se arreglan solos. El resto son usos de `any` (`no-unsafe-*`, ~105) y `async` sin `await` (21).

| Carpeta | Errores |
|---|---|
| `src/factory` | 132 |
| `src/customers` | 109 |
| `src/categories` | 56 |
| `test/` | 76 |
| `src/shared` | 23 |
| `src/suppliers` | 14 |

- **Ojo:** `npm run lint` corre con `--fix` y modifica archivos. Conviene hacerlo en un commit aparte, sólo de formato.

### B-18 · P1 · Cuatro formatos de error distintos

Cada módulo arma sus errores a su manera, y las rutas inexistentes usan el formato por defecto de Nest.

| Origen | `path` y `timestamp` | Idioma del mensaje |
|---|---|---|
| Fábricas y encargados | Sí | Inglés |
| Rubros | Sí en validación, no en 404 | Español |
| Proveedores | No | Inglés |
| Ruta inexistente | No | Inglés |

- **Qué hacer:** un único filtro global y una decisión sobre el idioma. Hoy el frontend traduce por código HTTP.

### B-19 · P2 · Detalles

- `make seed` y el servicio `seed` de `docker-compose.test.yaml` corren `npx prisma db seed`, pero no hay ningún seed configurado.
- `GET /` responde "Hello World!". Hay dos endpoints de salud: `/health` y `/health/db`.
- Cada controlador declara su propio `ValidationPipe` además del global.
- En develop sólo proveedores tiene tests de integración. Los de fábricas y encargados están en una rama sin revisar (ver I-04).
- `backend/test/README.md` está vacío.

---

## 5. Frontend

### F-01 · Resuelto con un parche · Proveedores mostraba sólo 20 y contaba mal

Consecuencia de B-03. El frontend ahora pide una página grande (1000), como ya hacen fábricas y rubros: con 24 proveedores cargados muestra los 24 y el contador coincide.

Es un parche. La solución de fondo sigue siendo B-03: que el backend devuelva el total y paginar en pantalla.

### F-02 · Resuelto · Un rubro nuevo tardaba hasta un minuto en aparecer al crear una fábrica

La pantalla de Rubros y el selector de rubro de Fábricas guardaban la lista en cachés separadas, y crear, renombrar o eliminar un rubro no avisaba al selector.

Ahora las dos leen la misma caché: el selector usa la lista de `features/catalogs/categories` y sólo la adapta a la forma de su formulario. Se eliminó la segunda función `listCategories`. Comprobado: un rubro recién creado aparece al instante en "Nueva fábrica", sin un pedido extra al backend.

### F-03 · Resuelto · No había forma de dar de baja una fábrica

El detalle de la fábrica ahora tiene el botón "Eliminar" con confirmación. Si la fábrica tiene encargados activos, el backend responde 409 y la pantalla lo explica.

La reactivación se descartó: una baja es definitiva y, para volver, se registra de nuevo (decisiones, sección 5.3). Que una fábrica inactiva no aparezca en el listado ni se pueda abrir por URL es el comportamiento esperado. Un encargado activo ya no puede quedar en una fábrica inactiva, porque la baja de la fábrica exige que no los tenga.

### F-04 · P1 · No se puede restaurar un rubro eliminado

El backend tiene `PATCH /categories/:id/restore`. La pantalla no lista los eliminados ni ofrece restaurarlos.

### F-05 · Resuelto · Sin pantalla para errores inesperados

Si una pantalla fallaba al dibujarse se veía la pantalla de error por defecto de React Router, en inglés. Ahora hay una página propia (`app/router/ErrorPage.tsx`) que conserva el menú, ofrece reintentar y deja salir navegando.

De paso el router pasó a tener un solo layout para toda la app: antes cada sección montaba el suyo y el menú perdía su estado (por ejemplo, si estaba colapsado) al cambiar de sección.

### F-06 · P2 · El frontend no tiene tests

Ni archivos de test ni comando para correrlos. Para empezar, lo más barato de cubrir son las validaciones: `shared/lib/cuit.ts`, teléfono y los esquemas de los formularios.

### F-07 · Resuelto · Detalles visuales

- **Botones del panel azul:** "Cancelar" y "Eliminar proveedores" parecían deshabilitados cuando el degradado animado pasaba por su fase clara. Ahora usan un vidrio oscuro que se lee en las dos fases. El subtítulo del panel también se aclaró.
- **Edición en celular:** "Cancelar" y "Guardar cambios" aparecen al pie del formulario. Antes quedaban arriba, en el panel, y había que volver a subir.
- **Listado de Encargados:** la columna Nombre y la de Fábrica tienen más lugar. A menos de 1350 px un nombre largo todavía ocupa dos renglones, igual que en Proveedores.
- **Paginador de Encargados:** centrado y con el texto legible.
- **Datos vacíos:** el guion es el mismo en todas las tablas (componente `ValueOrDash`). En la ficha de celular esos datos se esconden.
- **"Nuevo proveedor"** tiene la flecha de volver, como las otras pantallas de alta.
- **Cargando, no encontrado y listas vacías** usan el mismo recuadro en toda la app.

Queda pendiente: el teléfono del proveedor se muestra como lo devuelve el backend (ver B-08).

### F-08 · P2 · Límites silenciosos

El frontend pide páginas grandes y filtra en el navegador. Si se superan, faltan datos sin aviso.

| Lista | Tope |
|---|---|
| Fábricas | 1000 |
| Rubros | 100 |
| Encargados de una fábrica | 200 |
| Encargados, para contar por fábrica | 1000 |
| Proveedores | 1000 (parche, ver F-01) |

### F-09 · P2 · Deuda técnica

- **Resuelto:** `styles/styles.css` tenía 4820 líneas con dos capas, los estilos viejos y el rediseño encima. Se dejó sólo lo que está en uso: 2020 líneas, y el CSS compilado bajó de 87 a 42 kB. Se verificó comparando el estilo calculado de cada elemento antes y después, en 25 estados de la app y tres anchos de pantalla, sin diferencias. Los estilos de pantallas que todavía no existen (wizard de cotizaciones, stepper, carga de planos, hoja de ruta) se movieron a `styles/kit-pantallas-futuras.css`, que no se importa: están escritos con el diseño anterior y hay que adaptarlos antes de usarlos.
- El bundle de JavaScript pesa 536 kB sin dividir. Vite lo advierte al compilar.
- Los tipos de la API están escritos a mano en cada feature. La carpeta `src/api-contract`, pensada para generarlos del contrato, está vacía.
- Cuatro pantallas muestran el mensaje de error tal cual al fallar la carga de un listado.
- Advertencia de lint en `public/mockServiceWorker.js`, que es un archivo generado.

---

## 6. Contrato y documentación

### D-01 · P1 · El contrato OpenAPI no describe la API real

`docs/openapi/openapi.yaml` pasa la validación de sintaxis, pero el contenido quedó viejo.

| Tema | Contrato | Backend |
|---|---|---|
| Encargados | `/factories/{id}/managers` | `/factories/{id}/customers` y `/customers` |
| Campos del encargado | `name`, `email`, `phone`, `role` | `firstName`, `lastName`, `phone`, `mail` |
| Campos de la fábrica | `legalName`, `taxId` | `name`, `cuit`, `payMethod`, `isActive` |
| Baja de fábrica y encargado | `DELETE`, 204 | `PATCH .../deactivate` (204). No hay reactivación |
| Listados | Array | `{ items, total, page, limit }` en fábricas y encargados |
| Rubro | Sin `active` | Con `active`; alta envuelta en `{ message, category }` |
| Proveedores | `DELETE` definido | No implementado |

- El ejemplo de CUIT de proveedores, `30-70987654-3`, no pasa la validación del propio backend: el dígito verificador es inválido.
- Swagger UI (`localhost:8081`) muestra ese contrato, así que hoy informa mal.

### D-02 · P1 · `docs/openapi/customers.yaml` quedó huérfano

Es la propuesta anterior del frontend. No está enlazada desde `openapi.yaml` y ya no coincide con nada. Hay que borrarla o integrarla al oficial.

### D-03 · P2 · Documentos desactualizados

- `docs/inconsistencias-clientes-fabricas.md`: el propio `decisiones-clientes-fabricas.md` aclara que quedó viejo. Borrarlo o marcarlo.
- `README.md` de la raíz: tiene un comentario de plantilla sin sacar.
- `SETUP.md` de la raíz está vacío; el real es `docs/SETUP.md`.
- `docs/CONTRIBUTING.MD` menciona `.github/PULL_REQUEST_TEMPLATE.md`, que no existe.

---

## 7. Infraestructura y proceso

### I-01 · P1 · No hay integración continua

La carpeta `.github` sólo tiene un `.gitkeep`. Nada corre compilación, lint ni tests al subir cambios. Por eso llegaron a develop tests rotos y 449 problemas de lint sin que nadie lo notara.

- **Qué hacer:** un workflow mínimo: compilar y lint del frontend; compilar, lint y tests unitarios del backend; validar el contrato.

### I-02 · P1 · Se está mergeando directo a develop

`CONTRIBUTING.MD` pide un PR revisado por otra persona. En la práctica los merges de estos días fueron directos. Hay que decidir si se respeta la regla o se cambia.

### I-03 · P2 · `main` está 219 commits atrás de `develop`

Definir cuándo se promueve develop a main al cerrar el sprint.

### I-04 · P2 · Limpieza de ramas

Hay 17 ramas remotas ya mergeadas a develop que se pueden borrar.

Ramas sin mergear:

| Rama | Autor y fecha | Situación |
|---|---|---|
| `feat/suppliers-prisma-adapter` | mmachuca, 18/9 | Un commit: mueve `Cuit` a `shared/domain` (fábricas ya importa de ahí, ver B-13). Mergea sin conflictos. **Incluye un PDF ajeno al proyecto** (`charla-arquitectura-estudio-juridico.pdf`); sacarlo antes de mergear. No tiene todavía el adaptador Prisma. |
| `feature/tests-clients` | MateoCastro304, 18/9 | Tests de fábricas y encargados, marcados "PENDING REVIEW". Son anteriores al cambio de `/fabricas` a `/factories`: hay que actualizarlos. |
| `feature/abmc-customers-and-factories` | MAGALI, 5/9 | Vieja; choca con develop en 4 archivos. Probablemente para borrar. |
| `feature/frontend-backend-alignment` | Facundo Fiorani, 5/10 | **Obsoleta**: adaptaba el frontend en sentido contrario al que se decidió. Borrar. |

### I-05 · P2 · Detalles de Docker

- El contenedor de desarrollo del backend monta `docker.sock` e instala el cliente de Docker, para los tests con contenedores. Sólo debería existir en desarrollo.
- El servicio `seed` del compose de test falla hasta que haya un seed (ver B-19).
- Entrando por el puerto 80, la recarga en caliente de Vite no funciona: `nginx.dev.conf` no reenvía la conexión WebSocket y la consola muestra `WebSocket connection to ws://localhost/ failed`. Hay que recargar la página a mano. Por el puerto 5173 sí funciona.

---

## Decisiones pendientes

Para resolver el jueves, porque definen el trabajo de arriba.

1. **¿Un proveedor tiene uno o varios tipos?** La API dice varios; la base, uno. (B-04)
2. **¿El código de fábrica entra en este sprint?** La historia CU-58 lo pide. (sección 2)
3. **¿El login entra en este sprint?** Hoy la API es pública. (B-16)
4. **¿Cuál es el contrato oficial y quién lo actualiza?** (D-01, D-02)
5. **¿Formato único de errores, y en qué idioma?** (B-18)
6. **¿Restaurar rubros tiene pantalla en este sprint?** (F-04). La baja de fábricas ya tiene pantalla y la reactivación se descartó.
7. ~~**¿El CUIT de una fábrica se puede modificar?**~~ **Resuelto:** no se puede modificar.
8. ~~**¿El nombre de la fábrica tiene que ser único?**~~ **Resuelto:** sí, entre fábricas activas.
9. **¿Se trabaja con PRs revisados o con merge directo?** (I-02)

## Orden sugerido

1. Tomar las decisiones 1 a 4. Sin eso, B-01, B-04 y D-01 no se pueden cerrar.
2. **Proveedores en backend:** B-04, B-01, B-02, B-03, y después B-05.
3. **Reglas de encargados y fábricas:** B-09 (falta la extensión `unaccent`). B-10, B-11 y B-12 ya están resueltos.
4. **Frontend:** F-04 según la decisión 6. F-01, F-02, F-03, F-05 y F-07 ya están resueltos.
5. **Contrato:** D-01 y D-02, cuando la API quede estable.
6. **CI y lint:** I-01 y B-17. Conviene dejarlo antes del próximo sprint.
7. **Limpieza:** ramas (I-04) y documentos (D-03).

## Para hablar con el grupo

Cambios que tocan más que fábricas y encargados, y que no se hicieron por eso:

1. **`Cuit` en `shared`.** Fábricas ya importa `../../shared/domain/cuit`. Hay que mover `suppliers/domain/cuit.ts` (y su spec) a `shared/domain/` y actualizar `suppliers/domain/supplier.ts` y `suppliers/domain/ports/supplier.repository.ts`. Es el cambio de la rama `feat/suppliers-prisma-adapter`. Hasta que se haga, el backend no compila.
2. **Tope de `limit`.** Hoy se acepta cualquier valor. Propuesta: 1000 como máximo en todos los listados (el frontend pide hasta 1000), validado en los casos de uso de listado de los cuatro módulos.
3. **Búsqueda sin acentos (B-09).** Se resuelve con la extensión `unaccent` de Postgres, que se habilita para toda la base (`CREATE EXTENSION IF NOT EXISTS unaccent`), así que conviene acordarlo y que la migración la cree una sola persona.
4. **Contrato OpenAPI (D-01, D-02).** Falta reflejar: `PATCH /factories/{id}` sin `cuit`; los 409 de fábricas (CUIT, nombre y encargados activos); los filtros `active`, `nameContains` y `categoryId` en `GET /factories`; y que no hay endpoints `activate`. También decidir si se borran `docs/openapi/customers.yaml` y `docs/inconsistencias-clientes-fabricas.md`, que todavía mencionan la reactivación.

Otras cosas para tener en cuenta:

- **Migración con índices parciales.** Prisma no los expresa en `schema.prisma`: hay que aplicarla con `prisma migrate deploy`, y `prisma migrate dev` puede proponer borrarlos. Antes de migrar conviene revisar que no haya CUIT, nombres ni mails repetidos entre registros activos (consultas en `decisiones-clientes-fabricas.md`, sección 5.3).
- **Faltan tests de integración** para las reglas nuevas: crear con el CUIT o el nombre de una fábrica dada de baja anda; con los de una activa da 409; `PATCH` no cambia el CUIT.
- **`Phone` exige 8 a 15 dígitos.** Si el frontend o los datos existentes tienen teléfonos más cortos, el alta y la edición los van a rechazar.
- **`factory-module-wiring.spec.ts` no corre** en este entorno: Jest no resuelve el import `./internal/class.js` del cliente de Prisma 7 generado. Ya fallaba antes de estos cambios.

---

## No verificado

- **Producción.** No se levantó `make prod-up` ni se probó la imagen de producción.
- **Alcance del sprint.** No se contrastó contra el tablero ni contra el ERS qué historias entran. Varios puntos dependen de eso.
- **Navegadores.** Se probó en un solo navegador (Chromium).
- **Accesibilidad.** No se hizo una revisión con lector de pantalla ni de contraste.
- **Rubros en celular.** Se comprobó que no hay desborde horizontal a 375 px, pero no se revisó visualmente.
- **Concurrencia.** Los casos de altas simultáneas salen de leer el código, no de una prueba.
