# Castro Tornería — contexto del proyecto

Archivo de contexto permanente. Actualizarlo en cada cambio relevante (última actualización: 08/10/2026).

## Qué es

Sistema interno de **Castro Tornería S.R.L.** (Córdoba, desde 1977). Sprint 1: catálogos de **Proveedores, Encargados, Fábricas y Rubros**. El estilo sigue la landing institucional de la empresa.

## Archivo de trabajo

**`Castro Tornería - Prototipo.dc.html`** es el prototipo único, navegable y funcional. Todos los cambios se hacen sobre este archivo.

Los archivos `Sprint 1 - Estilo Landing*.dc.html`, `Menu Lateral.dc.html`, `Proveedores - Prototipos.dc.html`, `export/` y `entrega/` son la etapa anterior (lienzo con pantallas sueltas). Quedan como referencia histórica; no se editan.

## Cómo está armado

- Un solo `.dc.html`: plantilla con estilos inline + clase `Component` al final.
- Navegación por estado: `state.pantalla` = `proveedores | encargados | fabricas | rubros | nuevo | detalle | 404 | error`. `state.nuevo` = `prov | enc | fab`; `state.det` = `{ t: 'prov'|'enc'|'fab', id }`. Se recuerda la pantalla en `localStorage` (`castro-prototipo-nav`).
- Datos de ejemplo en `semilla()`; viven en memoria (`state.d`). Altas, ediciones y bajas funcionan de verdad mientras la página está abierta; al recargar vuelven a la semilla. Botón "Reiniciar datos" en la barra del prototipo.
- Formularios declarados como datos (`defsProv`, `defsEnc`, `defsFab`): `{ k, label, tipo, full, ph, futuro, max, upper, opciones, link, nota }`. `tipo`: `text | area | select | check | tipos | lock`. `campo()` los convierte para la plantilla. Validaciones en `validar(tipo, valores, id, datos)`.
- Modal genérico: `this.abrir({ icon, tono:'rojo', titulo, pre/strong/post, items, aviso, campos, cols, validar, fijo, okLabel, ok })`. En celular se muestra como panel inferior.
- Avisos (toast): `this.aviso(texto, 'ok'|'error'|'info')`.
- Celular (≤ 760px): cabecera con logo + menú desplegable, listados en tarjetas, formularios a una columna.
- Barra superior oscura "Prototipo": fuerza estados de listado (Normal / Cargando / Vacío / Error) y abre las pantallas 404 y Error.

## Reglas de negocio presentes

- Proveedor: varios tipos por registro (Material, Tercerizado, Repuesto, Pintura); al editar, el tipo no se modifica. Baja física, individual o múltiple (modo eliminación con casilleros), "no se puede deshacer".
- CUIT con formato XX-XXXXXXXX-X, opcional; no se repite.
- Encargado: baja lógica (queda inactivo, se puede reactivar). Email obligatorio y único dentro de la misma fábrica. La fábrica no se cambia al editar.
- Fábrica: sin encargados activos muestra el aviso de que no se podrán enviar informes de cotización.
- Rubro: no se elimina si alguna fábrica lo tiene asignado. Nombre de 3 caracteres como mínimo y sin repetir.
- Etiqueta "A futuro" (aún no soportado): WhatsApp y Observaciones del encargado, Código de fábrica, "+ Nuevo rubro" dentro de la fábrica.

## Estilo

Montserrat. Marino `#172645` (menú, títulos), botón `#0f3483`, acento `#3b5998`, suave `#eef1f7`, texto `#555b66`, fondo `#fcfcfc`, peligro `#b3261e`, WhatsApp `#1f7a45`/`#e6f4ec`. Títulos en mayúsculas 800 con línea de 50×3px. Menú lateral azul con muesca en el ítem activo, colapsable. Íconos por entidad: proveedor según su primer tipo, fábrica, persona, etiqueta. Fotos del taller en `assets/`.
