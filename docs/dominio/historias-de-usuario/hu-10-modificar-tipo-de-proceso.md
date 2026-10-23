# HU-10 — Modificar Tipo de Proceso (CU-10)

> **Estado: registrada, sin implementar.** El historial de precios exige `changed_by_user_id` (NOT NULL, FK a `app_user`) y todavía no existe `identity` ni sesión que lo provea. Se implementa cuando haya autenticación.

**Fuente de verdad:** `docs/api-contract/API_CONTRACT_SPRINT_2.md` (§3.4 y §3.5). Si algo de esta historia no coincide con el contrato, manda el contrato. Cada escenario indica la respuesta de la API que lo demuestra: sirve de criterio de aceptación para el backend, el frontend y los casos de prueba (CP).

## Caso de uso

- Como Administrativo Técnico (o Encargado de Cotización, que hereda sus permisos),
- Quiero actualizar el nombre, la descripción o el precio por hora de un tipo de proceso,
- Para que las nuevas cotizaciones usen el valor vigente sin alterar las que ya se cargaron.

**Endpoints:** `PATCH /process-types/{processTypeId}`, `GET /process-types/{processTypeId}/history` y `GET /exchange-rate`. **Rol:** AT o EC.

## Escenarios

### Escenario 1: Actualización por variación del dólar

- Dado que "Mecanizado Torno Manual" tiene $ 1.557,00, US$ 1,13 y tipo de cambio 1377,88,
- Cuando el Administrativo Técnico selecciona "Modificar", cambia el tipo de cambio a 1390 (el formulario recalcula US$ 1,12 y mantiene los pesos),
  - Y confirma en el modal "Confirmar cambios", que muestra cada campo como "anterior → nuevo",
- Entonces el sistema guarda US$ 1,12 y el tipo de cambio 1390 sin modificar los $ 1.557,00 (RN18),
  - Y agrega al historial un registro con fecha y hora, usuario, valor anterior US$ 1,13, valor nuevo US$ 1,12 y tipo de cambio 1390,
  - Y "Última actualización" pasa a ser la fecha y hora del cambio.
- **API:** `PATCH /process-types/1` con `{ "hourlyRateUsd": 1.12, "exchangeRate": 1390 }` → `200 OK` con el tipo de proceso actualizado. `GET /process-types/1/history` suma un elemento.

### Escenario 2: Actualización del precio en pesos

- Dado que el taller decidió aumentar el valor de su hora de herrería,
- Cuando el Administrativo Técnico modifica el precio en pesos (el formulario recalcula los dólares con el tipo de cambio) y confirma,
- Entonces el sistema guarda los dos precios y el tipo de cambio, y agrega un registro al historial,
  - Y el catálogo propone el nuevo valor desde ese momento.
- **API:** `PATCH` con `hourlyRateArs`, `hourlyRateUsd` y `exchangeRate` → `200`. Un solo registro de historial por modificación, aunque cambien los dos precios.

### Escenario 3: Las cotizaciones ya cargadas no cambian

- Dado que existen cotizaciones que usan procesos de ese tipo,
- Cuando se modifica su precio hora,
- Entonces esas cotizaciones conservan el costo hora con el que fueron cargadas (RN17).
- **API:** el `PATCH` solo modifica el tipo de proceso. Las cotizaciones (CU-14) llegan en otro sprint, pero la regla queda fijada.

### Escenario 4: Historial de precios

- Dado que el tipo de proceso tuvo varias modificaciones de precio,
- Cuando el usuario abre su detalle,
- Entonces la tabla "Historial de precios" muestra cada cambio con Fecha y hora, Usuario, Valor anterior (US$), Valor nuevo (US$) y Tipo de cambio, del más reciente al más antiguo y sin paginar,
  - Y no ofrece ninguna opción para editar ni borrar esos registros (RNF10),
  - Y si nunca cambió de precio muestra "Todavía no hubo cambios en este tipo de proceso."
- **API:** `GET /process-types/{processTypeId}/history` → `200` con `{ items }` (`changedAt`, `changedBy`, `exchangeRate`, `previousValueUsd`, `newValueUsd`). No existe ningún endpoint de escritura sobre el historial.

### Escenario 5: Datos inválidos o nombre duplicado

- Dado que el nuevo nombre ya es de otro tipo de proceso, o algún precio o el tipo de cambio es inválido,
- Cuando el Administrativo Técnico confirma,
- Entonces el sistema señala el error en el campo y conserva los valores anteriores.
- **API:** `409 PROCESS_TYPE_NAME_TAKEN` para el nombre; `400 VALIDATION_ERROR` para precios inválidos o para un precio enviado sin `exchangeRate` ("Ingresá un tipo de cambio mayor a 0, con hasta dos decimales").

### Escenario 6: Sin cambios

- Dado que el Administrativo Técnico abrió la edición pero no cambió ningún valor,
- Cuando confirma,
- Entonces el formulario informa "No hay cambios para guardar" sin llamar a la API, y no se registra nada en el historial.
- **API:** el cliente compara antes de enviar. Si igual llega un `PATCH` sin cambios reales → `200` con el tipo de proceso tal como estaba, sin registro de historial y sin tocar `updatedAt` (D-31). Un cuerpo vacío `{}` → `400 VALIDATION_ERROR` ("Enviá al menos un campo para modificar.").

### Escenario 7: Usuario sin permiso

- Dado que el usuario no tiene el rol Administrativo Técnico ni Encargado de Cotización,
- Cuando intenta modificar un tipo de proceso,
- Entonces el sistema lo deniega con "No tenés permisos para realizar esta operación." y no modifica nada.
- **API:** `403 FORBIDDEN`. Sin sesión, `401` de sesión.

### Escenario 8: Cambio de nombre o descripción

- Dado que el Administrativo Técnico cambia solo el nombre o la descripción,
- Cuando confirma,
- Entonces el sistema guarda el cambio y actualiza "Última actualización",
  - Y no agrega ningún registro al historial, que es solo de precios.
- **API:** `PATCH` con `name` o `description` → `200`, `updatedAt` cambia, el historial no cambia (D-32, D-33). `description` en `null` o `""` la borra.

### Escenario 9: Tipo de proceso inexistente

- Dado que el tipo de proceso no existe (o el identificador de la URL no es un número),
- Cuando se intenta modificarlo o ver su historial,
- Entonces el sistema informa que no se encontró.
- **API:** `404 PROCESS_TYPE_NOT_FOUND`; identificador no entero → `400 INVALID_PATH_PARAMETER`.

## Reglas del contrato

- Todos los campos son opcionales, pero tiene que llegar al menos uno. Mismas restricciones que en el alta (nombre hasta 100, descripción hasta 500, montos mayores a 0 con hasta dos decimales).
- `exchangeRate` es obligatorio si llega alguno de los dos precios.
- El tipo de cambio solo se guarda junto con un cambio de precio: si llega `exchangeRate` y ningún precio cambia, se ignora (D-52).
- Un campo que llega con el mismo valor que ya tenía no cuenta como cambio.
- El historial no se puede modificar ni borrar por ningún rol (RNF10).
- El identificador del tipo nunca cambia, así que renombrarlo no rompe cotizaciones ni hojas de ruta.

## Fuera de alcance

La baja de tipos de proceso (CU-12) y el uso del precio en la cotización (CU-14).
