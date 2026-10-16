# Rubros: diferencias entre el contrato y el backend

> **Recordatorio.** Donde el contrato (`docs/openapi`) y el backend no coinciden, el frontend de Rubros se ajusta a lo que **hace el backend**, para que la pantalla funcione y se pueda mostrar.

Relevado el 10 de octubre de 2026 contra `develop`. Actualizado el 15 de octubre (cambios del backend de la rama `cambios`) y el 16 de octubre: el backend pasó a `backend/src/subsystems/customers`, el alta reactiva un rubro dado de baja y el contrato se alineó con el backend.

Archivos del contrato:

- `docs/openapi/paths/categories.yaml`
- `docs/openapi/paths/categories@{id}.yaml`
- `docs/openapi/paths/categories@{id}@restore.yaml`
- `docs/openapi/components/schemas/Category.yaml`

## Diferencias que quedan

| # | Tema | Contrato | Backend (lo que sigue el frontend) |
|---|---|---|---|
| 1 | `code` en los errores | Los `400` y `409` traen `code` (`VALIDATION_ERROR`, `CATEGORY_NAME_TAKEN`, `CATEGORY_INACTIVE`, `CATEGORY_HAS_ACTIVE_FACTORIES`). | Todavía no manda `code`: lo suma el Sprint 2 (contrato del Sprint 2, D-41 y D-51). Hasta entonces el frontend decide por el código HTTP y muestra `message`, que ya viene en español. |
| 2 | `details` en el `409` de nombre repetido | Trae `details` con el campo `name`. | Todavía no trae `details`, solo `message` (también lo pide el Sprint 2, D-41). |

## Ya resueltas (el contrato se alineó con el backend)

- Baja lógica con `active`, y `POST /categories/{id}/restore` (200).
- Mínimo de 3 caracteres en el nombre.
- Solo las fábricas **activas** bloquean la baja; el `409` suma `factories`.
- `409` por nombre repetido (activo o dado de baja) en `PATCH`, y "Debe reactivar el rubro antes de modificarlo" sobre un rubro dado de baja.
- Listado paginado `{ items, total, page, limit }`, con los filtros `name` y `active`. Tope de `limit`: 100.
- **Alta con el nombre de un rubro dado de baja:** el backend lo reactiva y responde `201` con ese rubro, como un alta (antes era un `409` con su `categoryId`). La pantalla muestra "Rubro "X" creado.". La rama de `createCategory` que leía el `409` con `categoryId` y llamaba a `/restore` quedó en el código, pero ya no se usa.

## Lo que el backend tiene y el frontend no usa

- `GET /categories?active=false` y `GET /categories?name=...`: el listado se pide entero (`GET /categories?page=1&limit=100`) y la búsqueda se hace en el navegador; los dados de baja no se muestran.

## Para cerrar el tema

1. El equipo decide si el backend de Rubros empieza a mandar `code` y `details`, o si el contrato los saca para el Sprint 1.
2. El frontend revisa `frontend/src/features/catalogs/categories`, en especial `api/categories.api.ts` y `api/categories.mocks.ts`. Los mocks copian el comportamiento del backend, no el del contrato.
3. Borrar este archivo.
