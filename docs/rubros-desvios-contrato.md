# Rubros: diferencias entre el contrato y el backend

> **Recordatorio.** El frontend de Rubros **no cumple al pie de la letra** el contrato (`docs/openapi`). Donde el contrato y el backend no coinciden, el frontend se ajusta a lo que **hace el backend**, para que la pantalla funcione y se pueda mostrar.
>
> El contrato no se modificó. Cuando el equipo defina cuál es la versión correcta, hay que alinear el contrato, el backend o el frontend, según corresponda.

Relevado el 10 de octubre de 2026 contra `develop`.

Archivos del contrato:

- `docs/openapi/paths/categories.yaml`
- `docs/openapi/paths/categories@{id}.yaml`
- `docs/openapi/components/schemas/Category.yaml`

## Diferencias que afectan al frontend

| # | Tema | Contrato | Backend (lo que sigue el frontend) |
|---|---|---|---|
| 1 | `DELETE /categories/{id}` | "Deletes a category": borra el rubro. | **Baja lógica**: el rubro queda en la base con `active: false` y deja de listarse. El frontend lo llama "Dar de baja" y, después de la baja, no vuelve a mostrar el rubro ni deja editarlo o reactivarlo. |
| 2 | Campo `active` | No existe en `Category`. | El backend lo devuelve en cada rubro. El tipo del frontend lo declara como opcional. |
| 3 | Largo mínimo del nombre | `minLength: 1` | 3 caracteres. Con menos, el backend responde 400 y el formulario lo valida antes de enviar. |
| 4 | 409 al dar de baja | Se rechaza si **cualquier** fábrica usa el rubro. | Solo cuentan las fábricas **activas**. Un rubro que usa solo una fábrica dada de baja se puede dar de baja. |
| 5 | Cuerpo del 409 de baja | Formato estándar `Error` (`statusCode`, `error`, `message`, `path`, `timestamp`). | Solo `{ message, factories }`. El frontend usa `message`. |
| 6 | Nombre repetido en `POST` y `PATCH` | No documenta ningún 409. | Responde 409 con "Ya existe un rubro con ese nombre" o "El rubro existe pero está dado de baja". `PATCH` sobre un rubro inactivo responde "Debe reactivar el rubro antes de modificarlo". El frontend muestra el mensaje. |

## Lo que el backend tiene y el contrato no (el frontend no lo usa)

- `PATCH /categories/{id}/restore`: reactiva un rubro.
- `GET /categories?name=...`: filtra por nombre.

## Para cerrar el tema

1. El equipo decide cuál manda en cada punto: el contrato o el backend.
2. Quien mantiene el contrato lo actualiza, o backend ajusta la implementación.
3. El frontend revisa `frontend/src/features/catalogs/categories`, en especial `api/categories.api.ts` y `api/categories.mocks.ts`. Los mocks copian el comportamiento del backend, no el del contrato.
4. Borrar este archivo.
