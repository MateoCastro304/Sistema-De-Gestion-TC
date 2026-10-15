# 03 · Requerimientos funcionales y no funcionales

> Fuente: ERS V1.1 §3.2 y §3.3. Los RF detallados reciben ID `RFxx.y` (nuevo en este SDD) y se vinculan al caso de uso que los realiza.
> Prioridad (MoSCoW): **M** = Must, **S** = Should. `⚠️ SUPUESTO`: la prioridad la asignó el analista según la categoría del CU (esencial → M); validar.

---

## Parte 1 — Requerimientos funcionales

**Cobertura:** 11 RF globales · 63 RF detallados · todos tienen al menos un CU.

### RF01 · Administrar Fábricas y Encargados (clientes)

| ID | Requerimiento detallado | CU | Actor | Prio |
|---|---|---|---|---|
| RF01.1 | Registrar Fábrica | CU-58 | ERP | M |
| RF01.2 | Consultar Fábricas | CU-60 | ERP | M |
| RF01.3 | Modificar Fábrica | CU-59 | ERP | M |
| RF01.4 | Registrar Baja de Fábrica (lógica) | CU-61 | ERP | M |
| RF01.5 | Registrar Cliente (Encargado) | CU-01 | ERP | M |
| RF01.6 | Consultar Cliente (Encargado) | CU-03 | ERP | M |
| RF01.7 | Modificar Cliente (Encargado) | CU-02 | ERP | M |
| RF01.8 | Registrar Baja de Cliente (Encargado) (lógica) | CU-04 | ERP | M |

Reglas: RN01, RN02.

### RF02 · Administrar Usuarios y Roles (con restricción de acceso según rol)

| ID | Requerimiento detallado | CU | Actor | Prio |
|---|---|---|---|---|
| RF02.1 | Registrar Usuario (para un empleado existente, con uno o varios roles) | CU-05 | AS | M |
| RF02.2 | Consultar Usuario | CU-07 | AS | M |
| RF02.3 | Modificar Usuario (datos, roles, restablecer contraseña) | CU-06 | AS | M |
| RF02.4 | Registrar Baja de Usuario (lógica) | CU-08 | AS | M |
| RF02.5 | Iniciar Sesión | CU-53 | US | M |
| RF02.6 | Cerrar Sesión | CU-52 | US | M |
| RF02.7 | Cambiar Contraseña (propia) | CU-54 | US | M |

Reglas: RN44. RNF: RNF08, RNF09.
> Los **roles son un catálogo cerrado** (RN44): "Administrar Roles" significa **asignar** roles a usuarios, no hacer ABM de roles.

### RF03 · Administrar Tipos de Procesos (precio hora en pesos y dólares; ante variaciones cambiarias solo se actualiza el valor en dólares)

| ID | Requerimiento detallado | CU | Actor | Prio |
|---|---|---|---|---|
| RF03.1 | Registrar Tipo de Proceso | CU-09 | AT (EC por herencia) | M |
| RF03.2 | Consultar Tipo de Proceso | CU-11 | AT | M |
| RF03.3 | Modificar Tipo de Proceso (incluye la variación del precio hora en el tiempo) | CU-10 | AT | M |
| RF03.4 | Registrar Baja de Tipo de Proceso (lógica) | CU-12 | AT | M |

Reglas: RN16, RN17, RN18.

### RF04 · Administrar Empleados

| ID | Requerimiento detallado | CU | Actor | Prio |
|---|---|---|---|---|
| RF04.1 | Registrar Empleado (con o sin usuario) | CU-45 | AS | M |
| RF04.2 | Consultar Empleados | CU-47 | AS | M |
| RF04.3 | Modificar Empleado | CU-46 | AS | M |
| RF04.4 | Registrar Baja de Empleado (lógica; **desactiva su usuario automáticamente**) | CU-48 | AS | M |

Reglas: RN44.

### RF05 · Administrar Proveedores

| ID | Requerimiento detallado | CU | Actor | Prio |
|---|---|---|---|---|
| RF05.1 | Registrar Proveedor | CU-33 | AT (EC por herencia) | M |
| RF05.2 | Consultar Proveedor | CU-35 | AT | M |
| RF05.3 | Modificar Proveedor | CU-34 | AT | M |
| RF05.4 | Registrar Baja de Proveedor (lógica) | CU-36 | AT | M |

Reglas: RN15.

### RF06 · Administrar Materiales

| ID | Requerimiento detallado | CU | Actor | Prio |
|---|---|---|---|---|
| RF06.1 | Registrar Material | CU-37 | AT (EC por herencia) | M |
| RF06.2 | Consultar Materiales | CU-39 | AT | M |
| RF06.3 | Modificar Material | CU-38 | AT | M |
| RF06.4 | Registrar Baja de Material (lógica) | CU-40 | AT | M |

Reglas: RN13, RN14.

### RF07 · Administrar Rubros

| ID | Requerimiento detallado | CU | Actor | Prio |
|---|---|---|---|---|
| RF07.1 | Registrar Rubro | CU-41 | ERP | M |
| RF07.2 | Consultar Rubro | CU-43 | ERP | M |
| RF07.3 | Modificar Rubro | CU-42 | ERP | M |
| RF07.4 | Registrar Baja de Rubro (lógica) | CU-44 | ERP | M |

Reglas: RN01 (rubro «Particular»).

### RF08 · Gestionar Solicitudes de Cotización y Cotizaciones

| ID | Requerimiento detallado | CU | Actor | Prio |
|---|---|---|---|---|
| RF08.1 | Registrar Solicitud de Cotización, con documentación adjunta (PDF, planos, fotos de pieza patrón, diseño 3D) | CU-13 | ERP | M |
| RF08.2 | Registrar Cotización (datos generales y cotización secuencial de ítems) | CU-14 | EC | M |
| RF08.3 | Generar Cotización a partir de una Cotización Anterior (precarga procesos y costos modificables) | CU-17 | EC | M |
| RF08.4 | Modificar Cotización (solo en `Borrador` o `Cotizado`: descuentos, señas, datos generales, piezas, materiales, procesos, proveedores y cantidades; todo cambio va al historial) `🔁 D-04` | CU-18 | EC | M |
| RF08.5 | Generar Informe de Cotización (PDF con formato propio) | CU-20 | EC | M |
| RF08.6 | Enviar Informe de Cotización (mail o WhatsApp) | CU-21 | EC + SC/SM | M |
| RF08.7 | Verificar Validez de Oferta (automático: `Cotizado` con plazo vencido → `Vencido`) | CU-22 | Temporizador | M |
| RF08.8 | Guardar Cotización como Borrador (retomar sin perder lo cargado) | CU-14 (A1, A18) | EC | M |

Reglas: RN03–RN12, RN19–RN33.

### RF09 · Consultar Historial

| ID | Requerimiento detallado | CU | Actor | Prio |
|---|---|---|---|---|
| RF09.1 | Consultar Historial de Cotizaciones de una Pieza (por nº de plano: fecha, adjudicación, dólar del momento, desvío, observaciones, acceso a hoja de ruta) | CU-16 | EC | M |
| RF09.2 | Consultar Cotizaciones (por cliente, fábrica, nº de plano, estado, responsable, descripción y rango de fechas) | CU-15 | EC | M |
| RF09.3 | Consultar Historial de Compras a Proveedores (material, calidad, presentación, cantidad, precio unitario, fecha; filtros por proveedor, material y fechas) | CU-55 | AT / EC | S |
| RF09.4 | Consultar Historial de Cotizaciones por Fábrica | CU-15 (filtro por fábrica) | EC | S |
| RF09.5 | Consultar Trabajos Realizados (por fábrica, material, descripción; acceso a cotización de origen, hoja de ruta y desvíos) `🔁 D-03`: también accesible para el JT **sin datos económicos** | CU-56 | ER, JT | S |

Reglas: RN08, RN42, RN43.

### RF10 · Gestionar Trabajos Adjudicados

| ID | Requerimiento detallado | CU | Actor | Prio |
|---|---|---|---|---|
| RF10.1 | Registrar Orden de Compra (aprobación total o parcial; **congela el precio en cada OT** `🔁 D-02`; genera una OT por ítem adjudicado) | CU-23 | ERP | M |
| RF10.2 | Consultar Órdenes de Trabajo (**no facturadas** `🔁 D-03`; filtros por estado y descripción) | CU-19 | JT | M |
| RF10.3 | Registrar Compra de Material (permite cambiar proveedor o material respecto de lo cotizado; registra precio real total; OT → `MaterialPedido`) | CU-25 | JT | M |
| RF10.4 | Registrar Recepción de Material (OT → `PteConstruccion`) | CU-26 | JT | M |
| RF10.5 | Registrar Inicio de Construcción (OT → `EnConstruccion`; genera la hoja de ruta con los procesos planificados) | CU-27 | JT | M |
| RF10.6 | Modificar Hoja de Ruta (cambia procesos sin modificar el precio; queda en el historial) | CU-28 | JT | M |
| RF10.7 | Registrar Finalización de Trabajo (OT → `Finalizado`; carga la hoja de ruta completa y el material real; calcula desvíos) | CU-30 | JT | M |
| RF10.8 | Registrar Entrega de Trabajo (OT → `Entregado`; nº de remito; admite entrega parcial) | CU-31 | ERP | M |
| RF10.9 | Registrar Facturación de Trabajo (OT → `Facturado`; nº de factura; admite facturación parcial; cierra el ciclo) | CU-32 | ERP | M |
| RF10.10 | Validar Plazo de Entrega (automático, diario: marca demorados sin cambiar el estado) | CU-29 | Temporizador | M |
| RF10.11 | Registrar Cancelación de Trabajo (excepcional, con motivo, solo antes de `Finalizado`) | CU-24 | JT | M |

Reglas: RN33–RN41, RN43.

### RF11 · Generar Reportes y Estadísticas

| ID | Requerimiento detallado | CU | Actor | Prio |
|---|---|---|---|---|
| RF11.1 | Generar Reporte Mensual de Facturación (total facturado por cliente en un mes) | CU-49 | ER | S |
| RF11.2 | Generar Reporte Anual de Facturación por Rubro (total facturado por rubro en un año) | CU-50 | ER | S |
| RF11.3 | Generar Estadísticas de Desvíos de Cotizaciones (desvío promedio de cotizaciones adjudicadas y entregadas; filtros por mes, cliente y EC; compara tiempo real vs. planificado por proceso, material comprado vs. planificado y precio hora real) | CU-51 | ER | S |
| RF11.4 | Generar Estadística de Efectividad de Adjudicación (cotizaciones adjudicadas / cotizaciones emitidas; filtros por período, cliente y EC) | CU-57 | ER | S |

Reglas: RN40, RN41. RNF: RNF06, RNF17.

**Fórmula de efectividad (RF11.4):**
```
efectividad = #cotizaciones{Adjudicado, AdjudicadoParcial} / #cotizaciones emitidas{Cotizado, Vencido, Adjudicado, AdjudicadoParcial}
```
`⚠️ SUPUESTO` Las cotizaciones en `PteCotizacion` y `Borrador` no cuentan como "emitidas".

---

## Parte 2 — Requerimientos no funcionales

> Organizados según ISO/IEC 25010. Clasificación Sommerville: **P** = de producto, **O** = de la organización, **E** = externo. **Arq.** = significativo para la arquitectura (SÍ/NO).

### Resumen

| ID | Característica | Título | Clas. | Arq. |
|---|---|---|---|---|
| RNF01 | Usabilidad | Carga guiada y secuencial de la cotización | P | NO |
| RNF02 | Usabilidad | Facilidad de aprendizaje y lenguaje del dominio | P | NO |
| RNF03 | Usabilidad | Prevención de errores y retroalimentación | P | NO |
| RNF04 | Usabilidad | Hoja de ruta imprimible y legible en taller | P | NO |
| RNF05 | Eficiencia | Tiempo de respuesta de operaciones habituales | P | SÍ |
| RNF06 | Eficiencia | Generación de informes y reportes | P | SÍ |
| RNF07 | Eficiencia | Capacidad y utilización de recursos | P / O | SÍ |
| RNF08 | Seguridad | Autenticación y gestión de sesiones | P | SÍ |
| RNF09 | Seguridad | Control de acceso por rol y confidencialidad | P | SÍ |
| RNF10 | Seguridad | Trazabilidad de cambios y no repudio | P | SÍ |
| RNF11 | Seguridad | Integridad y exactitud de la información | P | SÍ |
| RNF12 | Confiabilidad | Disponibilidad en horario operativo | P / O | SÍ |
| RNF13 | Confiabilidad | Tolerancia a fallos y preservación del trabajo en curso | P | SÍ |
| RNF14 | Confiabilidad | Copias de seguridad y recuperación | O | SÍ |
| RNF15 | Mantenibilidad | Parametrización sin intervención del desarrollador | P | SÍ |
| RNF16 | Mantenibilidad | Modularidad y capacidad de ser probado | O | SÍ |
| RNF17 | Compatibilidad | Formatos de archivo y salidas interoperables | P | NO |
| RNF18 | Portabilidad | Entorno de ejecución e instalación | O | SÍ |
| RNF19 | Compatibilidad | Integración con correo electrónico | E | SÍ |
| RNF20 | Compatibilidad | Integración con WhatsApp | E | SÍ |
| RNF21 | Confiabilidad | Tolerancia a fallos y trazabilidad de envíos | P | SÍ |

`⚠️ SUPUESTO` Las columnas Clas. y Arq. las asignó el analista; la ERS V1.1 no las incluye.

### Detalle

#### RNF01 · Usabilidad — Carga guiada y secuencial de la cotización
- **Requisito:** el sistema guía al EC en la carga de cada ítem en este orden: tipo de trabajo → material → procesos propios → tercerizados → tratamientos superficiales → repuestos.
  - Al terminar cada ítem pregunta si requiere tercerizaciones (RN21) y si se quiere agregar otro ítem.
  - Muestra **siempre el subtotal acumulado**.
  - Permite **volver a un ítem ya cargado sin perder información**.
- **Verificación:** prueba de aceptación sobre CU-14 (curso normal + A15) comprobando la secuencia, el subtotal visible en cada paso y la edición de un ítem previo sin pérdida.

#### RNF02 · Usabilidad — Facilidad de aprendizaje y lenguaje del dominio
- **Requisito:**
  - La interfaz usa la terminología del negocio (número de plano, ítem, hoja de ruta, adjudicación, seña, desvío).
  - Navegación y disposición de acciones uniformes en todas las pantallas.
  - Un usuario administrativo nuevo registra una solicitud y consulta el historial de una pieza **tras ≤ 30 min de capacitación**, solo con el manual de usuario.
- **Verificación:** prueba con usuario nuevo cronometrada.

#### RNF03 · Usabilidad — Prevención de errores y retroalimentación
- **Requisito:**
  - Valida los datos al ingresarlos: obligatorios, numéricos positivos, fechas coherentes, cantidades y costos.
  - Impide avanzar con información incompleta.
  - Pide **confirmación explícita** antes de operaciones no reversibles: cancelar un trabajo, dar de baja una entidad, cambiar el estado de una OT.
  - Los mensajes de error están en el lenguaje del usuario e indican la causa y la acción correctiva, sin códigos ni detalles técnicos.
- **Verificación:** casos negativos por cada validación; revisión de mensajes.

#### RNF04 · Usabilidad — Hoja de ruta imprimible
- **Requisito:**
  - La hoja de ruta se imprime en **A4, blanco y negro**, legible en el taller.
  - Muestra destacados el nº de OT, la pieza y su nº de plano.
  - Tiene espacios diferenciados para escribir a mano: responsables, tiempos reales, material usado y observaciones.
  - `🔁 D-01` No incluye costos ni precios hora.
- **Verificación:** impresión de prueba revisada por el JT.

#### RNF05 · Eficiencia — Tiempo de respuesta
- **Requisito:** en operación normal:
  - Altas, bajas, modificaciones y consultas simples: **≤ 3 s**.
  - Búsqueda de antecedentes por nº de plano sobre todo el historial: **≤ 5 s**.
- **Verificación:** medición con datos de volumen equivalente a 5 años (RNF07).

#### RNF06 · Eficiencia — Informes y reportes
- **Requisito:**
  - Informe de cotización en PDF, con diseño propio (independiente del formato del cliente): **≤ 10 s**.
  - Reportes de facturación, desvíos y efectividad para un rango de hasta 1 año: **≤ 20 s**.
- **Verificación:** medición con datos de volumen.

#### RNF07 · Eficiencia — Capacidad y recursos
- **Requisito:**
  - **≥ 10 usuarios concurrentes**.
  - Historial mínimo de **5 años** de cotizaciones, OTs y documentación.
  - Adjuntos de hasta **50 MB por archivo**.
  - Todo lo anterior sin degradar RNF05.
  - Funciona en el equipamiento actual de la empresa, sin hardware adicional.
- **Verificación:** prueba de carga liviana; subida de un archivo de 50 MB.

#### RNF08 · Seguridad — Autenticación y sesiones
- **Requisito:**
  - Usuario y contraseña personales e intransferibles.
  - Contraseñas **cifradas (hash)**, nunca en texto plano; **mínimo 8 caracteres**.
  - **Bloqueo tras 5 intentos fallidos consecutivos**.
  - **Cierre automático de sesión tras 30 min de inactividad**.
- **Verificación:** tests de integración de login, bloqueo y expiración.

#### RNF09 · Seguridad — Control de acceso por rol y confidencialidad `🔁 D-01` `🔁 D-03`
- **Requisito:**
  - El sistema restringe la información visible y las operaciones según el rol (ver `07-matriz-rbac.md`).
  - El JT:
    - ve en la consulta operativa **solo trabajos adjudicados no facturados**, y tiene una página de historial con todas las OTs;
    - registra horas y ejecución de procesos;
    - **del dinero solo ve los precios de materiales**; no accede a precios hora, costos de procesos, precios pactados o finales, descuentos, márgenes ni desvíos económicos.
  - La información interna (costos, márgenes, horas reales, desvíos) se mantiene separada de la información para el cliente (precio final, plazo, condición de pago).
  - Planos y diseños 3D del cliente solo son accesibles para usuarios autenticados y autorizados.
  - **El filtrado se hace en el backend**: las respuestas de la API para un rol no incluyen campos prohibidos para ese rol.
- **Verificación:** por cada endpoint × rol de la matriz, test de integración que afirme el código HTTP **y la ausencia de las claves prohibidas en el cuerpo de la respuesta**.

#### RNF10 · Seguridad — Trazabilidad y no repudio
- **Requisito:**
  - Toda modificación sobre cotizaciones, precios de piezas, precios hora de tipos de proceso, hojas de ruta y estados de OT se registra con: **usuario, fecha y hora, valor anterior y valor nuevo**.
  - Ningún rol puede modificar ni eliminar esos registros.
- **Verificación:** por cada operación, test que verifique la entrada en `HistorialCambio` con el usuario autenticado; test de que no existe operación de edición o borrado del historial.

#### RNF11 · Seguridad — Integridad y exactitud
- **Requisito:**
  - Las operaciones sobre varias entidades son **atómicas** (todo o nada): adjudicar con generación de OTs, registrar la hoja de ruta completa, cambios de estado.
  - Se impide modificar el precio de una cotización adjudicada (RN34).
  - Los cálculos monetarios se hacen con **2 decimales**, respetando el dólar registrado al cotizar.
- **Verificación:** test de rollback ante fallo intermedio; test de rechazo de la modificación del precio pactado; tests unitarios de redondeo.

#### RNF12 · Confiabilidad — Disponibilidad
- **Requisito:**
  - Disponibilidad **≥ 98 % mensual** dentro del horario laboral.
  - Mantenimiento, actualizaciones y backups con corte de servicio, **fuera del horario laboral**.
- **Verificación:** monitoreo de uptime.

#### RNF13 · Confiabilidad — Tolerancia a fallos
- **Requisito:**
  - Ante un error no controlado, **no se cierra la sesión ni se pierde la cotización u hoja de ruta en curso**; se informa en forma comprensible y se permite reintentar.
  - Todo error se registra en un log con fecha, hora, usuario y descripción.
- **Verificación:** inyección de fallo durante CU-14 y CU-30.

#### RNF14 · Confiabilidad — Backups y recuperación
- **Requisito:**
  - Backup automático **diario** de la base de datos y de los adjuntos, conservando **≥ 15 copias**.
  - **RPO ≤ 24 h** (pérdida máxima de datos); **RTO ≤ 4 h hábiles** (tiempo de restablecimiento).
- **Verificación:** simulacro de restauración.

#### RNF15 · Mantenibilidad — Parametrización
- **Requisito:** un usuario autorizado administra desde el sistema, **sin tocar código ni reinstalar**:
  - tipos de proceso y precios hora en $ y USD;
  - valor del dólar;
  - tipos de proveedor;
  - rubros;
  - presentaciones y unidades de medida de materiales;
  - plazo de validez de las cotizaciones;
  - porcentajes de descuento y seña.
- **Verificación:** cambiar cada parámetro desde la UI y verificar su efecto.
- `⚠️ SUPUESTO` Presentaciones, unidades de medida y tipos de proveedor no tienen CU de ABM (en el modelo son atributos o un catálogo); definir si se administran como enumerados configurables.

#### RNF16 · Mantenibilidad — Modularidad y testabilidad
- **Requisito:**
  - Separación en capas: interfaz, lógica de negocio y acceso a datos.
  - Las reglas de cálculo (costos, descuentos, señas, conversión de moneda, desvíos: RN14, RN18, RN20, RN22–RN28, RN40) van en **componentes independientes con pruebas automatizadas**.
- **Verificación:** cobertura de tests unitarios sobre esas reglas en CI.

#### RNF17 · Compatibilidad — Formatos de archivo
- **Requisito:**
  - Adjuntar, guardar y descargar **sin alteración**: PDF, DWG, JPG/PNG, SolidWorks (SLDPRT) y STEP/STP.
  - Informe de cotización en **PDF**.
  - Exportación de reportes a **XLSX o CSV**.
- **Verificación:** comparar el hash del archivo subido con el descargado; exportar cada reporte.

#### RNF18 · Portabilidad — Entorno de ejecución
- **Requisito:**
  - Funciona en **Windows 10+** con **Chrome o Edge** vigentes, sin complementos.
  - La instalación y la inicialización de la base de datos se hacen con un procedimiento documentado en **≤ 1 jornada laboral**.
- **Verificación:** prueba en ambos navegadores; ensayo de instalación.

#### RNF19 · Compatibilidad — Correo electrónico
- **Requisito:**
  - Envío del informe como **PDF adjunto** por un servidor externo, con **SMTP autenticado + TLS**, desde una cuenta institucional.
  - Destinatario precargado con el mail del encargado cliente.
  - Asunto con el nº de cotización.
  - Cuerpo con texto predefinido, editable antes de enviar.
- **Verificación:** envío de prueba a un servidor SMTP de test.

#### RNF20 · Compatibilidad — WhatsApp
- **Requisito:**
  - Envío **solo mediante la API oficial de WhatsApp Business (Meta)**; prohibido automatizar WhatsApp Web o usar apps no oficiales.
  - Se envía como **mensaje de documento PDF** al teléfono del encargado cliente.
  - Fuera de la ventana de 24 h desde el último mensaje del cliente, solo con **plantilla aprobada por Meta** y a contactos que hayan aceptado recibir mensajes (opt-in).
- **Verificación:** envío dentro y fuera de la ventana de 24 h en el entorno de pruebas de Meta.

#### RNF21 · Confiabilidad — Tolerancia a fallos y trazabilidad de envíos
- **Requisito:**
  - Si el correo o WhatsApp fallan o rechazan el envío, **no se bloquea la operación ni se pierde la cotización o el informe**; se informa el error y se permite reintentar.
  - El resultado se confirma al usuario en **≤ 30 s**.
  - Cada envío se registra con canal, destinatario, fecha y hora, usuario y resultado (enviado o fallido), consultable desde la cotización.
  - Las credenciales de ambos servicios se guardan **cifradas** y las administra el AS sin tocar código.
- **Verificación:** simular un servicio caído; verificar el registro y el reintento.
- `⚠️ SUPUESTO` El modelo de dominio no tiene una clase para el registro de envíos; hace falta una entidad del tipo `EnvioInforme` (canal, destinatario, fechaHora, usuario, resultado) en el `schema.prisma`.
