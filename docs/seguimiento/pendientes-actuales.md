# Pendientes actuales

Relevamiento del 15 de octubre de 2026 sobre `develop`. Reemplaza en la práctica a `docs/pendientes-sprint-1.md`, que quedó desactualizado.

## Resumen

| # | Punto | Prioridad | Estado |
|---|---|---|---|
| A-01 | Código de fábrica (CU-58) | P1 | Pendiente |
| A-02 | Tests de integración y API sin verificar | P1 | Pendiente |
| A-03 | Borrar ramas remotas ya mergeadas u obsoletas | P2 | Pendiente |
| H-01 | Contrato y documentación desactualizados | P1 | Pendiente |
| H-02 | Backend: detalles menores | P2 | Pendiente |
| H-03 | Frontend: deuda técnica | P2 | Pendiente |
| H-04 | Infraestructura y proceso | P2 | Pendiente |
| H-05 | Sin verificar | P2 | Pendiente |
| R-01 | Rubros: contrato OpenAPI y `name` NOT NULL | P2 | Pendiente |
| D-02 | PRs revisados o merge directo | P1 | Decisión pendiente |
| D-03 | Cuándo se promueve `develop` a `main` | P2 | Decisión pendiente |

---

## A-01 · P1 · Código de fábrica (CU-58)

La historia CU-58 (Registrar fábrica, DTC-92) pide un código de fábrica obligatorio y único. Hoy no existe en ningún lado: `schema.prisma` lo deja como `PENDIENTE: falta code (codigo de fabrica, unico, obligatorio, 2-4 caracteres)`.

**Antes de empezar, hay que decidir:**

1. **Largo y formato.** El comentario del schema dice 2 a 4 caracteres. ¿Solo letras, letras y números? ¿Se normaliza a mayúsculas?
2. **Alcance de la unicidad.** Las otras reglas de fábrica (CUIT y nombre) son únicas solo entre fábricas activas. ¿El código también, o es único para siempre?
3. **Si se puede modificar.** El CUIT es inmutable; hay que definir si el código también lo es.

**Qué hay que hacer:**

| Capa | Cambio |
|---|---|
| Base de datos | Agregar `code VARCHAR(4)` a `factory_customer`. Como es obligatorio y ya hay filas, se hace en tres pasos dentro de la migración: columna nullable, completar las filas existentes, y recién después `NOT NULL`. Índice único (parcial entre activas, según la decisión 2), a mano en el SQL como los de CUIT y nombre |
| Dominio | Validar el código al crear (y al modificar, según la decisión 3) en `Factory`; error de dominio de validación |
| Aplicación y HTTP | Agregar `code` en `CreateFactoryDto` y en `FactoryResponseDto`; en `UpdateFactoryDto` solo si es modificable. Chequeo previo de duplicado en `CreateFactory` y 409 |
| Infraestructura | Mapear el `P2002` del índice nuevo a 409 en `FactoryPrismaRepository`, igual que CUIT y nombre |
| Filtro de errores | Que `FactoryExceptionFilter` deduzca el campo `code` en los mensajes de validación |
| Contrato | `Factory.yaml`, `FactoryCreate.yaml` (y `FactoryUpdate.yaml` si aplica), más el 409 en `factories.yaml` |
| Frontend | Tipo `Factory`, esquema y formulario de fábrica, tabla y detalle; mocks de fábricas |
| Seed y tests | Agregar el código a las fábricas de `seed.ts`; tests de integración: código válido, código duplicado (409), código inválido (400) |

**Riesgo.** Es un cambio que cruza todas las capas y rompe a cualquier cliente que cree fábricas sin código. Conviene que backend y frontend salgan juntos, y revisar antes de migrar que no haya filas con datos que impidan el `NOT NULL`.

## A-02 · P1 · Tests de integración y API sin verificar

Necesitan Docker y no se pudieron correr. Hay que ejecutar `make test-int` y `make test-api` y revisar:

- Los tests de proveedores que comparen el cuerpo completo de un error con `toEqual` fallarán, porque ahora el error trae `path` y `timestamp`. Hay que pasarlos a `toMatchObject`.
- Que ningún test dependa del mensaje `page and limit must be positive integers`, que ahora es `page must be at least 1 and limit must be between 1 and 1000`.
- Validar el contrato con `npm run validate` en `tooling/openapi` (cambiaron `LimitParam.yaml` y `SupplierList.yaml`).

## A-03 · P2 · Ramas remotas para borrar

Ya mergeadas a `develop` (se pueden borrar sin perder nada):

```
feature/DTC-53-client-catalog-frontend
feature/DTC-53-integrate-client-catalog
feature/TC-25-suppliers
feature/TC-25-suppliers-contract
feature/TC-27-abmc-rubro
feature/TC-27-category
feature/backend-customers-and-factories
feature/basic-config-frontend
feature/first-schema-prisma
feature/frontend-foundations
feature/health
feature/test-integrations
fix/TC-25-quote-suppliers
fix/cuit-ejemplo-y-mensajes
fix/docker-dev-frontend
fix/frontend-catalogs-polish
fix/frontend-real-backend
fix/frontend-sprint-1-pendientes
```

Sin mergear pero obsoletas:

```
feat/suppliers-prisma-adapter            # su único cambio (Cuit a shared/domain) ya está en develop; además trae un PDF ajeno
feature/abmc-customers-and-factories     # vieja (5/9), choca con develop
```

No borrar todavía:

```
feature/tests-clients                    # tests de fábricas y encargados, marcados PENDING REVIEW; hay que actualizarlos
```

Comando para borrar una rama remota: `git push origin --delete <nombre>`.

---

## Heredados de `pendientes-sprint-1.md`

Lo que seguía pendiente en el documento viejo, revisado contra el código del 15 de octubre de 2026. Los puntos que ya estaban resueltos no se incluyen.

### H-01 · P1 · Contrato y documentación desactualizados

- ~~**OpenAPI de fábricas y encargados.**~~ Resuelto el 16/10/2026: `docs/openapi` describe el Sprint 1 tal como está implementado (encargados en `/factories/{factoryId}/customers` y `/customers`, campos reales de fábrica y encargado, bajas con `PATCH .../deactivate`, listados paginados, filtros y los 409) y suma el Sprint 2. Cuando se haga A-01, agregar `code` a `Factory.yaml`, `FactoryCreate.yaml` y el 409 de `factories.yaml`.
- ~~**`docs/openapi/customers.yaml`**~~ Resuelto: se borró; su contenido quedó integrado al contrato oficial.
- **Referencias rotas a `docs/decisiones-clientes-fabricas.md`**, que ya no existe: `backend/prisma/schema.prisma:100`, `frontend/src/features/catalogs/customers/api/customers.api.ts:15` y `frontend/src/features/catalogs/customers/types/factory.ts:8`. Las reglas de la sección 5.3 (bajas, unicidad, CUIT inmutable, nombre único) y las consultas para detectar duplicados antes de migrar solo están en el historial de git (commit anterior a `06c16`). Hay que restaurar el documento o mover esas reglas a otro lado, y actualizar los tres comentarios.
- **`backend/prisma/schema.prisma:1`** dice que el schema se basa en `docs/database/setup_support_sprint1.sql`, que se borró en `d337154` (y la carpeta ahora es `docs/uso-ORM-DB/`). Hay que actualizar o sacar el comentario.
- **`SETUP.md` de la raíz** está vacío (0 bytes); el real es `docs/SETUP.md`.
- **`README.md` de la raíz** tiene un comentario de plantilla sin sacar (líneas 3 a 6).

### H-02 · P2 · Backend: detalles menores

- **`category.name` admite `NULL`** en la base (`String?` en `schema.prisma`), aunque el dominio lo exige.
- **`ValidationPipe` por controlador.** Fábricas y encargados declaran el suyo además del global, para armar `details` con `exceptionFactory`. Funciona, pero hay dos configuraciones de validación distintas.
- **Faltan tests de integración de las reglas nuevas de fábricas:** crear con el CUIT o el nombre de una fábrica dada de baja anda; con los de una activa da 409; `PATCH` no cambia el CUIT. Hoy `factories.int.spec.ts` cubre solo parte.
- **`Phone` exige 8 a 15 dígitos.** Si hay teléfonos más cortos en la base o en el frontend, el alta y la edición de encargados los van a rechazar.
- **Migración con índices parciales.** Prisma no los expresa en `schema.prisma`: hay que aplicarla con `prisma migrate deploy`, y `prisma migrate dev` puede proponer borrarlos.
- ~~**Deuda del tope de `limit`.**~~ Resuelto el 16/10/2026: el tope del backend es 100 y el frontend trae fábricas y encargados completos pidiendo páginas de 100 hasta agotar `total` (`fetchAllPages`). Queda Rubros, que pide una sola página de 100: con más de 100 rubros activos, el resto no se vería.

### H-03 · P2 · Frontend: deuda técnica

- **Faltan tests unitarios** (F-06). Hay tests E2E con Playwright en `frontend/e2e/`, contra los mocks de MSW (`npm run test:e2e:sprint1`), pero ningún test unitario. Lo más barato de cubrir son las validaciones (`shared/lib/cuit.ts`, teléfono, `formatPhone` y los esquemas de los formularios). Ninguno corre todavía en la CI.
- **El bundle pesa 554 kB sin dividir** (F-09). No hay `lazy()` ni `manualChunks`; Vite lo advierte al compilar.
- **Los tipos de la API están escritos a mano** en cada feature. La carpeta `src/api-contract`, pensada para generarlos del contrato, no existe.
- ~~**Límites silenciosos** (F-08)~~. Resuelto: ver H-02.
- **Mensajes de error crudos.** Algunas pantallas muestran el mensaje del backend tal cual al fallar la carga de un listado (por ejemplo `CategoriesPage.tsx:133`).

### H-04 · P2 · Infraestructura y proceso

- **La CI corre en `push` a `develop` y en pull request a `main`, pero no en pull request a `develop`.** Un PR a `develop` no corre lint ni tests antes del merge.
- **`main` está 289 commits atrás de `develop`** (ver D-03).
- Los puntos de WebSocket de nginx dev y `docker.sock` los toman otras personas (ver "En manos de otras personas").

### H-05 · P2 · Sin verificar

Nunca se comprobó:

- **Producción:** no se levantó `make prod-up` ni se probó la imagen de producción.
- **Alcance del sprint:** no se contrastó contra el tablero ni contra el ERS qué historias entran.
- **Navegadores:** se probó en uno solo (Chromium).
- **Accesibilidad:** sin revisión con lector de pantalla ni de contraste.
- **Rubros en celular:** no hay desborde horizontal a 375 px, pero no se revisó visualmente.
- **Concurrencia:** los casos de altas simultáneas salen de leer el código, no de una prueba.

---

## Decisiones pendientes

### R-01 · Rubros: contrato OpenAPI y `name` NOT NULL

El backend de rubros ya está hecho (código y tests). Queda pendiente lo que no se tocó:

- ~~**Contrato OpenAPI.**~~ Resuelto el 16/10/2026: `GET /categories` con `{ items, total, page, limit }` y el filtro `active`, y `POST /categories/{id}/restore`.
- **`category.name` NOT NULL.** La columna admite `NULL` aunque el dominio exige nombre. Se resuelve en `develop` (schema y migración); mientras tanto `CategoriesPrismaRepository.toDomain` usa `row.name!`.
- ~~**Frontend (otra persona).**~~ Resuelto: `categories.api.ts` lee `data.items`, restaura con `POST /categories/{id}/restore` y `listCategories` no recibe argumentos.

### D-02 · PRs revisados o merge directo

`docs/CONTRIBUTING.MD` pide un PR revisado por otra persona. En la práctica los merges a `develop` son directos. Hay que decidir si se respeta la regla (y entonces correr la CI en PR a `develop`, ver H-04) o se cambia la regla.

### D-03 · Cuándo se promueve `develop` a `main`

`main` está 289 commits atrás. Hay que definir en qué momento del sprint se promueve y quién lo hace.

---

## Postergado por decisión del equipo

- **Búsqueda sin acentos en encargados (B-09):** queda como está, por regla de negocio.

## En manos de otras personas

- ~~Restaurar rubros en el frontend (F-04).~~ Resuelto: el frontend tiene `restoreCategory`, y desde el 16/10/2026 el backend reactiva el rubro dado de baja al darlo de alta con el mismo nombre.
- Infraestructura: WebSocket del nginx de desarrollo, `docker.sock` en dev y ramas de CI.
