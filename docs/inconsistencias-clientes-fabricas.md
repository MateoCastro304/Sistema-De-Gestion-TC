# Inconsistencias: Clientes y Fábricas (frontend, backend y base de datos)

Relevamiento del 5 de octubre de 2026 sobre la rama `feature/backend-customers-and-factories`.

Compara tres cosas:

- **Frontend:** `frontend/src/features/catalogs/customers`
- **Backend:** `backend/src/customers`, `backend/src/factory`, `backend/src/categories`
- **Base de datos:** `backend/prisma/schema.prisma` y sus migraciones

## Resumen

Hoy el frontend **no está conectado** al backend. Funciona con los mocks (MSW), que implementan el contrato propuesto en `docs/openapi/customers.yaml`, distinto del que expone el backend.

Con los mocks apagados, la integración falla en tres niveles:

1. Con el servidor de Vite directo, las rutas no llegan al backend (el proxy no quita el prefijo `/api`). Por nginx sí llegan.
2. El listado tiene otra forma (objeto paginado en vez de array).
3. Los nombres y la obligatoriedad de los campos no coinciden.

Además, el backend todavía no se probó contra la base real, y la base no tiene varias columnas que el frontend da por hechas.

Las secciones 1 y 2 bloquean todo lo demás.

---

## 1. Conexión entre frontend y backend

| # | Tema | Frontend | Backend | Efecto |
|---|---|---|---|---|
| 1.1 | Prefijo de rutas | Pide todo bajo `/api` (`VITE_API_URL=/api`). El proxy de Vite (`vite.config.ts`) reenvía a `localhost:3000` **sin quitar** el prefijo. | Expone `/customers`, `/factories`, `/categories`, sin prefijo. Es lo que espera nginx: `location /api/ { proxy_pass http://backend:3000/; }` quita el `/api/` antes de reenviar. | Por nginx (Docker y producción) las rutas funcionan. Con `npm run dev` directo (puerto 5173) dan 404. |
| 1.2 | Mocks | Si `VITE_USE_MOCKS=true` en `.env.local`, responde MSW y no se llama al backend. | — | Hay que verificar ese valor antes de probar la integración. |
| 1.3 | Forma del listado | `GET /customers` y `GET /factories` esperan un **array**. | Devuelven `{ items, total, page, limit }`. | `useCustomers` y `useFactories` hacen `data.filter(...)` y fallan con `data.filter is not a function`. |
| 1.4 | Paginación | No envía `page` ni `limit`. Busca y filtra en el navegador. | Pagina con 20 registros por defecto. | El frontend vería solo los primeros 20 registros. |
| 1.5 | Campos no declarados | Envía campos que el backend no conoce (ver secciones 2 y 3). | La validación global tiene `forbidNonWhitelisted: true`. | El backend responde 400 en vez de ignorarlos. |
| 1.6 | Tipo de los ids | Los define como `string`. Los parámetros de ruta también son string. | Los devuelve como número. | Comparaciones como `factory.id === factoryIdDeLaUrl` dan `false` (`3 === "3"`). |
| 1.7 | Errores por campo | `http.ts` lee solo `message` (string o array). | Los filtros devuelven además `details: [{ field, message }]`. | El mensaje se muestra, pero el formulario no puede marcar qué campo falló. |

---

## 2. Clientes (encargados)

### 2.1 Campos

| Campo | Frontend | Backend | Base (`manager_customer`) |
|---|---|---|---|
| Nombre | `firstName`, obligatorio | `name`, obligatorio, máx. 50 | `name`, NOT NULL, 50 |
| Apellido | `lastName`, obligatorio | `lastName`, obligatorio, máx. 50 | `last_name`, **nullable**, 50 |
| Teléfono | `phone`, opcional | `phone`, **obligatorio**, máx. 50 | `phone`, nullable, 50 |
| Mail | `mail`, opcional | `mail`, **obligatorio**, máx. 120 | `mail`, nullable, 255 |
| WhatsApp | `hasWhatsapp`, obligatorio | no existe | no existe |
| Observaciones | `observation` | no existe | no existe |
| Fábrica | `factoryId` en la URL **y** en el cuerpo, string | `factoryId` solo en la URL, número | `factory_id`, entero, parte de la PK |
| Activo | `isActive` | `active` | `is_active` |
| Id | `id`, string | `id`, número | `id`, entero, correlativo por fábrica |
| Fechas | no las usa | no las devuelve | `created_at`, `updated_at` |

### 2.2 Reglas de negocio

| # | Regla | Frontend | Backend |
|---|---|---|---|
| 2.2.1 | Medio de contacto | Exige **al menos uno** entre teléfono y mail. | Exige **los dos**. |
| 2.2.2 | Mail único | Único dentro de la fábrica. | Único dentro de la fábrica. Coincide. |
| 2.2.3 | Cambio de fábrica | El formulario de edición envía `factoryId` y permite cambiarla. | No lo permite: la fábrica es parte de la clave primaria. |
| 2.2.4 | Fábrica inactiva | — | Rechaza crear un cliente en una fábrica inactiva (409). |
| 2.2.5 | Largos máximos | No valida largos. | 50 / 50 / 50 / 120. |

### 2.3 Endpoints

| Operación | Frontend | Backend | Diferencia |
|---|---|---|---|
| Listar | `GET /customers`, espera array | `GET /customers`, devuelve objeto paginado. Acepta `factoryId`, `nameContains`, `active`. | Forma de la respuesta. El frontend no usa los filtros. |
| Ver uno | `GET /factories/{factoryId}/customers/{id}` | Igual | Nombres de campos de la respuesta. |
| Crear | `POST /factories/{factoryId}/customers` | Igual | El cuerpo falla con 400 (`firstName`, `hasWhatsapp`, `observation`, `factoryId`). |
| Editar | `PATCH /factories/{factoryId}/customers/{id}` | Igual | Mismo 400. |
| Baja | `PATCH .../deactivate`, espera el cliente (200) | `PATCH .../deactivate`, responde 204 sin cuerpo | Hoy no rompe: el frontend solo invalida la caché. |
| Reactivar | No existe la pantalla | `PATCH .../activate` | Funcionalidad sin interfaz. |

### 2.4 Efecto visible si se apagan los mocks

- El listado aparece vacío: la respuesta trae `active`, y el frontend filtra por `isActive`.
- Crear y editar devuelven 400.

---

## 3. Fábricas

### 3.1 Campos

| Campo | Frontend | Backend | Base (`factory_customer`) |
|---|---|---|---|
| Nombre | `name`, obligatorio | `name`, obligatorio, máx. 100 | `name`, NOT NULL, 100 |
| Código | `code`, obligatorio, 3 a 4 caracteres, único | no existe | no existe |
| CUIT | `cuit`, **opcional**, 11 dígitos | `cuit`, **obligatorio** | `cuit`, nullable, 50, **sin índice único** |
| Dirección | `address`, **opcional** | `address`, **obligatoria**, máx. 255 | `address`, nullable, 255 |
| Pago | `payMethod`, **obligatorio** | `paymentDescription`, **opcional**, máx. 255 | `pay_method`, nullable, 255 |
| Rubro | `industryId`, opcional, string | `categoryId`, **obligatorio**, número | `categorie_id`, nullable |
| Activo | `isActive` | `active` | `is_active` |
| Id | `id`, string | `id`, número | `id`, entero |
| Fechas | no las usa | no las devuelve | `created_at`, `updated_at` |

### 3.2 Reglas de negocio

| # | Regla | Frontend | Backend |
|---|---|---|---|
| 3.2.1 | Dígito verificador del CUIT | Si el cálculo da 10, usa 9 y lo acepta. | Si el cálculo da 10, lo rechaza ("not assignable"). |
| 3.2.2 | CUIT único | Los mocks validan CUIT **y** código únicos. | Valida solo CUIT único, en el código. La base no lo garantiza. |
| 3.2.3 | CUIT modificable | Permite editarlo. | Permite editarlo. La spec `docs/openapi/paths/factories@{id}.yaml` dice que es inmutable. |
| 3.2.4 | Rubro activo | — | Rechaza crear o editar con un rubro inexistente o inactivo (400). |
| 3.2.5 | Baja con clientes activos | No maneja ese caso. | Rechaza la baja con 409. |

### 3.3 Endpoints

| Operación | Frontend | Backend | Diferencia |
|---|---|---|---|
| Listar | `GET /factories`, espera array | `GET /factories`, devuelve objeto paginado | Forma de la respuesta. |
| Ver una | No lo llama: busca la fábrica dentro del listado | `GET /factories/{id}` | Con paginación, el frontend puede no encontrarla. |
| Crear | `POST /factories` | Igual | El cuerpo falla con 400 (`code`, `payMethod`, `industryId`; falta `categoryId`). |
| Editar | `PATCH /factories/{id}` | Igual | Mismo 400. |
| Baja | No existe la pantalla | `PATCH /factories/{id}/deactivate` | Funcionalidad sin interfaz. |
| Reactivar | No existe la pantalla | `PATCH /factories/{id}/activate` | Funcionalidad sin interfaz. |

---

## 4. Rubros

| Tema | Frontend | Backend | Base (`category`) |
|---|---|---|---|
| Ruta | `/industries` | `/categories` | — |
| Nombre del concepto | `Industry`, `industryId` | `Category`, `categoryId` | `category`, `categorie_id` |
| Activo | `isActive` | `active` | `is_active` |
| Id | string | número | entero |
| Listar | Espera array con todos | Devuelve array paginado (20 por defecto), solo activos | — |
| Crear | Espera el rubro directo | Devuelve `{ message, category }` | — |
| Nombre | Sin mínimo | Mínimo 3, máximo 80 | `name`, nullable, 120 |
| Rubro "Particular" | Lo da por existente | No hay semilla | No hay semilla |
| Persistencia | — | Repositorio **en memoria** | La tabla existe, pero no se usa |

---

## 5. Backend contra base de datos

| # | Tema | Situación | Riesgo |
|---|---|---|---|
| 5.1 | Rubros en memoria | `CategoriesModule` usa `CategoriesInMemoryRepository`. Fábricas y clientes ya usan Prisma. | Crear una fábrica valida el rubro en memoria e inserta en Postgres. La FK a `category` rechaza el insert. |
| 5.2 | Columnas nullable | `cuit`, `address`, `pay_method`, `categorie_id`, `last_name`, `phone`, `mail` aceptan null. El dominio exige varias. | Leer una fila con null rompe `reconstruct()` y, con eso, el listado. |
| 5.3 | CUIT sin índice único | `supplier.cuit` tiene `@unique`; `factory_customer.cuit` no. | Dos altas simultáneas pueden duplicar el CUIT. |
| 5.4 | Mail sin índice único | No hay índice `(factory_id, mail)`. | Dos altas simultáneas pueden duplicar el mail en una fábrica. |
| 5.5 | Id del cliente | Prisma exige enviar `id`. El repositorio calcula `max + 1` por fábrica en una transacción y reintenta si choca. El trigger `fn_gen_id_manager` queda sin uso desde la API. | Funciona, pero duplica la lógica del trigger. |
| 5.6 | `updated_at` sin default | Prisma lo completa solo. | Un insert manual o un script de seed tiene que enviarlo. |
| 5.7 | Columnas que faltan | `code` en `factory_customer`; `has_whatsapp` y `observation` en `manager_customer`. | El frontend ya las usa. |
| 5.8 | Largo del mail | Backend limita a 120; la columna admite 255. | Sin riesgo. Conviene unificar. |
| 5.9 | Sin pruebas reales | Los repositorios de Prisma nunca corrieron contra Postgres. Los tests usan los repositorios en memoria. | Errores de mapeo o de consultas sin detectar. |
| 5.10 | CUIT fuera de `shared` | `factory` importa `Cuit` desde `suppliers/domain/cuit`. | Acoplamiento entre módulos. Hay que cambiar la ruta cuando se mueva a `shared/domain`. |

---

## 6. Contratos documentados

Hay tres definiciones de la API que no coinciden entre sí:

| | Implementación actual | `docs/openapi/customers.yaml` (propuesta del frontend) | `docs/openapi/paths/*.yaml` (spec del backend) |
|---|---|---|---|
| Clientes | `/factories/{id}/customers` | `/factories/{id}/customers` | `/factories/{id}/managers` |
| Campos de cliente | `name`, `lastName`, `phone`, `mail` | `firstName`, `lastName`, `phone`, `hasWhatsapp`, `mail`, `observation` | `name`, `email`, `phone`, `role` |
| Campos de fábrica | `name`, `cuit`, `paymentDescription`, `categoryId` | `name`, `code`, `cuit`, `payMethod`, `industryId` | `legalName`, `taxId`, `categoryId` |
| Formato del CUIT | 11 dígitos | 11 dígitos | `XX-XXXXXXXX-X` |
| Baja | `PATCH .../deactivate`, 204 | `PATCH .../deactivate`, 200 con cuerpo | `DELETE`, 204 |
| Listado | Objeto paginado | Array | Array |

---

## 7. Decisiones pendientes

Hay que tomarlas antes de tocar código, porque definen los cambios de las tres capas.

**Con el frontend:**

1. Nombres del JSON: `firstName` o `name`; `payMethod` o `paymentDescription`; `industryId` o `categoryId`; `isActive` o `active`.
2. Ruta de rubros: `/industries` o `/categories`.
3. Forma del listado: array o `{ items, total, page, limit }`. Si es paginado, quién busca y filtra.
4. Tipo de los ids: número o string.
5. Respuesta de la baja: 200 con el registro o 204.
6. Si `factoryId` viaja en el cuerpo o solo en la URL.
7. Si un cliente puede cambiar de fábrica.
8. Si entran en este alcance `code`, `hasWhatsapp` y `observation`.
9. Regla de contacto: "al menos uno entre teléfono y mail" o los dos obligatorios.
10. Obligatoriedad de `cuit`, `address`, `payMethod` y rubro en fábricas.
11. Qué hacer con un CUIT cuyo dígito verificador calculado es 10.
12. Si el CUIT se puede modificar.
13. Pantallas de baja y reactivación de fábricas, y reactivación de clientes.
14. Agregar `rewrite: (path) => path.replace(/^\/api/, '')` al proxy `/api` de `frontend/vite.config.ts`, para que Vite quite el prefijo igual que nginx. No hay que agregar `setGlobalPrefix('api')` en el backend: rompería las rutas que hoy pasan por nginx. El comentario de ese archivo, que anuncia el prefijo en el backend, quedó desactualizado.

**Con el equipo de backend:**

15. Mantener o no `forbidNonWhitelisted: true` en la validación global.
16. Cuál de los tres contratos de `docs/openapi` queda como oficial, y actualizar los otros.

**Con quien mantiene la base de datos:**

17. Columnas nuevas: `code`, `has_whatsapp`, `observation`.
18. Nulabilidad de `cuit`, `address`, `pay_method`, `categorie_id`, `last_name`, `phone`, `mail`.
19. Índices únicos: `factory_customer.cuit`, `factory_customer.code` y `(factory_id, mail)`.
20. Default para `manager_customer.id`, o mantener el cálculo en el repositorio.
21. Semilla del rubro "Particular".

---

## 8. Orden sugerido

1. Acordar el contrato (sección 7).
2. Corregir el proxy de Vite (decisión 14), o probar siempre a través de nginx.
3. Migración de base y repositorio Prisma de rubros.
4. Ajustar DTOs, respuestas y dominio del backend al contrato.
5. Adaptar tipos y llamadas del frontend.
6. Probar de punta a punta con `VITE_USE_MOCKS=false`, el backend y Postgres levantados.
