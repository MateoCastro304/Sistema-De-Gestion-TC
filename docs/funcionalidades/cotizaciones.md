# Solicitudes y cotizaciones

## Propósito y alcance

Registrar los pedidos de los clientes y elaborar ofertas técnicas y económicas reutilizando antecedentes. Comprende RF08 y las consultas de historial de RF09; termina en la emisión, envío o adjudicación de la oferta. La ejecución posterior se explica en [órdenes de trabajo](ordenes-de-trabajo.md).

## Actores y objetivos

El Encargado de Recepción (ERP) registra la solicitud y la orden de compra. El Encargado de Cotización (EC) prepara la oferta, consulta antecedentes y genera o envía el informe. Los servicios de correo y mensajería participan en el envío; el Temporizador controla el vencimiento. Los permisos detallados permanecen en la [matriz](../domain/Matriz%20de%20permisos.md).

## Conceptos y relaciones

La solicitud es el pedido recibido; la cotización es la oferta formal. Una solicitud puede originar varias cotizaciones, por reparto de piezas o recotización, cada una con identidad, fecha y valor del dólar propios (RN05).

Cada cotización tiene uno o más ítems. El ítem es la unidad presupuestada y no existe fuera de su cotización. Puede ser pieza individual, conjunto o reparación; conjuntos y reparaciones admiten piezas hijas a cualquier profundidad, además de procesos propios (RN09–RN11).

La pieza se identifica por número de plano o por un identificador interno cuando no hay plano. Una misma pieza puede aparecer en distintas cotizaciones, habilitando la consulta y reutilización de antecedentes (RN06–RN08). Cada ítem adjudicado genera una OT independiente (RN33).

## Reglas de negocio

El catálogo formal se conserva en `domain/` para mantener una única definición de cada regla:

- [RN01–RN03](../domain/02-reglas-de-negocio.md#a-clientes-y-solicitudes): cliente y registro obligatorio de la solicitud.
- [RN04–RN12](../domain/02-reglas-de-negocio.md#b-cotización-identidad-y-composición): identidad, documentación y composición.
- [RN13–RN22](../domain/02-reglas-de-negocio.md#c-materiales-proveedores-y-mano-de-obra): materiales, procesos, proveedores y repuestos.
- [RN23–RN29](../domain/02-reglas-de-negocio.md#d-cálculo-del-precio): costos, descuentos, seña, moneda y vigencia.
- [RN30–RN33](../domain/02-reglas-de-negocio.md#e-informe-y-ciclo-de-la-cotización): informe, cambios y adjudicación.

El informe al cliente contiene los precios finales y las condiciones comerciales, sin los costos internos, márgenes ni desvíos (RN42). La seña se calcula e informa; su cobro queda fuera del alcance.

## Funcionamiento y flujos de información

### Registrar una solicitud

**Disparador:** el ERP recibe un pedido por correo o WhatsApp.

**Condiciones previas:** sesión iniciada y cliente registrado; CU-13 contempla registrar al cliente si falta.

1. El ERP selecciona al cliente e informa fecha, referencia del pedido y descripción.
2. Adjunta la documentación técnica; el sistema valida formatos y datos obligatorios.
3. Tras la confirmación, el sistema registra la solicitud y crea la cotización asociada en `PteCotizacion`.

**Resultado:** la solicitud y su documentación quedan disponibles para cotizar. Los formatos inválidos requieren corrección; la cancelación finaliza sin registro.

Esta síntesis no reemplaza los 16 pasos ni las alternativas A1–A5 de [CU-13](../domain/04-actores-y-casos-de-uso.md#cu-13--registrar-solicitud-de-cotización).

### Elaborar una cotización

**Disparador:** el EC elige cotizar una solicitud o retoma un borrador.

**Entrada:** datos generales, documentación de las piezas y referencias de los [catálogos técnicos](catalogos-tecnicos.md).

1. El EC completa los datos generales; el sistema valida y genera el número correlativo.
2. El EC cotiza cada ítem en secuencia: pieza, material, procesos, servicios externos, repuestos y tratamientos aplicables.
3. El sistema calcula los importes del ítem y permite incorporar otros.
4. El EC revisa el resumen, aplica descuento o seña si corresponde y confirma.
5. El sistema calcula el precio final y registra la cotización en `Cotizado`, disponible para generar y enviar el informe.

**Alternativas:** reutilizar antecedentes, cargar conjuntos o reparaciones, dar de alta referencias faltantes, guardar como borrador o abandonar sin guardar. Los puntos de retorno y efectos exactos se conservan en los 44 pasos y alternativas A1–A20 de [CU-14](../domain/04-actores-y-casos-de-uso.md#cu-14--registrar-cotización).

### Adjudicar ítems

**Disparador:** recepción de la orden de compra, formal o informal.

1. El ERP registra la adjudicación de los ítems aprobados por el cliente.
2. El sistema genera una OT por cada ítem adjudicado y conserva el precio pactado en cada OT.

**Resultado:** adjudicación total o parcial y órdenes independientes, conforme a RN33–RN34 y CU-23. El detalle disponible de este caso es el catálogo, las reglas y las transiciones; no hay una descripción completa equivalente a CU-13/CU-14.

## Estados y ciclo de vida

`PteCotizacion` y `Borrador` permiten preparar la oferta; `Cotizado` representa una oferta emitida y vigente. Desde allí puede vencer o adjudicarse total o parcialmente. Modificar una oferta emitida mantiene `Cotizado` y registra el cambio en el historial; «Modificada» no es un estado.

Las operaciones admitidas, guardas, efectos y transiciones ilegales están en [RN31](../domain/02-reglas-de-negocio.md) y la [máquina de estados de cotización](../domain/06-maquinas-de-estado.md#1-cotización-cotizacionestado--estadocotizacion).

## Decisiones y cuestiones abiertas

La generación de PDF se describe en [ADR-004](../decisions/004-generate-pdf.md), y los canales salientes en [ADR-007](../decisions/007-mail-integration.md) y [ADR-008](../decisions/008-whatsapp-integration.md). Sus estados y proveedores pendientes siguen siendo los registrados en cada ADR.

Hay diferencias documentales sobre el formato del PDF y las referencias de reglas usadas por ADR-008. Se conservan señaladas en [DOC-03](../seguimiento/inconsistencias-documentales.md#doc-03--formato-del-informe-de-cotización) e [DOC-04](../seguimiento/inconsistencias-documentales.md#doc-04--referencias-a-reglas-en-adr-008). Los supuestos de las máquinas de estado, como no reiniciar la fecha de vencimiento al modificar, no se convierten aquí en decisiones confirmadas.

## Documentación relacionada

Fuentes de esta síntesis: [introducción, §3](../domain/01-introduccion-alcance.md#3-propuesta-visión-del-flujo), [RF08–RF09](../domain/03-requerimientos.md) y [modelo, §§2–3](../domain/05-modelo-de-dominio.md). Las especificaciones completas permanecen en `domain/`.
