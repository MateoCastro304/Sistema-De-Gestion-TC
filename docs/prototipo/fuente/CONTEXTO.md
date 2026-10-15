# Castro Tornería — contexto del proyecto

Archivo de contexto permanente. Actualizarlo en cada cambio relevante (última actualización: 15/10/2026, Sprint 2 + ajustes de empleados, paneles, tipos de proceso y cotización).

## Qué es

Sistema interno de **Castro Tornería S.R.L.** (Córdoba, desde 1977). El estilo sigue la landing institucional de la empresa. Fuente de verdad del negocio: Casos de Uso, ERS y Modelo de Dominio V1.1 (en `uploads/`).

- Sprint 1 (cerrado): Proveedores, Encargados, Fábricas y Rubros.
- Sprint 2: sesión y roles, Empleados, Usuarios, Tipos de proceso, Materiales y Solicitudes de cotización.

## Archivo de trabajo

**`Castro Tornería - Prototipo.dc.html`** es el prototipo único, navegable y funcional. Todos los cambios se hacen sobre este archivo.

Los archivos `Sprint 1 - Estilo Landing*.dc.html`, `Menu Lateral.dc.html`, `Proveedores - Prototipos.dc.html`, `export/` y `entrega/` son la etapa anterior. Quedan como referencia histórica; no se editan. `prototipo/` es el paquete descargable (regenerado el 15/10/2026 con el Sprint 2): `fuente/` (dc.html, support.js, assets, CONTEXTO.md) + versión de un solo archivo.

## Cómo está armado

- Un solo `.dc.html`: plantilla con estilos inline + clase `Component` al final.
- Sesión: `state.sesion = { uid }` (null → pantalla de ingreso). `state.lg` guarda el formulario de ingreso y su aviso.
- Navegación por estado: `state.pantalla` = `solicitudes | clientes | gestion | administracion | encargados | fabricas | rubros | proveedores | materiales | tipos | empleados | usuarios | nuevo | detalle | cotizacion | inicio | denegado | 404 | error`.
  - `clientes`, `gestion` y `administracion` son paneles de tarjetas (`PANELES`). `PADRE` indica de qué ítem del menú cuelga cada pantalla (marca el menú y arma la miga de pan).
  - `cotizacion`: `state.cot = { solId, f, intento }`. `state.mp` = selector de materiales (buscador, agregar, editar).
  - `state.nuevo` = `prov | enc | fab | emp | usu | tp | sol`; `state.editId` = id del tipo de proceso cuando el formulario de `tp` se usa para modificar.
  - `state.det` = `{ t: 'prov'|'enc'|'fab'|'emp'|'usu'|'tp'|'sol', id }`.
  - Se recuerda pantalla y usuario en `localStorage` (`castro-prototipo-nav`).
- Permisos: `PERM` (módulo → roles). `puede(sec, roles)`; `home(roles)` = primer módulo permitido o `inicio`. Si no hay permiso, la pantalla efectiva pasa a `denegado`.
- Menú lateral (`NAV_G`): Cotizaciones (Solicitudes) · Catálogos (Clientes, Gestión) · Administración (Empleados, Usuarios). Solo muestra lo que el rol puede ver; las tarjetas de los paneles también se filtran por permiso.
- Datos de ejemplo en `semilla()`; viven en memoria (`state.d`: `rub, fab, enc, prov, emp, usu, ses, tp, mat, sol`). Al recargar vuelven a la semilla. Botón "Reiniciar datos" en la barra del prototipo.
- Formularios declarados como datos (`defsProv`, `defsEnc`, `defsFab`, `defsEmp`, `defsUsu`, `defsTp`, `defsSol`): `{ k, label, tipo, full, ph, futuro, max, upper, opciones, link, nota, ayuda, prefijo, pick }`. Secciones: `{ titulo, cols, aviso, campos }`.
  - `tipo`: `text | area | select | check | tipos | lock | fecha | money | pass | roles | rolesSel | pick | combo | archivos`. `campo()` los convierte para la plantilla. `pick` = buscador con tarjeta del elegido. `rolesSel` = desplegable de roles múltiples. `req` = asterisco. `digits` = solo números. `vinc` = precios vinculados del tipo de proceso (`setTp`).
  - Validaciones en `validar(tipo, valores, id, datos)`.
- Modal genérico: `this.abrir({ icon, tono:'rojo', titulo, pre/strong/post, items, datos, dcols, aviso, campos, cols, validar, fijo, okLabel, ok, cancelLabel, sinOk, visor })`. `datos` = grilla etiqueta/valor (resúmenes, cambios "anterior → nuevo"). `visor` = vista previa de foto o PDF simulado. En celular se muestra como panel inferior.
- Avisos (toast): `this.aviso(texto, 'ok'|'error'|'info')`.
- Celular (≤ 760px): cabecera con logo + menú desplegable (incluye usuario, roles y cerrar sesión), listados en tarjetas, formularios a una columna.
- Barra superior oscura "Prototipo": estados de listado (Normal / Cargando / Vacío / Error), pantallas 404 y Error, "Ingresar como…" (un usuario por rol, uno con dos roles y uno bloqueado), "Roles (n)" con sesión abierta (sumar/quitar roles en vivo; `state.sesion.roles` pisa los roles del usuario), "Simular sesión expirada", contraseña demo **Castro1977** y "Reiniciar datos".
- Solo prototipo, en el ingreso: "Ingresar con roles" (elegir varios; entra como wcastro con esos roles). Si al quitar un rol la pantalla actual queda sin permiso, vuelve al inicio del rol.

## Roles y permisos

Los permisos efectivos son la suma de los roles del usuario.

- Encargado de Recepción: Solicitudes (registra y consulta), Encargados, Fábricas, Rubros.
- Administrativo Técnico: Proveedores, Materiales, Tipos de proceso.
- Encargado de Cotización: lo del Administrativo Técnico + Solicitudes en solo lectura (ve "Cotizar", a futuro).
- Administrador del Sistema: Empleados, Usuarios.
- Jefe de Taller y Encargado de Reportes: pantalla de inicio "Todavía no hay módulos disponibles para tu rol".

Usuarios de ejemplo: wcastro (AS), mrios (ERP), fpaz (EC), lbenitez (AT), rsanchez (JT), gtorres (ER), dcastro (ERP + EC), hfunes (bloqueado), ogimenez (inactivo).

## Reglas de negocio presentes

Sprint 1
- Proveedor: varios tipos por registro (Material, Tercerizado, Repuesto, Pintura); al editar, el tipo no se modifica. Baja física, individual o múltiple, "no se puede deshacer".
- CUIT con formato XX-XXXXXXXX-X, opcional; no se repite.
- Encargado: baja lógica (queda inactivo, se puede reactivar). Email obligatorio y único dentro de la misma fábrica. La fábrica no se cambia al editar.
- Fábrica: sin encargados activos muestra el aviso de que no se podrán enviar informes de cotización.
- Rubro: no se elimina si alguna fábrica lo tiene asignado. Nombre de 3 caracteres como mínimo y sin repetir.

Sprint 2
- Ingreso (CU-53, RNF08): campo vacío se marca y no cuenta como intento. Datos incorrectos o usuario inactivo → "Usuario o contraseña incorrectos" (conserva el usuario, limpia la contraseña). Al 5.º intento fallido consecutivo se bloquea el usuario y se rechaza aunque la contraseña sea correcta. Sesión expira a los 30 min sin actividad.
- Cerrar sesión (CU-52): si hay datos sin guardar pide confirmación.
- Empleado: nombre, apellido, puesto (Administración, Jefe de taller, Jefe, Empleado) y DNI (7 u 8 números, no se repite) obligatorios; dirección, email (formato) y teléfono opcionales. Obligatorios con *. Baja lógica sin reactivación; si tiene usuario, se desactiva también (RN44).
- Usuario: tarjeta propia dentro de Administración, junto a Empleados. Un empleado activo tiene como máximo un usuario. Nombre de usuario obligatorio y único (se propone inicial + apellido). Contraseña de 8 caracteres como mínimo + Repetir contraseña (tienen que coincidir; error en línea), con "Generar". Permisos: desplegable con los roles del sistema, al menos uno, se pueden elegir varios. Las contraseñas no se muestran. Último acceso = última sesión.
- Tipo de proceso: nombre obligatorio y único; precio hora en pesos y en dólares vinculados por el tipo de cambio (ARS → USD = ARS / TC; USD → ARS = USD × TC; dos decimales). Tipo de cambio precargado con la cotización del backend (`TC`, simulado: $ 1.385,50 al 15/10/2026 09:30), editable; al cambiarlo se mantiene el precio en pesos y se recalcula el de dólares. "Restablecer cotización actual". Al modificar: modal con "anterior → nuevo", "No hay cambios para guardar" si no cambió nada. Historial (fecha y hora, usuario, campo, anterior, nuevo), no editable.
- Material: nombre (combo con los existentes o nuevo) + calidad, ambos obligatorios; la combinación no se repite. Sin precio, proveedor ni presentación en el catálogo.
- Cotización (CU-14, próximo sprint): se entra con "Cotizar" desde el detalle de la solicitud (solo EC). Datos generales (fecha, moneda, valor del dólar, validez en días → vencimiento, observaciones), pieza individual (plano, N.º de plano, descripción, cantidad), material (selector con buscador, "Agregar material" y "Editar"; presentación, proveedor, kg, costo por kg) y procesos propios (tipo, horas, costo hora del tipo de proceso). Resumen con precio unitario y total. Conjunto, Reparación, tercerizados, repuestos, tratamientos y pintura: "A futuro". Confirmar muestra el resumen pero no guarda.
- Solicitud de cotización (CU-13): cliente = encargado activo; fecha (hoy por defecto, no futura); N.º de pedido opcional; descripción obligatoria; documentación en 4 grupos (PDF de la solicitud, Planos PDF/DWG, Fotos JPG/PNG, Diseños 3D STEP/STP/SLDPRT), máximo 50 MB por archivo, al menos un plano, foto o 3D. Formato no permitido → error en el grupo, se conserva lo demás. "Confirmar" muestra resumen y al registrar crea la cotización "Pendiente de cotización". Se identifica como "Solicitud #N". Sin editar ni borrar.

## Etiqueta "A futuro" (se ve, todavía no funciona)

WhatsApp y Observaciones del encargado, Código de fábrica, "+ Nuevo rubro" dentro de la fábrica, Cambiar contraseña (CU-54), Modificar y Dar de baja usuario (CU-06, CU-08), registro real de la Cotización (CU-14) y sus partes Conjunto, Reparación, tercerizados, repuestos, tratamientos y pintura.

## Estilo

Montserrat. Marino `#172645` (menú, títulos), botón `#0f3483`, acento `#3b5998`, suave `#eef1f7`, texto `#555b66`, fondo `#fcfcfc`, peligro `#b3261e`, verde `#1f7a45`/`#e6f4ec`. Títulos en mayúsculas 800 con línea de 50×3px. Menú lateral azul con muesca en el ítem activo, colapsable y agrupado. Íconos de trazo 20×20 en `IC` (solicitud, material, tipo de proceso, empleado, usuario, rol, archivos por tipo). Fotos del taller en `assets/`.
