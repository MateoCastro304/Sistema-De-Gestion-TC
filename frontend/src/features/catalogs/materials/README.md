# Materiales: registrar y consultar (DTC-116 CU-37 · DTC-118 CU-39)

El catálogo de materiales que se eligen al cotizar. Un material es **nombre más calidad**: "Acero 1010" y "Acero 1045" son dos entradas distintas. No guarda precio, proveedor ni presentación. Para el Administrativo Técnico (`AT`) y el Encargado de Cotización (`EC`). La fuente de verdad es el contrato del Sprint 2 ([`API_CONTRACT_SPRINT_2.md`](../../../../../docs/api-contract/API_CONTRACT_SPRINT_2.md), §3.6). Modificar (CU-38), dar de baja (CU-40) y el selector de la cotización (CU-14) quedan para otro sprint.

Ruta: `/catalogos/materiales`. No hay detalle ni página de alta: "Nuevo material" es una ventana del listado.

## Consultar materiales (DTC-118, CU-39)

| Paso | Qué pasa | Dónde |
| --- | --- | --- |
| Listado | `GET /materials` con `page` y `limit=20`. Columnas: Material y Calidad, ordenado por material y por calidad con orden natural ("SAE 62" antes que "SAE 65"). Sin detalle ni acciones por fila | `pages/MaterialsPage.tsx` |
| Encabezado | "13 materiales registrados": llamada aparte con `limit=1` sin filtros | `useMaterialsCount` |
| Filtro | "Todos los materiales" y los nombres de `GET /materials/names` (sin paginar, D-38). Manda `name`, coincidencia exacta | `useMaterialNames` |
| Búsqueda | "Buscar por calidad" manda `quality` ("contiene"), con 300 ms de espera al tipear | `MaterialsPage.tsx` |
| Sin resultados | "No se encontraron materiales con ese criterio", "Revisá la calidad o cambiá el material elegido." y "+ Nuevo material" | ídem |
| Sin permiso | Otro rol ve "Acceso denegado" | `app/router/guards.tsx` |

## Registrar material (DTC-116, CU-37)

| Paso | Qué pasa | Dónde |
| --- | --- | --- |
| Entrada | "+ Nuevo material", en la barra o en "sin resultados", abre la ventana "Nuevo material" | `MaterialsPage.tsx` |
| Material | Input con `<datalist>`: sugiere los nombres existentes y deja escribir uno nuevo ("Elegí uno de la lista o escribí uno nuevo."). Las sugerencias comparten la caché del filtro | `components/MaterialFormModal.tsx` |
| Validación | Material y Calidad obligatorios, hasta 60 caracteres, sin espacios en los extremos | `schemas/material.schema.ts` |
| Alta | `POST /materials` → `201`, aviso "Material registrado correctamente" y se cierra. Invalida `materialKeys.all`: se refrescan listado, encabezado y filtro | `api/materials.queries.ts` |
| Grafía | "acero" se guarda como "Acero" si ya existe (D-37): lo resuelve la API; la tabla muestra lo guardado | — |
| Repetido | `409 MATERIAL_ALREADY_EXISTS` en el campo "Calidad", según `details` | `MaterialFormModal.tsx` |

## Tests (`e2e/catalogs/materials/materials.e2e.spec.ts`)

| Historia | Escenarios cubiertos | Sin test |
| --- | --- | --- |
| DTC-118 | 1 a 5 | La paginación (la semilla tiene 13) y el escenario 6 (parámetros inválidos, sólo de la API) |
| DTC-116 | 1 a 6, y el 7 por el acceso denegado de la página | Los 60 caracteres (los valida el schema) |

## Qué hace cada archivo

| Archivo | Para qué sirve |
| --- | --- |
| `types/material.ts` | `Material`, `MaterialCreate` y `MaterialListParams` |
| `api/materials.api.ts` | `listMaterials`, `countMaterials`, `listMaterialNames` y `createMaterial` |
| `api/materials.keys.ts` | Claves de React Query. `count()` cuelga de `lists()`; `names()` cuelga de `all` porque no cambia al filtrar |
| `api/materials.queries.ts` | `useMaterials`, `useMaterialsCount`, `useMaterialNames` y `useCreateMaterial` |
| `api/materials.mocks.ts` | Mocks de MSW con la semilla del prototipo (13 materiales). No tiene `.db.ts` porque ningún otro mock lo lee |
| `schemas/material.schema.ts` | Validación de la ventana con zod |
| `components/MaterialFormModal.tsx` | La ventana "Nuevo material" |
| `pages/MaterialsPage.tsx` | El listado |
| `index.ts` | `MaterialsPage`, lo único que se usa desde afuera |

Fuera de la feature: la tarjeta en el panel Gestión (`catalogs/panels/panels.ts`) y la ruta en `app/router/index.tsx`.
