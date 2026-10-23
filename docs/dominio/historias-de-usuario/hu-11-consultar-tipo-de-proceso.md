# HU-11 — Consultar Tipo de Proceso (CU-11)

**Fuente de verdad:** `docs/api-contract/API_CONTRACT_SPRINT_2.md` (§3.4). Si algo de esta historia no coincide con el contrato, manda el contrato. Cada escenario indica la respuesta de la API que lo demuestra: sirve de criterio de aceptación para el backend, el frontend y los casos de prueba (CP).

## Caso de uso

- Como Encargado de Cotización (o Administrativo Técnico),
- Quiero consultar el catálogo de tipos de proceso con su precio hora vigente,
- Para elegir el tipo correcto al cotizar y conocer el costo actual de cada hora de taller.

**Endpoints:** `GET /process-types`, `GET /process-types/{processTypeId}` y `GET /process-types/{processTypeId}/history`. **Rol:** AT o EC.

## Escenarios

### Escenario 1: Listado del catálogo

- Dado que el usuario ingresa a "Tipos de proceso",
- Cuando se carga la pantalla,
- Entonces el sistema muestra los tipos de proceso ordenados por nombre, con nombre y descripción, "Precio hora en pesos", "Precio hora en dólares" y "Última actualización",
  - Y el encabezado indica la cantidad ("7 tipos de proceso registrados"),
  - Y pagina el listado de a 20.
- **API:** `GET /process-types` → `200` con `{ items, total, page, limit }` (`limit` por defecto 20). El encabezado usa `limit=1` sin filtros y toma `total`.

### Escenario 2: Búsqueda

- Dado que el usuario escribe "torno" en "Buscar por nombre",
- Cuando se ejecuta la búsqueda,
- Entonces el sistema muestra los tipos cuyo nombre contiene "torno", sin distinguir mayúsculas ni acentos.
- **API:** `GET /process-types?search=torno` → `200`.

### Escenario 3: Detalle con historial

- Dado que el usuario selecciona un tipo del listado,
- Cuando abre su detalle,
- Entonces el sistema muestra el bloque "Datos del tipo de proceso", el recuadro "Registro" (alta y última actualización) y la tabla "Historial de precios",
  - Y si nunca cambió de precio, "Todavía no hubo cambios en este tipo de proceso."
- **API:** `GET /process-types/{processTypeId}` → `200`; `GET /process-types/{processTypeId}/history` → `200` con `{ items }` del más reciente al más antiguo, sin paginar (`items` vacío si no hubo cambios).

### Escenario 4: Sin resultados

- Dado que la búsqueda no encuentra coincidencias,
- Cuando se ejecuta,
- Entonces el sistema muestra "No se encontraron tipos de proceso con ese criterio",
  - Y ofrece "+ Nuevo tipo de proceso".
- **API:** `200` con `items` vacío y `total` en `0`. No es un error.

### Escenario 5: El Encargado de Reportes no accede

- Dado que el usuario solo tiene el rol "Encargado de Reportes",
- Cuando intenta acceder al catálogo o a su servicio,
- Entonces el sistema deniega el acceso con "No tenés permisos para realizar esta operación." (D-13: manda el prototipo y la matriz de permisos).
- **API:** `403 FORBIDDEN` en los tres endpoints.

### Escenario 6: Usuario sin acceso a costos

- Dado que el usuario solo tiene el rol "Jefe de Taller", "Encargado de Recepción" o "Administrador del Sistema",
- Cuando intenta acceder al catálogo o a su servicio,
- Entonces el sistema deniega el acceso, porque el precio hora es información interna (RN42, RN43).
- **API:** `403 FORBIDDEN`. Sin sesión, `401` de sesión.

### Escenario 7: Tipo de proceso inexistente

- Dado que el tipo de proceso no existe (o el identificador de la URL no es un número),
- Cuando el usuario abre su detalle,
- Entonces el sistema informa que no se encontró.
- **API:** `404 PROCESS_TYPE_NOT_FOUND`; identificador no entero → `400 INVALID_PATH_PARAMETER`.

### Escenario 8: Parámetros de consulta inválidos

- Dado que la consulta llega con `page=0`, `limit` fuera de 1 a 100 o un parámetro que no existe,
- Cuando se ejecuta,
- Entonces la API la rechaza.
- **API:** `400 VALIDATION_ERROR` con `details` sobre el parámetro.

## Reglas del contrato

- El precio hora es información interna: solo lo ven el Administrativo Técnico y el Encargado de Cotización.
- "Última actualización" es `updatedAt`: cambia con cualquier modificación (nombre, descripción o precios), no solo con las de precio (D-33).
- Los montos llegan como números con hasta dos decimales; el formato ("$ 1.557,00", "US$ 1,13") lo pone el cliente. Las fechas llegan en UTC y se muestran en hora de Córdoba.
- No hay tipos de proceso dados de baja en este sprint, así que no hay filtro "Incluir dados de baja" (llega con CU-12).
