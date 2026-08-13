# Glosario del Dominio — Tornería Castro SRL

Este glosario define el vocabulario del negocio. Todos los nombres de entidades, estados y conceptos en el código deben alinearse con estos términos para evitar ambigüedades entre el equipo técnico y el cliente.

---

## Conceptos Centrales

**Camino de la pieza**
Nombre que los dueños dan al ciclo de vida completo de un trabajo, desde el pedido de cotización hasta la entrega. Es la metáfora central del dominio.

**Pieza**
Unidad de fabricación o reparación. Puede ser metalmecánica o plástica industrial. Una cotización puede agrupar una o muchas piezas.

**Plano**
Documento técnico (papel, PDF o AutoCAD) que especifica medidas, formas, materiales y demás especificaciones de fabricación de una pieza. Es el principal identificador de una pieza. No todas las piezas tienen plano.

**Pieza patrón**
Pieza física que el cliente entrega como modelo a replicar, en lugar de un plano.

**Diseño 3D / STEP**
Archivos de diseño tridimensional (SolidWorks o formato STEP) que el cliente puede enviar como referencia auxiliar.

---

## Flujo de Trabajo

**Pedido de Cotización**
Solicitud inicial del cliente para obtener un presupuesto sobre una o varias piezas.

**Cotización**
Proceso de desglose de costos y elaboración de una oferta económica. Puede componerse de múltiples ítems (piezas o sub-trabajos). Mientras no esté adjudicada, el precio puede modificarse libremente.

**Informe de Cotización**
Documento formal enviado al cliente con precio final, código de plano, plazos, condiciones de pago y validez de la oferta. El cliente puede requerir un formato específico.

**Orden de Compra (OC)**
Documento (formal o informal, incluso por WhatsApp) mediante el cual el cliente aprueba el presupuesto y autoriza el inicio de la producción. A partir de este punto el precio queda invariable.

**Orden de Trabajo (OT)**
Unidad de producción generada al adjudicarse una cotización. Se crea una OT por cada ítem adjudicado.

**Trabajo Compuesto**
Cotización integrada por varias piezas o sub-trabajos cotizados individualmente pero informados en un solo informe al cliente.

---

## Producción

**Construcción**
Etapa de producción en el taller donde se fabrica físicamente la pieza.

**Proceso**
Cada etapa técnica distinta en la fabricación (herrería, mecanizado manual, mecanizado CNC, etc.). Cada proceso tiene un costo de hora diferente.

**Herrería**
Tipo de proceso que incluye soldadura, pintura, entre otros.

**Mecanizado**
Conjunto de procesos de fabricación que consisten en dar forma a una pieza mediante arranque o remoción de material con herramientas de corte. Puede ser manual o CNC.

**Mecanizado manual**
Procesos como fresado o torneado realizados por un operario de forma manual.

**Mecanizado CNC (Control Numérico Computarizado)**
Procesos realizados por máquinas programables que operan de forma automática. Útiles para producción por lotes.

**Tercerización**
Procesos que Tornería Castro no realiza internamente y delega a proveedores externos: zincado, corte por hilo, tratamientos térmicos, etc.

**Mapa de la pieza / Hoja de Ruta**
Hoja de seguimiento donde se registran los procesos por los que pasa una pieza, con el nombre del empleado y el tiempo real empleado en cada uno.

**Remito**
Documento logístico que registra la emisión, envío y recepción de un trabajo entregado al cliente.

---

## Costos y Precios

**Mano de obra**
Costo asociado al trabajo humano por proceso, cobrado por hora. La tarifa varía según el tipo de proceso.

**Actualización por moneda / dólar**
Mecanismo de ajuste de precios de cotizaciones antiguas según la variación del dólar:
```
precio_nuevo = precio_anterior / dolar_anterior * dolar_actual
```

**Validez de oferta**
Plazo durante el cual una cotización mantiene el precio ofrecido. Usualmente 7 días, dada la volatilidad de precios.

**Invariabilidad del precio**
Regla de negocio: una vez aceptada la Orden de Compra, el precio al cliente no puede modificarse aunque cambien los costos internos.

**Información pública vs. privada**
Distinción entre datos visibles para el cliente (precio final, plazos) y datos confidenciales del taller (costos de materiales, márgenes, horas reales trabajadas).

---

## Identificación

**Número de plano**
Identificador técnico que el cliente asigna a cada pieza. Es el dato de identificación preferido. Puede repetirse con variaciones mínimas (ver Unicidad de planos).

**ID interno secuencial**
Código generado por el sistema cuando una pieza no cuenta con número de plano. Se asocia a las iniciales de la fábrica cliente. Ejemplo: `OC-001` para OxyCAM.

**Unicidad de planos**
Regla que exige tratar como registros distintos a piezas con el mismo número de plano pero con variaciones mínimas de diseño o posicionamiento.

---

## Problemáticas del Negocio (contexto)

**"El Abismo"**
Brecha de comunicación cuando un cliente solicita trabajos directamente a producción sin pasar por administración, generando trabajos entregados sin facturar.

**Trazabilidad de rentabilidad**
Capacidad de contrastar horas presupuestadas contra horas reales trabajadas para evaluar si un trabajo fue rentable.
