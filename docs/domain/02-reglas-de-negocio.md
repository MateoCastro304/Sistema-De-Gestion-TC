# 02 · Reglas de negocio

> Fuente: ERS V1.1 §3.1 (RN01–RN44). Las reglas modificadas por decisiones posteriores llevan `🔁 D-xx` (ver [convenciones, §2.2](00-indice-y-convenciones.md#22-marcas-en-el-texto)).
>
> **Formato de cada regla**
> - **Tipo:** `Estructural` (define datos o relaciones) · `Restricción` (prohíbe o condiciona una operación) · `Cálculo` (fórmula) · `Disparador` (acción automática ante un evento o el tiempo) · `Acceso` (quién ve o hace qué).
> - **Trazabilidad:** dónde se implementa (CU, clases o estados). Toda RN tiene que estar implementada en al menos un lugar.

## Índice por tema

| Tema | Reglas |
|---|---|
| A. Clientes y solicitudes | RN01–RN03 |
| B. Cotización: identidad y composición | RN04–RN12 |
| C. Materiales, proveedores y mano de obra | RN13–RN22 |
| D. Cálculo del precio | RN23–RN29 |
| E. Informe y ciclo de la cotización | RN30–RN33 |
| F. Trabajo adjudicado (Orden de Trabajo) | RN34–RN41 |
| G. Confidencialidad y acceso | RN42–RN44 |

---

## A. Clientes y solicitudes

### RN01 — Identificación del cliente: fábrica y encargado
- **Tipo:** Estructural
- **Enunciado:** Todo pedido de cotización proviene de un **encargado** que pertenece a una **fábrica cliente**.
  - De la fábrica se registran: nombre, condición de persona física o jurídica, CUIT, dirección, rubro y forma de pago.
  - De cada encargado se registran: nombre, apellido, correo electrónico, teléfono y fábrica a la que pertenece.
  - Una fábrica puede tener varios encargados de distintas áreas.
  - Si el solicitante es un **particular**, se registra igualmente como encargado asociado a una fábrica cliente de rubro **«Particular»**.
- **Trazabilidad:** CU-01..04, CU-58..61 · `FabricaCliente`, `EncargadoCliente`, `Rubro`.

### RN02 — Formas de pago de la fábrica cliente
- **Tipo:** Estructural
- **Enunciado:** Cada fábrica cliente tiene **una o varias** formas de pago acordadas. Pueden variar en el tiempo, aunque habitualmente se mantienen. Deben estar disponibles al cotizar porque condicionan las condiciones comerciales del presupuesto.
- **Trazabilidad:** CU-58, CU-59, CU-14 · `FabricaCliente.formasPago`, `ItemCotizacion.condicionPago`.

### RN03 — Registro obligatorio de la solicitud de cotización
- **Tipo:** Restricción
- **Enunciado:** Toda solicitud de cotización recibida por correo o WhatsApp **debe registrarse** con:
  - fecha de solicitud, descripción breve y cliente solicitante;
  - documentación asociada: PDF de la solicitud, planos o fotos de la pieza patrón;
  - por pieza: cantidad requerida, descripción, material solicitado y, si el cliente lo informa, plazo de entrega requerido.

  Luego se deriva a un encargado de cotización. **Ningún trabajo puede ingresar a producción sin su registro administrativo previo.**
- **Trazabilidad:** CU-13 · `SolicitudCotizacion`.

---

## B. Cotización: identidad y composición

### RN04 — Datos mínimos de identificación de una cotización
- **Tipo:** Estructural / Restricción
- **Enunciado:** Toda cotización se identifica con:
  - fábrica y encargado cliente;
  - número de plano de las piezas a cotizar;
  - fecha de cotización y valor del dólar vigente a esa fecha;
  - número de pedido o nota de pedido del cliente;
  - **número de presupuesto correlativo interno**.
- **Trazabilidad:** CU-14 (paso 6: genera el número) · `Cotizacion.nroCotizacion`, `Cotizacion.precioDolar`, `SolicitudCotizacion.numeroPedidoCliente`.
- **Nota de implementación:** el número debe ser **único bajo concurrencia** (secuencia de base de datos, no `MAX(id)+1`).

### RN05 — Relación entre solicitud y cotizaciones
- **Tipo:** Estructural
- **Enunciado:** Una solicitud puede originar **más de una cotización**:
  - cuando tiene muchas piezas, que se reparten en varias cotizaciones elaboradas en paralelo;
  - cuando la oferta vence o el cliente pide revisar cantidades, materiales o procesos (**recotización**).

  Cada cotización conserva su propia identidad, fecha y valor del dólar.
- **Trazabilidad:** `SolicitudCotizacion 1 → 1..* Cotizacion` · CU-14, CU-17.

### RN06 — Identificación y documentación de la pieza
- **Tipo:** Estructural
- **Enunciado:** La pieza se identifica prioritariamente por el **número de plano** del cliente. Si no lo tiene, el sistema genera un **identificador interno secuencial** asociado a las iniciales o código de la fábrica (p. ej. `OC-001` para OxyCAM). Cada pieza tiene asociada su documentación técnica: plano PDF o AutoCAD, foto de la pieza patrón y diseño 3D (SolidWorks o STEP).
- **Trazabilidad:** CU-13, CU-14 · `Pieza.idPieza`, `Pieza.pdfPlano`, `Pieza.fotoPzaPatron`.

### RN07 — Variantes de un mismo plano
- **Tipo:** Restricción
- **Enunciado:** Aunque el número de plano sea el mismo, si la pieza presenta variaciones mínimas (distintas posiciones, equipos diferentes) **se trata como un registro distinto**, dejando registradas las diferencias en el historial.
- **Trazabilidad:** CU-14 · `Pieza`.

### RN08 — Reutilización de antecedentes de cotización
- **Tipo:** Derivación
- **Enunciado:** Al cotizar una pieza ya cotizada (mismo número de plano) se puede consultar su historial e **iniciar la nueva cotización a partir de una anterior**, con procesos y costos precargados y modificables. La consulta muestra:
  - número de plano y fecha de cotización;
  - cotización a la que perteneció;
  - si fue adjudicada o no;
  - valor del dólar de ese momento;
  - desvío de costo si el trabajo se realizó;
  - observaciones;
  - acceso a la hoja de ruta.
- **Trazabilidad:** CU-16, CU-17 · `Pieza 1 → 1..* ItemCotizacion`.

### RN09 — Composición de la cotización en ítems
- **Tipo:** Estructural
- **Enunciado:** Una cotización tiene **uno o más ítems**, que se cotizan de forma individual y secuencial y conforman un único informe. El ítem es la unidad que se presupuesta y que, si se adjudica, se fabrica. **Un ítem no existe fuera de su cotización.**
- **Trazabilidad:** CU-14 · `Cotizacion ◇ 1..* ItemCotizacion`.

### RN10 — Tipos de ítem
- **Tipo:** Estructural
- **Enunciado:** Cada ítem es de uno de tres tipos: **pieza individual**, **conjunto o ensamblaje**, o **reparación**. El tipo determina qué procesos son aplicables (armado y desarmado en reparaciones; ensamblaje y pintura general en conjuntos).
- **Trazabilidad:** CU-14 (paso 10, A3, A4) · `TipoItem`.

### RN11 — Estructura jerárquica de conjuntos y reparaciones
- **Tipo:** Estructural
- **Enunciado:** Un ítem de tipo conjunto o reparación se compone de otros ítems (**piezas hijas**), cada uno con su propio material y procesos. Además puede tener procesos propios del conjunto, que se ejecutan con las piezas ya ensambladas (ensamblaje, pintura general, tratamiento final). Una pieza hija **no existe fuera del conjunto** que la contiene en esa cotización. **La estructura admite cualquier profundidad.**
- **Trazabilidad:** CU-14 A3/A4 · `ItemCotizacion ◆ 0..* piezasHijas` (patrón Composite).

### RN12 — Composición económica del ítem
- **Tipo:** Estructural
- **Enunciado:** Cada ítem cotizado se compone de:
  - **un** material;
  - **uno o más** procesos planificados (propios, tercerizados o de pintura);
  - **cero o más** repuestos;
  - **opcionalmente** un descuento particular.

  Los datos técnicos principales son el material, la cantidad de piezas y, sobre todo, la mano de obra.
- **Trazabilidad:** `ItemCotizacion → 1 CompraDeMaterial`, `→ 1..* ProcesoPlanificado`, `→ 0..* Repuesto`, `→ 0..1 Descuento`.

---

## C. Materiales, proveedores y mano de obra

### RN13 — Clasificación del material
- **Tipo:** Estructural
- **Enunciado:** Los materiales se clasifican por **calidad** (p. ej. Acero 1010 o 1045) y por **presentación**, entendida como la forma en que se pide el material al proveedor: cilindro sólido, hexágono sólido, planchuela, caño, cortado por hilo o láser, entre otras.
- **Trazabilidad:** `Material.calidad`, `CompraDeMaterial.presentacion`.

### RN14 — Valorización y estimación del material
- **Tipo:** Cálculo
- **Enunciado:** El precio del material se establece **por kilogramo** en todas las presentaciones, **excepto caño o cilindro hueco, que se calcula por metro**. La cantidad a cotizar se estima según supuestos de trabajo: cantidad de piezas, sobrante previsto y forma de la presentación.
- **Fórmula:** `costoMaterial = cantidadMaterial × precioXUnidad`, donde `unidadMedida = metro` si la presentación ∈ {caño, cilindro hueco}; si no, `kg`.
- **Trazabilidad:** CU-14 (paso 18), CU-25 · `CompraDeMaterial.unidadMedida`.

### RN15 — Preselección y cambio de proveedor
- **Tipo:** Restricción
- **Enunciado:** Puede haber varios proveedores para un mismo material, servicio tercerizado o repuesto, con precios distintos. Al cotizar se **preselecciona** uno para cada caso. Una vez adjudicado el trabajo, el proveedor **puede cambiarse** (por disponibilidad, precio o plazo), dejando constancia en el historial.
- **Trazabilidad:** CU-14, CU-25, CU-28 · `HistorialCambio` (historialPieza).

### RN16 — Desglose de la mano de obra por proceso
- **Tipo:** Estructural
- **Enunciado:** Cada trabajo se descompone en procesos. Cada proceso tiene su propio costo de mano de obra, normalmente por hora, que **varía según el tipo de trabajo**: la hora de herrería (soldadura, pintura) no cuesta lo mismo que la de mecanizado manual (fresado, torneado) o la de mecanizado CNC.
- **Trazabilidad:** `ProcesoPropio → TipoProceso`.

### RN17 — Precio hora por tipo de proceso
- **Tipo:** Estructural / Restricción
- **Enunciado:** Cada tipo de proceso tiene un **costo por hora preestablecido** en un catálogo (p. ej. Mecanizado Torno Manual $1557/h, Mecanizado Torno CNC $2547/h). El sistema lo propone al cotizar y el EC puede:
  - **modificarlo en una cotización puntual**, sin afectar el catálogo; o
  - **actualizarlo en el catálogo** para todas las cotizaciones futuras.
- **Trazabilidad:** CU-09..12, CU-14 (pasos 22–23, A10) · `TipoProceso`, `ProcesoPropio.precioHora` (copia editable).

### RN18 — Actualización del precio hora por variación del dólar
- **Tipo:** Cálculo
- **Enunciado:** El precio hora de cada tipo de proceso se guarda **en pesos y en dólares**. Ante variaciones del tipo de cambio **se actualiza solo el valor en dólares**; el precio en pesos no cambia.
- **Fórmula:** `precioHoraBaseUSD = precioHoraBasePesos / valorDolarActual`.
- **Trazabilidad:** CU-10 · `TipoProceso.calcularPrecioUSD()`.

### RN19 — Procesos tercerizados
- **Tipo:** Estructural
- **Enunciado:** Algunos procesos se contratan a terceros: tratamientos superficiales (zincado, galvanizado), tratamientos térmicos, corte por hilo y pintura, entre otros. Para cada uno se registran tipo de proceso, proveedor, horas estimadas cuando corresponda y **costo total del servicio**.
- **Trazabilidad:** CU-14 (pasos 24–29) · `ProcesoTercerizado`.

### RN20 — Pintura como proceso mixto
- **Tipo:** Cálculo
- **Enunciado:** La pintura combina insumo y mano de obra. Se registran tipo de pintura, proveedor, precio por litro y litros, más costo por hora y horas estimadas de aplicación.
- **Fórmula:** `costoPintado = (cantidadLitros × costoXLitro) + (cantHorasEstimadas × precioHora)`.
- **Trazabilidad:** CU-14 (pasos 30–31) · `Pintado`.

### RN21 — Consulta obligatoria de tercerizaciones al cerrar cada ítem
- **Tipo:** Restricción (de interfaz)
- **Enunciado:** Al terminar de cargar cada ítem, el sistema **debe preguntar** si requiere tratamiento térmico, tratamiento superficial u otra tercerización, para no omitir costos de servicios externos.
- **Trazabilidad:** CU-14 (pasos 24, 28) · RNF01.

### RN22 — Repuestos adquiridos a terceros
- **Tipo:** Estructural / Cálculo
- **Enunciado:** Una pieza o conjunto puede requerir componentes que la empresa no fabrica (rodamientos, tornillos, retenes). Para cada repuesto se registran descripción, cantidad, proveedor y costo estimado por unidad. Su costo se suma al análisis económico y al precio final.
- **Fórmula:** `costoRepuesto = cantidad × precio`.
- **Trazabilidad:** CU-14 (pasos 26–27) · `Repuesto.calcularCostoTotal()`.

---

## D. Cálculo del precio

### RN23 — Subtotal de un ítem (pieza individual)
- **Tipo:** Cálculo
- **Enunciado y fórmula:**
  ```
  subtotalÍtem = costoMaterial
               + Σ(horas × costoHora)              [procesos propios]
               + Σ(costoServicio)                  [procesos tercerizados]
               + Σ(cantidad × precioUnitario)      [repuestos]
               + costoTratamientos                 [tratamientos superficiales + pintado]
  ```
- **Trazabilidad:** CU-14 (paso 34) · `ItemCotizacion.calcularSubtotal()`, `ProcesoPlanificado.calcularCostoEstimado()` (polimórfico).

### RN24 — Subtotal recursivo de conjuntos y reparaciones
- **Tipo:** Cálculo
- **Enunciado y fórmula:** El subtotal de un conjunto o reparación es la suma de los subtotales de sus piezas hijas más el costo de los procesos propios del conjunto. Se aplica **recursivamente, igual en cualquier profundidad**.
  ```
  subtotalÍtem = Σ(subtotalÍtemHija) + costoProcesosPropiosDelConjunto
  ```
- **Trazabilidad:** CU-14 A3/A4 · `ItemCotizacion.calcularSubtotal()` (Composite).

### RN25 — Precio final de la cotización
- **Tipo:** Cálculo
- **Enunciado y fórmula:**
  ```
  subtotalCotización = Σ(precioUnitarioÍtem × cantidadÍtem)   [ítems de primer nivel]
  precioFinal        = subtotalCotización − descuento
  ```
  El precio final es el que se comunica al cliente en el informe.
- **Trazabilidad:** CU-14 (paso 39), CU-18 · `Cotizacion.calcularPrecioFinal()`.

### RN26 — Descuentos generales o por ítem
- **Tipo:** Restricción / Cálculo
- **Enunciado:** El descuento puede ser **general** (sobre el total de la cotización) o **particular** (sobre un ítem). Se expresa como **porcentaje o monto fijo** y lleva su motivo. **Un mismo descuento es general o por pieza, nunca ambas cosas.**
- **Trazabilidad:** CU-14 A16, CU-18 · `Descuento.tipo`, `Cotizacion → 0..1 descuentoGeneral`, `ItemCotizacion → 0..1 descuentoItem`.

### RN27 — Seña o adelanto
- **Tipo:** Cálculo
- **Enunciado:** Cuando la compra de material es costosa, la cotización incluye una **seña**, expresada como porcentaje del precio final.
- **Fórmula:** `montoSeña = precioFinal × porcSeña / 100`, con `0 ≤ porcSeña ≤ 100`.
- **Trazabilidad:** CU-14 A17 · `Cotizacion.calcularSeña()`.

### RN28 — Moneda de referencia y actualización por dólar
- **Tipo:** Cálculo
- **Enunciado:** Los precios se referencian al valor del dólar vigente al cotizar. Las cotizaciones pueden emitirse en **pesos o en dólares**. Para actualizar una cotización anterior se divide el precio por el dólar de aquella fecha y se multiplica por el actual.
- **Fórmula:** `precioActualizado = precioAnterior / dolarFechaCotizacionAnterior × dolarActual`.
- **Trazabilidad:** CU-17 · `Cotizacion.moneda`, `Cotizacion.precioDolar`.

### RN29 — Validez de la oferta
- **Tipo:** Disparador
- **Enunciado:** Toda cotización tiene un plazo de validez referencial, **habitualmente 7 días** (parametrizable, RNF15). Superado sin adjudicación, la cotización queda **vencida** y debe recotizarse.
- **Fórmula:** `fechaVtoOferta = fechaCotizacion + plazoValidez` (se calcula al pasar a `Cotizado`).
- **Trazabilidad:** CU-14 (paso 6), CU-22 · `Cotizacion.calcularFechaVto()`, `marcarVencido()` · ME Cotización.

---

## E. Informe y ciclo de la cotización

### RN30 — Formato y contenido del informe de cotización
- **Tipo:** Restricción
- **Enunciado:** Toda cotización se comunica al cliente con un informe en el **formato propio de Tornería Castro**, cualquiera sea el formato que pida el cliente. El informe contiene, **y solo contiene como datos económicos**:
  - precio final por ítem y total;
  - número de plano y nombre de la pieza;
  - plazo de entrega y condición de pago;
  - observaciones y validez de la oferta.

  Puede enviarse por correo electrónico o WhatsApp.
- **Trazabilidad:** CU-20, CU-21 · RN42, RNF06, RNF19, RNF20.

### RN31 — Estados de la cotización `🔁 D-04`
- **Tipo:** Restricción
- **Enunciado:** Una cotización atraviesa los estados `PteCotizacion` → `Borrador` → `Cotizado` → {`Vencido` | `Adjudicado` | `AdjudicadoParcial`}. El estado determina qué operaciones se admiten:

  | Operación | Estados admitidos |
  |---|---|
  | Cargar o guardar como borrador | `PteCotizacion`, `Borrador` |
  | Confirmar (emitir) | `PteCotizacion`, `Borrador` |
  | Modificar (CU-18) | `Borrador`, `Cotizado` |
  | Generar o enviar informe | `Cotizado` |
  | Adjudicar (CU-23) | **solo** `Cotizado` (vigente) |
  | Ninguna (estado final, precio congelado) | `Vencido`, `Adjudicado`, `AdjudicadoParcial` |

  **"Modificada" no es un estado:** si una cotización ya `Cotizado` vuelve a cambiarse, sigue en `Cotizado` y el cambio queda en el historial (RN32).
- **Trazabilidad:** `06-maquinas-de-estado.md` §1 · `EstadoCotizacion`.

### RN32 — Variabilidad de la cotización antes de la adjudicación
- **Tipo:** Restricción
- **Enunciado:** Mientras la cotización no esté adjudicada pueden variar precios (p. ej. descuentos posteriores), cantidad de piezas, tipo de material y procesos. **Toda variación queda registrada en el historial con responsable, fecha y hora, valor anterior y valor nuevo.**
- **Trazabilidad:** CU-18 · `ItemCotizacion → 0..* HistorialCambio` (historialNegociacion) · RNF10.

### RN33 — Adjudicación total o parcial
- **Tipo:** Restricción / Disparador
- **Enunciado:** El cliente puede adjudicar la cotización **total o parcialmente**, aprobando solo los ítems que le interesan. La adjudicación se concreta al recibir la **orden de compra**, que puede ser formal (PDF o Excel por correo) o informal (mensaje de WhatsApp). **Cada ítem adjudicado genera una Orden de Trabajo independiente**, por lo que OTs de una misma cotización pueden estar en estados distintos.
- **Trazabilidad:** CU-23 · `Cotizacion.adjudicar()`, `ItemCotizacion.marcarAdjudicado()`, `ItemCotizacion.crearOrdenDeTrabajo()` · RNF11 (atomicidad).

---

## F. Trabajo adjudicado (Orden de Trabajo)

### RN34 — Precio adjudicado invariable `🔁 D-02`
- **Tipo:** Restricción (invariante)
- **Enunciado:** Al recibirse la orden de compra, el precio acordado con el cliente **queda fijo y no puede modificarse**, aunque cambien costos internos, proveedores o procesos. **Cada `OrdenDeTrabajo` guarda ese precio (`precioPactado`) como valor congelado**, que se registra en el momento de la OC (CU-23).
- **Trazabilidad:** CU-23 · `OrdenDeTrabajo.precioPactado` · RNF11.
- **Nota de implementación:** ningún endpoint ni rol puede actualizar `precioPactado` después de creado.

### RN35 — Cambios de procesos y proveedores después de la adjudicación
- **Tipo:** Restricción
- **Enunciado:** Una vez adjudicado el trabajo pueden cambiarse los procesos planificados y los proveedores de materiales y servicios tercerizados **sin alterar el precio acordado**. Todos los cambios quedan en el historial de cambios de la pieza.
- **Trazabilidad:** CU-25, CU-27, CU-28 · `OrdenDeTrabajo → 0..* HistorialCambio` (historialPieza).

### RN36 — Cancelación excepcional de un trabajo
- **Tipo:** Restricción
- **Enunciado:** Un trabajo adjudicado puede **cancelarse solo mientras no esté finalizado** (desde `PteCompraMaterial`, `MaterialPedido`, `PteConstruccion` o `EnConstruccion`), registrando el motivo. Una vez construida la pieza ya no se cancela: solo resta entregarla y facturarla.
- **Trazabilidad:** CU-24 · `OrdenDeTrabajo.cancelar()`, `motivoCancelacion` · ME OT.

### RN37 — Ciclo de estados de la Orden de Trabajo
- **Tipo:** Restricción / Disparador
- **Enunciado:** Cada OT recorre: `PteCompraMaterial` → `MaterialPedido` → `PteConstruccion` → `EnConstruccion` → `Finalizado` → `Entregado` → `Facturado`.
  - Al pasar a `MaterialPedido` se registran proveedor, precio y cantidad efectivamente comprada si difieren de lo cotizado.
  - Al pasar a `EnConstruccion` **se genera la hoja de ruta**.
  - Al pasar a `Finalizado` **se registra la hoja de ruta completada**.
- **Trazabilidad:** CU-25..27, CU-30..32 · `06-maquinas-de-estado.md` §2.

### RN38 — Marcado automático de trabajos demorados
- **Tipo:** Disparador
- **Enunciado:** Antes de la finalización, si la fecha actual supera la fecha de entrega pactada, el trabajo **se marca como demorado**. La marca **no altera su avance** por los estados (demorado es una condición, no un estado).
- **Condición:** `estado ∈ {PteCompraMaterial, MaterialPedido, PteConstruccion, EnConstruccion} ∧ hoy > fechaEntregaPactada ⇒ estaDemorado = true`.
- **Trazabilidad:** CU-29 (Temporizador, diario) · `OrdenDeTrabajo.verificarDemora()`, `marcarDemorado()`.

### RN39 — Hoja de ruta: emisión, ejecución y registro
- **Tipo:** Estructural
- **Enunciado:** La hoja de ruta es la tabla de procesos a realizar, con las columnas **responsable, tiempo empleado y observaciones**, inicialmente vacías. Se imprime y acompaña a la pieza por el taller, donde cada responsable anota nombre y apellido, tiempo empleado y observaciones. Al terminar la pieza, la hoja se registra en el sistema **vinculando cada proceso planificado con su ejecución real**.
- **Trazabilidad:** CU-27, CU-30 · `OrdenDeTrabajo.generarHojaDeRuta()`, `registrarHojaDeRuta()` · `ProcesoPlanificado → 0..1 EjecucionProceso` · RNF04.

### RN40 — Registro de lo real y cálculo del desvío
- **Tipo:** Cálculo
- **Enunciado:** Al registrar la hoja de ruta se cargan el responsable y el tiempo real de cada proceso y la cantidad de material realmente usada, que puede ser mayor o menor a la estimada. El desvío se calcula **par a par**: cada proceso ejecutado contra su planificación y el material real contra el cotizado. Se obtiene el desvío del trabajo y, por agregación, el de los conjuntos que lo contienen.
- **Fórmula:**
  ```
  desvíoProceso  = costoReal(ejecución) − costoEstimado(planificado)
  desvíoMaterial = costo(MaterialComprado) − costo(MaterialCotizado)
  desvíoTrabajo  = Σ desvíoProceso + desvíoMaterial   (recursivo en conjuntos)
  ```
- **Trazabilidad:** CU-30, CU-51 · `EjecucionProceso.calcularDesvio()`, `CompraDeMaterial.ambito`.

### RN41 — Entrega y facturación parcial
- **Tipo:** Restricción
- **Enunciado:** Las piezas de una misma cotización adjudicada pueden entregarse y facturarse por separado (p. ej., de 10 piezas adjudicadas se entregan y facturan 2 y luego las 8 restantes). En la entrega se registra el **nº de remito** y en la facturación el **nº de factura**. La emisión de ambos documentos está fuera del alcance.
- **Trazabilidad:** CU-31, CU-32 · `Remito`, `Factura` (cada OT tiene los suyos).

---

## G. Confidencialidad y acceso

### RN42 — Separación entre información al cliente e información interna
- **Tipo:** Acceso
- **Enunciado:** Se distingue la información que recibe el cliente (**precio final, plazos de entrega y condiciones de pago**) de la información interna del taller (**márgenes, costos de materiales, horas reales y desvíos**), que es confidencial.
- **Trazabilidad:** CU-20 (el informe solo incluye datos del cliente) · RNF09 · `07-matriz-rbac.md`.

### RN43 — Acceso restringido del personal de taller `🔁 D-01` `🔁 D-03`
- **Tipo:** Acceso
- **Enunciado:** El Jefe de Taller:
  - En la **consulta operativa** (CU-19) ve **solo los trabajos adjudicados no facturados**.
  - Registra la ejecución de los procesos: responsables, horas, observaciones y material real.
  - **Del dinero solo ve y registra los precios de los materiales** (compra de material).
  - **No accede a:** precios hora, costos de procesos propios o tercerizados, costo de pintura, repuestos valorizados, precio pactado o final, descuentos, señas, márgenes ni desvíos económicos.
- **Trazabilidad:** CU-19, CU-25, CU-30 · RNF09 · `07-matriz-rbac.md`.
- `⚠️ SUPUESTO` La consulta operativa excluye también las OTs `Cancelado` (son finales). La decisión D-03 dice "no facturadas"; validar si las canceladas deben aparecer.

### RN44 — Rol del usuario y baja de empleados
- **Tipo:** Acceso / Disparador
- **Enunciado:**
  - El **rol es un permiso del sistema asignado al usuario**, no un atributo del empleado. Se define al crear la cuenta y puede modificarse después.
  - Los roles forman un **catálogo cerrado**, igual a los actores internos (JT, ERP, ER, EC, AT, AS), y no se administran desde el sistema.
  - Un usuario puede tener **uno o varios** roles.
  - **Al dar de baja lógica a un empleado, el sistema desactiva automáticamente su usuario**, si tiene uno.
- **Trazabilidad:** CU-05, CU-06, CU-48 · `Usuario → 1..* Rol`, `Usuario → 1 Empleado`, `Empleado.activo`, `Usuario.activo`.
