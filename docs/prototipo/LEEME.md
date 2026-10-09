# Prototipo Sprint 1 · Castro Tornería

## Qué hay

- `Prototipo Sprint 1 (un solo archivo).html` — abre con doble clic, sin internet (salvo la fuente Montserrat de Google Fonts). Es para mostrar.
- `fuente/` — el código para extraer:
  - `Sprint 1 - Prototipo.dc.html` — todas las pantallas: Estilo base y Componentes, Proveedores (P1–P6), Encargados (E1–E3b), Fábricas (F1–F4), Rubros (R1–R3) y Sistema (404 y error). HTML con estilos en línea + la lógica (clase JS al final del archivo: datos de ejemplo, selección, modos editar/eliminar, modales).
  - `Menu Lateral.dc.html` — el menú lateral con la muesca (props `active`: encargados | fabricas | rubros | proveedores, `collapsed`).
- Los elementos con la etiqueta amarilla **A futuro** todavía no los soporta el sistema: WhatsApp y Observaciones del encargado, Código de fábrica y “+ Nuevo rubro” dentro del formulario de fábrica.
  - `support.js` — motor que hace funcionar los `.dc.html`. Para verlos, servir la carpeta (ej. `npx serve fuente`) y abrir el `.dc.html`; con doble clic el navegador bloquea las imágenes y el menú.
  - `assets/` — logo (azul y blanco, PNG transparente) y fotos del taller.

## Tokens

| Uso | Valor |
|---|---|
| Marino (menú, cabeceras, títulos) | `#172645` |
| Botón principal | `#0f3483` · hover `#0b2766` |
| Acento (línea bajo títulos, activo) | `#3b5998` |
| Secundario suave (botones claros, etiquetas) | `#eef1f7` · hover `#e1e7f2` |
| Texto | `#555b66` · etiquetas `#8a909c` |
| Fondo | `#fcfcfc` · tarjetas `#ffffff` |
| Bordes de campos | `#e1e5ec` (1.5px) · foco `#0f3483` + halo `rgba(15,52,131,.12)` |
| Peligro | `#b3261e` · fondo `#fbe9e7` |
| WhatsApp | texto `#1f7a45` · fondo `#e6f4ec` |
| Radios | botones/campos 6px · tarjetas 8px · etiquetas 4px |
| Fuente | Montserrat 400/500/600/700/800 |

## Patrones

- **Título de sección:** Montserrat 800 mayúsculas + línea `50×3px #3b5998` debajo.
- **Cabecera de catálogo:** fondo `#172645`, puntos `radial-gradient(rgba(255,255,255,.07) 1px, transparent 1px) 22px`, foto a la derecha con degradé hacia el marino.
- **Barra de búsqueda:** tarjeta blanca que se monta 48px sobre la cabecera.
- **Botones:** principal azul con sombra; secundario relleno `#eef1f7` sin borde; todos en mayúsculas 14px 700.
- **Filas:** al pasar el mouse, fondo `#f6f8fc` + franja izquierda `inset 4px 0 0 #3b5998`.
- **Casilleros:** 34×34px, radio 6px; marcado `#0f3483` con ✓ blanco. Toda la fila es área táctil.
- **Íconos por entidad:** Proveedores (según tipo: Material barras, Repuesto tuerca, Pintura rodillo, Tercerizado camión), Fábricas (fábrica), Encargados (persona), Rubros (etiqueta). Los `path` SVG están en la lógica (`TIPO_ICON`) y en `Menu Lateral.dc.html` (`ITEMS`).
- **Tacho:** SVG con tapa (`g.lid`) que rota −22° al pasar el mouse; CSS en el `<style>` del encabezado.
- **Animaciones:** `fadeUp` (entrada), `lineGrow` (línea de títulos), `toastIn`, `popIn` (modal), `slideIn` (cajón celular). Keyframes en el `<style>` del encabezado.
