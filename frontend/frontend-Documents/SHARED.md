# Shared del frontend

Este documento describe todo lo que hay en `frontend/src/shared/`: los componentes de interfaz, el cliente HTTP, `ApiError`, las utilidades y los helpers de los mocks. Antes de escribir un componente o una función nueva, fijate acá si ya existe.

`shared/` no tiene lógica de negocio y no conoce ni `app/` ni `features/` (ver la regla 2 en [ESTRUCTURA.md](ESTRUCTURA.md)). Todo lo que hay acá sirve igual para Proveedores, Cotizaciones o cualquier pantalla futura. Lo que sí es de negocio y comparten varias features (los roles y la matriz de permisos) está en `domain/`, no acá.

```
shared/
├── api/                # http, ApiError, Page<T>, queryClient
├── components/
│   ├── ui/             # Button, Input, Select, Table, Modal, PageHero... (todo por index.ts)
│   ├── feedback/       # EmptyState
│   └── forms/          # (vacía por ahora)
├── hooks/              # usePagedList
├── lib/                # cn, cuit, formatPhone, heroPhoto, normalizeText, rowTone
├── mocks/              # Helpers de los mocks de MSW (solo desarrollo y tests)
└── types/              # (vacía por ahora)
```

---

## 1. Si necesitás X, usá Y

| Si necesitás...                                              | Usá                                   | Importar desde                          |
| ------------------------------------------------------------ | ------------------------------------- | --------------------------------------- |
| Llamar al backend                                            | `http`                                | `@/shared/api/http`                     |
| Saber qué tipo de error devolvió la API                      | `isApiError()` + `error.isConflict`, `isNotFound`, etc. | `@/shared/api/ApiError` |
| Tipar una respuesta paginada `{ items, total, page, limit }` | `Page<T>`                             | `@/shared/api/pagination`               |
| El tamaño de página por defecto (20)                         | `DEFAULT_PAGE_SIZE`                   | `@/shared/api/pagination`               |
| Paginar en el navegador una lista que ya tenés entera        | `usePagedList()`                      | `@/shared/hooks/usePagedList`           |
| Los controles de página debajo de una tabla                  | `<Pagination />`                      | `@/shared/components/ui`                |
| Un listado                                                   | `<Table />` (`variant="cards"` en el rediseño) | `@/shared/components/ui`       |
| Qué mostrar cuando un listado está vacío, sin resultados o con error | `<EmptyState />`              | `@/shared/components/feedback/EmptyState` |
| Mostrar un dato o un guion si falta                          | `<ValueOrDash />`                     | `@/shared/components/ui`                |
| Mostrar un teléfono legible (`+54 9 351 444-5678`)           | `formatPhone()`                       | `@/shared/lib/formatPhone`              |
| Un botón                                                     | `<Button />`                          | `@/shared/components/ui`                |
| Un botón de eliminar                                         | `<TrashButton />`                     | `@/shared/components/ui`                |
| El ícono del tacho de basura                                 | `<IconTrash />`                       | `@/shared/components/ui`                |
| Un campo de texto con label, error y ayuda                   | `<Input />`                           | `@/shared/components/ui`                |
| Un desplegable                                               | `<Select />` (no `<select>` nativo)   | `@/shared/components/ui`                |
| Un casillero de selección                                    | `<CheckBox />`                        | `@/shared/components/ui`                |
| Un buscador con lupa                                         | `<SearchField />`                     | `@/shared/components/ui`                |
| Buscar sin importar mayúsculas ni acentos                    | `normalizeText()`                     | `@/shared/lib/normalizeText`            |
| Un diálogo o una confirmación de borrado                     | `<Modal />` (`tone="danger"` para borrar) | `@/shared/components/ui`            |
| La cabecera con foto de un listado o de un panel             | `<PageHero />`                        | `@/shared/components/ui`                |
| El enlace "← Clientes" de vuelta al panel                    | `<PageHero back={…} />`               | `@/shared/components/ui`                |
| Poner una foto de fondo en una cabecera armada a mano (alta o detalle) | `heroPhoto()`               | `@/shared/lib/heroPhoto`                |
| Una etiqueta de categoría o estado                           | `<Badge />`                           | `@/shared/components/ui`                |
| El cuadrado (o círculo) con iniciales o ícono de un registro | `<Avatar />`                          | `@/shared/components/ui`                |
| El ícono de una entidad (encargado, fábrica, proveedor...)   | `<EntityIcon />`                      | `@/shared/components/ui`                |
| El color de una fila según si está activa o dada de baja     | `toneByStatus()`                      | `@/shared/lib/rowTone`                  |
| Validar un CUIT en un formulario                             | `cuitError()` / `isValidCuit()`       | `@/shared/lib/cuit`                     |
| Mostrar un CUIT como `XX-XXXXXXXX-X`                         | `formatCuit()`                        | `@/shared/lib/cuit`                     |
| Armar clases CSS condicionales                               | `cn()`                                | `@/shared/lib/cn`                       |
| Simular un endpoint en un mock de MSW                        | `apiError()`, `authorize()`, `paginate()`... | `@/shared/mocks/...` (ver sección 7) |
| Avisarle al usuario que algo salió bien o mal                | `useToast()` *                        | `@/app/providers/ToastContext`          |
| Mostrar el nombre del registro abierto en la miga de pan     | `useCrumbTitle()` *                   | `@/app/providers/BreadcrumbContext`     |
| Saber qué roles hay o si un usuario puede usar un módulo     | `ROLES`, `ROL_LABEL`, `canAccess()` † | `@/domain/roles`                        |

\* `useToast` y `useCrumbTitle` no están en `shared/` sino en `app/providers/`. Son la única parte de `app/` que una feature puede importar.

† Los roles no están en `shared/` porque son de negocio: viven en `domain/roles.ts` (ver [ESTRUCTURA.md](ESTRUCTURA.md#11-roles-y-permisos-domainrolests)).

---

## 2. Cliente HTTP (`shared/api/http.ts`)

`http` es una instancia de axios ya configurada. **Ninguna feature importa `axios` directamente**: todas las llamadas pasan por acá.

| Configuración  | Valor                                                    |
| -------------- | -------------------------------------------------------- |
| `baseURL`      | `VITE_API_URL`, o `/api` si no está definida            |
| `timeout`      | 15 segundos                                              |
| Headers        | `Content-Type: application/json`                         |
| Autenticación  | Agrega `Authorization: Bearer <token>` cuando hay token |

Tiene dos interceptores:

- **De request:** agrega el token si existe. Hoy `getToken()` devuelve siempre `null`: el token llega con el login del Sprint 2.
- **De response:** convierte **cualquier** error en un `ApiError`. Ninguna pantalla recibe errores de axios.

### Cómo se usa

Las llamadas viven en el `api/<entidad>.api.ts` de cada feature. Son funciones `async` que devuelven solo `data`:

```ts
import { http } from '@/shared/api/http'
import type { Page } from '@/shared/api/pagination'

export async function listCustomers(params?: CustomerListParams): Promise<Page<Customer>> {
  const { data } = await http.get<Page<Customer>>('/customers', { params })
  return data
}
```

Las rutas son relativas al `baseURL` (`/customers`, no `/api/customers`). Los parámetros `undefined` no se mandan en la query string.

### Catálogos chicos y listados grandes

Los catálogos chicos (**Fábricas** y **Rubros**) se piden en una sola página grande y la pantalla filtra y pagina en el navegador con `usePagedList`. La función de la API devuelve solo `data.items`:

```ts
export async function listCategories(): Promise<Category[]> {
  const { data } = await http.get<Page<Category>>('/categories', { params: { page: 1, limit: 100 } })
  return data.items
}
```

Los listados grandes (**Encargados** y **Proveedores**) dejan que el backend filtre y pagine: le pasan la búsqueda, los filtros y la página, y devuelven el `Page<T>` completo. La pantalla usa `total` para `<Pagination />` y `keepPreviousData` para que no parpadee al cambiar de página.

### `queryClient` (`shared/api/queryClient.ts`)

Es el cliente de React Query de toda la app (lo monta `app/providers/QueryProvider.tsx`). Sus valores por defecto:

- **Consultas:** se reintentan hasta 2 veces solo si fue un error de red o del servidor (5xx). Un 400, 404 o 409 no se reintenta, porque repetir no cambia la respuesta.
- **`staleTime` de 1 minuto:** si volvés a una pantalla dentro de ese minuto, los datos salen de la caché sin pedir nada.
- **Mutaciones:** nunca se reintentan. Si un POST se reintentara después de que el backend ya lo procesó, se duplicaría el registro.

### Paginación (`shared/api/pagination.ts`)

- `Page<T>`: la forma de las respuestas paginadas del backend (`items`, `total`, `page`, `limit`). La página empieza en 1.
- `DEFAULT_PAGE_SIZE = 20`: coincide con el default del backend.

### Pendiente del Sprint 2

El contrato del Sprint 2 (§8.4) pide cambios en esta capa cuando llegue el login:

- `getToken()` tiene que devolver el `accessToken`, guardado **en memoria** (no en `localStorage`).
- El interceptor de response, ante `401 ACCESS_TOKEN_EXPIRED`, llama **una sola vez** a `POST /auth/refresh` y repite las peticiones pendientes; ante `SESSION_EXPIRED` o `UNAUTHENTICATED`, manda al ingreso.
- `ApiError` tiene que leer `code` y `details` como `{ field, message }[]` (ver la sección 3).

---

## 3. `ApiError` (`shared/api/ApiError.ts`)

Todo error que sale de `http` es un `ApiError`, con estas propiedades:

| Propiedad | Qué tiene                                                                  |
| --------- | -------------------------------------------------------------------------- |
| `status`  | Código HTTP. `0` significa que no hubo respuesta (sin red, backend caído, timeout) |
| `message` | Mensaje para mostrar (del backend, o uno en español por defecto)           |
| `details` | Todos los mensajes, cuando el backend manda `message` como lista (validaciones de Nest) |
| `field`   | El campo que causó el error, si el backend lo informa (por ejemplo, `cuit` en un 409 de proveedores) |

Y estos atajos para no comparar códigos a mano:

| Getter           | Es `true` cuando...                       |
| ---------------- | ----------------------------------------- |
| `isNetworkError` | `status === 0`                            |
| `isValidation`   | 400 o 422                                 |
| `isAuth`         | 401 o 403                                 |
| `isNotFound`     | 404                                       |
| `isConflict`     | 409 (choque con una regla de negocio)     |
| `isServer`       | 500 o más                                 |

### De dónde sale el `message`

1. Si el backend manda una lista de mensajes, se usa el primero y la lista completa queda en `details`.
2. Si manda un texto, se usa ese texto (y `field`, si vino).
3. Si no manda nada, se usa un mensaje en español según el código (por ejemplo, 403: *"No tenés permiso para realizar esta acción."*).
4. Sin respuesta: *"Error de red..."* o, si fue timeout, *"El servidor tardó demasiado..."*.

> **Va a cambiar en el Sprint 2.** Desde el Sprint 2 todas las respuestas de error traen `code` (`USERNAME_TAKEN`, `EMPLOYEE_DNI_TAKEN`...) y los 400 y 409 informan los campos en `details: { field, message }[]` (contrato §5.2). La pantalla tiene que decidir por `code`, no por el texto. No diseñes nada nuevo en base a `field`: es la forma vieja de proveedores.

### Cómo se usa

En un `catch` o en el `onError` de una mutación, el error es `unknown`. `isApiError()` le confirma al compilador que es un `ApiError`:

```ts
import { isApiError } from '@/shared/api/ApiError'

if (isApiError(error) && error.isConflict) {
  // ...
}
```

Muchos mensajes del backend del Sprint 1 están en inglés y pensados para desarrolladores. Por eso cada feature traduce sus casos conocidos en `utils/errorMessages.ts` y deja pasar tal cual solo los de red y servidor, que `http.ts` ya arma en español:

```ts
export function factoryErrorMessage(error: unknown, fallback: string): string {
  if (isApiError(error)) {
    if (error.isNetworkError || error.isServer) return error.message
    if (error.isConflict) return 'Ya existe una fábrica registrada con ese CUIT.'
    if (error.isNotFound) return 'La fábrica ya no existe.'
  }
  return fallback
}
```

Rubros es la excepción: sus 409 ya vienen en español y se muestran tal cual.

### Cuando necesitás otro dato del cuerpo del error

`ApiError` guarda solo `message`, `details` y `field`; el resto del cuerpo se pierde. Si una pantalla necesita otro dato, la llamada acepta ese código como respuesta válida con `validateStatus` y lee el cuerpo ella misma. Es lo que hace el alta de Rubros: un 409 trae el `categoryId` de un rubro dado de baja para reactivarlo.

```ts
const response = await http.post<Category | CreateConflictBody>('/categories', input, {
  validateStatus: (status) => (status >= 200 && status < 300) || status === 409,
})
```

Si después de leerlo el caso sigue siendo un error, se lanza un `ApiError` a mano (`throw new ApiError(409, mensaje)`). Así la pantalla lo maneja igual que cualquier otro.

---

## 4. Componentes de interfaz (`shared/components/ui/`)

Se importan todos juntos desde `@/shared/components/ui`. Los estilos viven en `styles/styles.css`: los componentes solo eligen qué clases poner.

### `Button`

Acepta todas las props de un `<button>` nativo, más:

- `variant`: `primary` (por defecto), `secondary` (botón translúcido para el panel oscuro de la cabecera), `outline` o `danger`.
- `block`: ocupa todo el ancho.

`type` es `button` por defecto: para enviar un formulario hay que poner `type="submit"`.

**Cuidado al intercambiar botones en el mismo lugar.** Si al tocar un botón se renderiza otro en su lugar (por ejemplo "Editar" → "Guardar cambios" con `type="submit"`), ponele un `key` distinto a cada uno. Si no, React reutiliza el mismo `<button>`, le cambia el `type` en medio del click y el navegador envía el formulario. Pasó en los detalles de encargado y de fábrica.

### `TrashButton`

Botón de eliminar: gris en reposo y rojo al pasar el mouse.

- `label` es obligatorio y dice **qué** se borra: "Eliminar proveedor", no "Eliminar".
- Sin `children` es un botón redondo solo con ícono (para filas de tabla). Con `children` es una pastilla con texto (para barras de acciones).
- `disabled` lo deshabilita.

### `IconTrash`

El dibujo del tacho. Normalmente no se usa suelto: ya lo incluyen `TrashButton` y `Modal tone="danger"`. El grupo `<g className="lid">` no se puede quitar, porque el CSS lo rota para abrir la tapa.

### `Input`

Campo de texto con `label`, `error` y `hint` (el error tiene prioridad sobre la ayuda). `full` lo hace ocupar todas las columnas de un `.form-grid`. Usa `forwardRef`, así que funciona con `register()` de react-hook-form.

Si no se le pasa `id`, genera uno con `useId()`: así el `<label>` siempre queda asociado al campo, tocar el rótulo enfoca el input y el lector de pantalla lo anuncia con su nombre. Los tests E2E encuentran los campos por su rótulo (`getByLabel`), así que esto no se puede romper.

### `Select`

Desplegable propio, con el estilo del rediseño y accesible por teclado (flechas, Inicio/Fin, Enter, Escape, búsqueda por letra). Es un botón con `role="combobox"` y una lista con `role="listbox"` dibujada en un portal (así no la recorta el panel oscuro ni un modal).

- `onChange` recibe **el valor**, no un evento.
- Es genérico: con opciones tipadas, el valor llega con su tipo sin castear.
- `placeholder`: el texto cuando el valor no coincide con ninguna opción (por ejemplo `''`).
- `variant`: `field` (campo de formulario, por defecto) o `glass` (filtros dentro del panel oscuro).
- `invalid` pinta el borde de error; `disabled` lo deshabilita.
- Se nombra con un `<label htmlFor={id}>` o, en los filtros sin rótulo visible, con `aria-label` ("Filtrar por rubro").
- Con react-hook-form va dentro de un `<Controller>`, pasándole `value`, `onChange`, `onBlur` y `ref` del `field`.

```tsx
<Select
  id="supplierType"
  value={form.supplierType}
  onChange={(type) => setForm((f) => ({ ...f, supplierType: type }))}
  options={SUPPLIER_TYPES.map((t) => ({ value: t, label: t }))}
/>
```

Para un filtro con "Todos", la opción "Todos" es una más con valor `''`, no un placeholder: volver a elegirla limpia el filtro.

### `CheckBox`

Casillero grande (34px) para tablas y celular. Por dentro sigue siendo un `<input type="checkbox">`, así que teclado y lector de pantalla funcionan igual. `label` es el texto para el lector de pantalla. No propaga el click, así que puede ir dentro de una fila clickeable.

### `SearchField`

Buscador con lupa para las barras de herramientas. `onChange` recibe el texto. `placeholder` es obligatorio; `label` es el nombre accesible y, si falta, se usa el placeholder. Para filtrar en el navegador, compará con `normalizeText()`; si filtra el backend, conviene esperar ~300 ms antes de pedir (como Encargados y Proveedores).

### `Table`

Tabla genérica: cada columna (`Column<T>`) dice su `header` y cómo pintar su celda (`render`).

| Prop           | Para qué                                                                  |
| -------------- | ------------------------------------------------------------------------- |
| `columns`, `data`, `rowKey` | Obligatorias: columnas, filas y clave única por fila        |
| `variant`      | `table` (por defecto, `<table>` clásico) o `cards` (filas en tarjeta, la del rediseño) |
| `gridTemplate` | Anchos de columna en `cards`. Las flexibles van con `minmax(0, Nfr)`, no con `1fr` a secas, para que los textos largos no desborden |
| `rowClassName` | Clase extra por fila, por ejemplo la franja de color (`table__row--azul`) |
| `onRowClick`   | Hace clickeable la fila entera, también con Enter y Espacio               |
| `emptyState`   | Lo que se muestra sin filas (un `<EmptyState />`)                         |
| `emptyMessage` | Texto simple sin filas, si no hay `emptyState`                            |
| `footer`       | Pie de la tarjeta (un `<Pagination />`)                                   |

Cada columna también acepta:

- `align`: `left` (por defecto) o `center`. Vale para las dos variantes, en el encabezado y en las celdas.
- `cellClassName`: una clase extra para la celda, por ejemplo `table__cell--fin` para alinear al final en `cards`.

En `variant="cards"` las filas son `<div class="table__row">` sin roles de tabla: por eso los tests buscan las filas por esa clase.

### `Pagination`

Pie de un listado: "Mostrando 1–20 de 87" y los botones de página. Va en el `footer` de `Table`. Sirve tanto si pagina el backend como si la lista está entera en memoria (con `usePagedList`). Con `total === 0` no muestra nada. `disabled` bloquea los botones mientras llega la página pedida.

### `ValueOrDash`

Muestra el dato o, si falta (vacío, solo espacios, `null` o `undefined`), un guion gris. Usalo en vez de escribir `'—'` a mano: así el guion es siempre igual y en celular la celda vacía se esconde. Combina con `formatPhone`, que devuelve `''` si no hay teléfono:

```tsx
<ValueOrDash value={formatPhone(c.phone)} className="table__cell--mono" />
```

### `Modal`

Diálogo que se dibuja sobre toda la página (`role="dialog"`, nombrado con su `title`). Se cierra con Escape o con un click afuera, y bloquea el scroll del fondo mientras está abierto.

- `open`, `onClose` y `title` son obligatorios.
- `size`: `sm`, `md` (por defecto) o `lg`.
- `tone="danger"` es la confirmación de un borrado: agrega el tacho y el rojo.
- Los botones de acción van en `footer`. Para enviar un formulario del cuerpo desde el pie, el botón lleva `type="submit"` y `form={idDelForm}`.

### `PageHero`

Cabecera de un listado o de un panel: fondo azul marino con una foto del taller a la derecha.

| Prop            | Para qué                                                            |
| --------------- | ------------------------------------------------------------------- |
| `eyebrow`       | Rótulo chico arriba del título ("Catálogo de")                       |
| `accent`        | Última palabra del rótulo, resaltada ("proveedores")               |
| `title`         | Título                                                              |
| `photo`         | Foto importada de `@/assets/`                                       |
| `photoPosition` | Encuadre de la foto (`background-position`). Sin ella, el CSS la pone en `65% center` |
| `back`          | `{ to, label }`: enlace de vuelta al panel, arriba del rótulo       |
| `variant`       | `list` (por defecto) deja lugar para la barra de herramientas de abajo; `panel` es para los paneles de tarjetas |
| `children`      | Bajada debajo del título (en los listados, el total: "**5** rubros registrados") |

En un listado, el enlace de vuelta sale de la configuración de paneles, así el texto y la ruta no se escriben a mano:

```tsx
import { PANELS } from '@/features/catalogs/panels'

<PageHero
  eyebrow="Catálogo de"
  accent="rubros"
  title="Rubros"
  photo={fotoDisco}
  photoPosition="center 45%"
  back={{ to: PANELS.clientes.to, label: PANELS.clientes.label }}
/>
```

Las altas y los detalles no usan `PageHero`: arman su propia cabecera `.page-header--foto` y le pasan la foto con `heroPhoto()`.

### `Badge`

Etiqueta corta. `variant`: `azul`, `ambar`, `verde`, `neutral` (registro dado de baja) o `suave` (categoría de texto libre, como el rubro de una fábrica). `icon` agrega un `EntityIcon` a la izquierda.

### `Avatar`

Muestra las iniciales del `name` (máximo 2) o, si se pasa `icon`, el ícono de la entidad.

- `tone`: `azul` (por defecto), `ambar`, `verde`, `neutral` o `suave`. Son los mismos nombres que en `Badge`, así el avatar y la etiqueta de una fila combinan sin mapear nada.
- `shape`: `square` (por defecto) para empresas y proveedores, `round` para personas (encargados).
- `size="lg"`: la versión grande del encabezado de un detalle.

### `EntityIcon`

Íconos fijos por tipo de registro: `encargado`, `fabrica`, `rubro`, `proveedor`, `material`, `repuesto`, `pintura` y `tercerizado`. Toma tamaño y color del contenedor. Para agregar uno nuevo (empleado, usuario, tipo de proceso), se suma su trazo a `PATHS`; los trazos están en el `IC` del prototipo.

---

## 5. Feedback (`shared/components/feedback/`)

### `EmptyState`

Lo que se ve en lugar de las filas cuando no hay nada para mostrar.

- `kind`: `empty` (todavía no hay registros, por defecto), `no-results` (la búsqueda no encontró nada) o `error` (no se pudieron traer; se anuncia al lector de pantalla con `role="alert"`).
- `title` es obligatorio; `children` es la línea de ayuda.
- `action` es el botón para salir del estado: dar de alta, limpiar la búsqueda o reintentar.
- `card` le da fondo de tarjeta propio. Dentro de `<Table emptyState={…} />` no hace falta; sí cuando va suelto, como en el "no encontrado" de un detalle.

```tsx
<Table
  emptyState={
    <EmptyState kind="no-results" title="No encontramos proveedores" action={<Button onClick={clear}>Limpiar búsqueda</Button>}>
      Probá con otro nombre o CUIT.
    </EmptyState>
  }
  /* ... */
/>
```

---

## 6. Hooks y utilidades

### `usePagedList(items, pageSize?)` — `shared/hooks/`

Pagina en el navegador una lista que ya está entera en el cliente (hoy **Fábricas** y **Rubros**). Recibe la lista **ya filtrada** y devuelve `{ page, setPage, pageItems, pageSize, total, totalPages }`, listo para `<Pagination />`.

Si la lista se achica y la página actual queda fuera de rango, devuelve la última que existe. Igual, al cambiar la búsqueda conviene llamar a `setPage(1)` para volver al principio.

```tsx
const visible = categories.filter((c) => normalizeText(c.name).includes(term))
const { pageItems, page, setPage, pageSize, total } = usePagedList(visible)
```

No lo uses en un listado que pagina el backend (Encargados, Proveedores): ahí la página la decide la API.

### `shared/lib/`

| Función                     | Qué hace                                                                 |
| --------------------------- | ------------------------------------------------------------------------ |
| `cn(...partes)`             | Une clases CSS y descarta las falsas: `cn('btn', activo && 'btn--on')`  |
| `normalizeText(texto)`      | Pasa a minúsculas y saca acentos, para comparar en búsquedas ("gomez" encuentra "Gómez") |
| `formatPhone(valor)`        | Muestra un celular argentino guardado como `+549` + 10 dígitos como `+54 9 351 444-5678`. Asume código de área de 2 dígitos para el 11 y de 3 para el resto. Cualquier otro formato lo devuelve tal cual; si no hay valor, devuelve `''` |
| `cuitError(valor)`          | Devuelve qué tiene de malo un CUIT, en un mensaje para el usuario, o `null` si es válido. Aplica las mismas reglas que el backend. No decide si el campo es obligatorio |
| `isValidCuit(valor)`        | `true` si el CUIT es válido                                              |
| `cuitDigits(valor)`         | Deja solo los dígitos: `"30-71234567-1"` → `"30712345671"`              |
| `formatCuit(cuit)`          | Muestra 11 dígitos como `XX-XXXXXXXX-X`                                 |
| `toneByStatus(activo)`      | Tono de fila según el estado: `azul` si está activo, `neutral` si está dado de baja |
| `heroPhoto(url)`            | Devuelve el `style` que pasa una foto al CSS como `--hero-foto`, para las cabeceras `.page-header--foto` de altas y detalles |

El backend guarda los teléfonos sin separadores y el CUIT de las fábricas en 11 dígitos: por eso los formateadores existen. Nunca guardes el valor formateado.

### Carpetas reservadas

`shared/components/forms/` y `shared/types/` existen pero todavía están vacías. Son para componentes de formulario y tipos técnicos que use más de una feature.

---

## 7. Helpers de los mocks (`shared/mocks/`)

Solo los usan los `*.mocks.ts` de las features, que se cargan en desarrollo con `VITE_USE_MOCKS=true` y en los tests E2E. **El código de la app nunca importa de acá.** Cómo se arma un mock está en [MOCKS.md](MOCKS.md).

| Helper                                        | Archivo      | Para qué                                                                  |
| --------------------------------------------- | ------------ | ------------------------------------------------------------------------- |
| `apiError(request, status, message, opts)`    | `errors.ts`  | Un error con la forma del backend (`statusCode`, `error`, `message`, `path`, `timestamp`). `opts`: `code`, `details`, `extra` |
| `validationError(request, details, message?)` | `errors.ts`  | El `400 VALIDATION_ERROR` del Sprint 2, con un `{ field, message }` por campo |
| `authorize(request, roles)`                   | `session.ts` | Verifica la sesión simulada y el rol: devuelve quién llama o el `401` / `403` |
| `openSession`, `currentSession`, `closeSession`, `issueAccessToken` | `session.ts` | La sesión simulada (la "cookie" en `localStorage`) |
| `readPageOrError(request)`                    | `paging.ts`  | `page` y `limit` (defaults 1 y 20, máximo 1000) o el `400` del Sprint 2   |
| `readPageParams(url)` + `PAGE_LIMIT_ERROR`    | `paging.ts`  | Lo mismo con el mensaje del backend del Sprint 1                          |
| `paginate(items, pageParams)`                 | `paging.ts`  | El sobre `{ items, total, page, limit }`                                  |
| `readPathId(request, raw, field, message)`    | `paging.ts`  | El id de la ruta como entero, o el `400 INVALID_PATH_PARAMETER`           |
| `sameText(a, b)` / `containsText(a, b)` / `comparable(texto)` | `text.ts` | Comparar sin mayúsculas, acentos ni espacios repetidos (contrato §4) |

`authorize` recibe los roles de `MODULE_ROLES` (`@/domain/roles`), así los mocks usan la misma matriz de permisos que la app.

---

## 8. Guía para Claude

Reglas para cuando Claude escribe o modifica código del frontend:

1. **Buscá en la tabla de la sección 1 antes de crear algo.** Si ya existe un componente o función que lo resuelve, usalo. No escribas un botón, una tabla, un modal, un buscador ni un formateador propio.
2. **No uses elementos nativos cuando hay uno propio:** `<Button>` en vez de `<button>`, `<Select>` en vez de `<select>`, `<CheckBox>` en vez de `<input type="checkbox">`, `<ValueOrDash>` en vez de `'—'`.
3. **Nunca importes `axios`.** Toda llamada al backend usa `http`, dentro del `api/<entidad>.api.ts` de la feature, y devuelve solo `data` (o `data.items` en los catálogos chicos).
4. **Tratá los errores siempre como `ApiError`.** Usá `isApiError()` y los getters (`isConflict`, `isNotFound`...), nunca compares `status` a mano. Traducí los mensajes en el `utils/errorMessages.ts` de la feature; solo los de red y servidor se muestran tal cual. Para el Sprint 2, decidí por `code` (ver la sección 3).
5. **Usá `validateStatus` solo si necesitás un dato del cuerpo del error** que `ApiError` no guarda, y si el caso sigue siendo un error, lanzá un `ApiError`.
6. **No cambies los valores por defecto de `queryClient`** desde una feature. Las mutaciones no se reintentan.
7. **Los avisos al usuario van con `useToast()`** desde `@/app/providers/ToastContext`: `success` para lo que se creó o guardó, `info` para bajas, `error` para fallas.
8. **Toda pantalla de detalle publica su título con `useCrumbTitle()`**, pasando `undefined` mientras el dato carga. Todo listado lleva `PageHero` con `back` armado desde `PANELS`.
9. **No pongas lógica de negocio en `shared/`.** Si una función sabe qué es un proveedor, una cotización o un rubro, va en la feature (o en `domain/` si la necesitan varias). `shared/` no importa nada de `app/` ni de `features/`.
10. **Los roles salen de `@/domain/roles`**: son seis (`JT`, `ERP`, `EC`, `ER`, `AT`, `AS`), ni más ni menos. No escribas códigos de rol sueltos ni una lista de permisos propia: usá `MODULE_ROLES` y `canAccess()`.
11. **Algo pasa a `shared/` cuando lo necesita una segunda feature**, no antes. Al moverlo, sacale todo lo que sea de negocio y agregalo a la tabla de este documento.
12. **Los componentes nuevos de `ui/` se exportan en `shared/components/ui/index.ts`.** Desde afuera se importan desde `@/shared/components/ui`, nunca desde el archivo suelto.
13. **Los estilos van en `styles/styles.css`**, no en línea. El componente solo elige clases con `cn()`. La única excepción es pasar datos como custom properties (`--hero-foto`, `--hero-pos`, `--rp-cols`).
14. **Cuidá la accesibilidad:** todo campo con su `<label>` (o `aria-label`), todo botón de solo ícono con `label` o `aria-label`, y las filas clickeables con `onRowClick` de `Table`, que ya maneja el teclado. Los tests E2E buscan por rol y rótulo: si algo no es accesible, el test no lo encuentra.
15. **Dos botones que se reemplazan en el mismo lugar llevan `key` distintos** (ver `Button`).
16. **`shared/mocks/` es solo para los mocks.** No lo importes desde una pantalla, un hook ni un `*.api.ts`.
17. **Si cambiás la API de algo de `shared/`** (props, nombre, comportamiento), actualizá este documento en el mismo cambio.
