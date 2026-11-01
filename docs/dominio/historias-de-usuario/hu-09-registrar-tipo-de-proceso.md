# HU-09 — Registrar Tipo de Proceso (CU-09)

**Fuente de verdad:** `docs/api-contract/API_CONTRACT_SPRINT_2.md` (§3.4 y §3.5). Si algo de esta historia no coincide con el contrato, manda el contrato. Cada escenario indica la respuesta de la API que lo demuestra: sirve de criterio de aceptación para el backend, el frontend y los casos de prueba (CP).

## Caso de uso

- Como Administrativo Técnico (o Encargado de Cotización, que hereda sus permisos),
- Quiero dar de alta un tipo de proceso propio del taller con su precio por hora en pesos y en dólares,
- Para que el Encargado de Cotización lo seleccione al cotizar y el sistema le proponga el costo hora sin buscarlo en planillas.

**Endpoints:** `POST /process-types` y `GET /exchange-rate`. **Rol:** AT o EC.

## Escenarios

### Escenario 1: Alta exitosa

- Dado que el Administrativo Técnico está en "Tipos de proceso",
- Cuando selecciona "+ Nuevo tipo de proceso", ingresa el nombre "Mecanizado Torno CNC 5 ejes" y el precio hora en pesos 3100 con el tipo de cambio precargado 1385,50,
    - Y confirma,
- Entonces el sistema registra el tipo de proceso con $ 3.100,00, US$ 2,24 y el tipo de cambio 1385,50, exactamente como se vieron en pantalla,
    - Y el tipo aparece en el listado con "Última actualización" igual a la fecha de alta,
    - Y su historial de precios queda vacío ("Todavía no hubo cambios en este tipo de proceso.").
- **API:** `POST /process-types` → `201 Created` con el tipo de proceso; `createdAt` igual a `updatedAt`. El alta no crea registros en `GET /process-types/{processTypeId}/history`.

### Escenario 2: Nombre duplicado

- Dado que ya existe el tipo "Mecanizado Torno Manual",
- Cuando el Administrativo Técnico intenta registrar "mecanizado torno manual" o "Mecanizado Tórno Manual",
- Entonces el sistema detecta el duplicado sin distinguir mayúsculas, acentos ni espacios repetidos,
    - Y marca el campo "Nombre" con "Ya existe un tipo de proceso con ese nombre" y no lo registra.
- **API:** `409 PROCESS_TYPE_NAME_TAKEN`, con `details` sobre el campo `name`.

### Escenario 3: Precio inválido

- Dado que el Administrativo Técnico dejó vacío alguno de los precios, o ingresó 0, un número negativo o un valor con más de dos decimales,
- Cuando confirma,
- Entonces el sistema marca cada campo con su error (por ejemplo "El precio hora en pesos tiene que ser un número mayor a 0" o "El precio hora en dólares admite como máximo dos decimales") y no registra el tipo.
- **API:** `400 VALIDATION_ERROR`, con un elemento de `details` por campo (`hourlyRateArs`, `hourlyRateUsd`, `exchangeRate`).

### Escenario 4: Nombre vacío o demasiado largo

- Dado que el Administrativo Técnico no ingresó el nombre, o el nombre supera los 100 caracteres, o la descripción supera los 500,
- Cuando confirma,
- Entonces el sistema marca el campo ("Ingresá el nombre del tipo de proceso") y no registra el tipo.
- **API:** `400 VALIDATION_ERROR` con `details` sobre `name` o `description`.

### Escenario 5: Usuario sin permiso

- Dado que el usuario no tiene el rol Administrativo Técnico ni Encargado de Cotización (por ejemplo, solo Jefe de Taller o Encargado de Reportes),
- Cuando intenta registrar un tipo de proceso por URL o llamando directamente al servicio,
- Entonces el sistema lo deniega con "No tenés permisos para realizar esta operación." y no registra nada.
- **API:** `403 FORBIDDEN`. Sin sesión, `401` de sesión (`ACCESS_TOKEN_EXPIRED`, `SESSION_EXPIRED` o `UNAUTHENTICATED`).

### Escenario 6: Tipo de cambio precargado

- Dado que el backend tiene una cotización del dólar,
- Cuando el Administrativo Técnico abre el formulario de alta,
- Entonces el campo "Tipo de cambio (USD → ARS)" viene precargado y muestra "Cotización actualizada al 15/10/2026 09:30" (hora de Córdoba),
    - Y si lo cambia, el formulario avisa "Valor modificado" y ofrece "↺ Restablecer cotización actual", que vuelve al valor del backend.
- **API:** `GET /exchange-rate` → `200` con `rate` y `updatedAt`. Si la fuente externa falla pero el backend tiene una cotización anterior, responde `200` con esa y su `updatedAt` real.

### Escenario 7: Cotización del dólar no disponible

- Dado que el backend nunca pudo obtener una cotización del dólar,
- Cuando el Administrativo Técnico abre el formulario de alta,
- Entonces el campo de tipo de cambio queda vacío con el aviso "No se pudo obtener la cotización del dólar. Ingresá el tipo de cambio a mano.",
    - Y puede registrar el tipo de proceso igual, cargando el tipo de cambio a mano.
- **API:** `GET /exchange-rate` → `502 EXCHANGE_RATE_UNAVAILABLE`. `POST /process-types` no depende de ese endpoint.

### Escenario 8: Precios vinculados por el tipo de cambio

- Dado que el tipo de cambio del formulario es 1385,50,
- Cuando el Administrativo Técnico cambia el precio en pesos, el precio en dólares o el tipo de cambio,
- Entonces el formulario recalcula el otro valor, redondeado a dos decimales:
    - cambia los pesos → dólares = pesos ÷ tipo de cambio (3100 → US$ 2,24),
    - cambia los dólares → pesos = dólares × tipo de cambio,
    - cambia el tipo de cambio → dólares = pesos ÷ tipo de cambio, y los pesos se mantienen (RN18).
- **API:** el cálculo es del cliente. La API recibe los dos precios y el tipo de cambio y los guarda tal como llegan, sin recalcular (D-29).

## Reglas del contrato

- `name`: obligatorio, hasta 100 caracteres, único sin distinguir mayúsculas, acentos ni espacios repetidos (D-34).
- `description`: opcional, hasta 500 caracteres. Vacía (`""`) se guarda como `null`.
- `hourlyRateArs`, `hourlyRateUsd` y `exchangeRate`: obligatorios, mayores a 0, con hasta dos decimales (D-35). Se guardan como decimales exactos, no como punto flotante.
- Cada tipo de proceso tiene su propio precio hora (RN16, RN17) y solo aplica a procesos propios del taller.
- El tipo de proceso no tiene estado: la baja (CU-12) no es de este sprint.
- Un campo que el endpoint no declara responde `400 VALIDATION_ERROR`.

## Fuera de alcance

El alta durante la carga de una cotización (CU-14) y la baja de tipos de proceso (CU-12).
