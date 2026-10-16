# Órdenes de trabajo

## Propósito y alcance

Seguir técnica y económicamente cada ítem adjudicado, desde la compra de material hasta el registro de entrega y facturación (RF10). La adjudicación proviene de [cotizaciones](cotizaciones.md); no se incluyen la emisión de remitos o facturas, la logística ni la cobranza.

## Actores y relaciones

El Jefe de Taller (JT) conduce la ejecución y registra material y procesos reales. El Encargado de Recepción (ERP) registra entrega y facturación. El Temporizador marca las demoras. El Encargado de Reportes (ER) consulta trabajos realizados mediante CU-56; ese permiso no corresponde a JT.

Cada ítem adjudicado tiene una OT independiente, con precio pactado congelado. Los procesos planificados se vinculan con su ejecución real y la compra estimada se distingue de la compra efectiva, permitiendo comparar ambas (RN33–RN35, RN39–RN40).

## Reglas de negocio

- El precio pactado no cambia después de adjudicar, aunque se modifiquen costos, proveedores o procesos; esos cambios quedan en el historial (RN34–RN35).
- La cancelación exige motivo y solo se permite antes de finalizar (RN36).
- La hoja de ruta se genera al iniciar la construcción y se registra completada al finalizar (RN37, RN39).
- La demora es una marca independiente del estado, aplicable antes de finalizar cuando se supera la fecha pactada (RN38).
- El desvío compara cada ejecución con su planificación y el material real con el cotizado (RN40).
- La entrega y facturación pueden realizarse por separado entre trabajos de una cotización; se registran números de remito y factura (RN41).

Las fórmulas, condiciones y trazabilidad permanecen en [RN34–RN41](../domain/02-reglas-de-negocio.md#f-trabajo-adjudicado-orden-de-trabajo). La visibilidad económica de JT se delimita en [roles y permisos](../conceptos-transversales/roles-y-permisos.md).

## Flujo de ejecución

**Disparador:** la adjudicación genera una OT.

1. El JT registra la compra de material con proveedor, precio y cantidad reales, y luego su recepción.
2. Al registrar el inicio de construcción, se genera la hoja de ruta con los procesos planificados.
3. La hoja impresa acompaña a la pieza; los responsables anotan tiempos y observaciones.
4. Al finalizar, el JT registra la hoja completada y el material real; el sistema calcula los desvíos.
5. El ERP registra la entrega con número de remito y la facturación con número de factura.

**Alternativas:** los procesos y proveedores pueden cambiar con historial, sin modificar el precio pactado. La cancelación interrumpe el ciclo antes de finalizar. La demora no interrumpe el avance.

**Resultado:** una OT facturada o cancelada, con los registros de ejecución correspondientes al recorrido realizado. Los datos de producción alimentan las [consultas y reportes](reportes.md).

## Estados y ciclo de vida

El recorrido operativo es `PteCompraMaterial` → `MaterialPedido` → `PteConstruccion` → `EnConstruccion` → `Finalizado` → `Entregado` → `Facturado`. `Cancelado` es una salida excepcional final.

Las guardas, efectos y transiciones ilegales permanecen en la [máquina de estados, §2](../domain/06-maquinas-de-estado.md#2-orden-de-trabajo-ordendetrabajoestado--estadoot). La fecha de entrega calculada desde la orden de compra y el plazo del ítem está marcada como supuesto en esa fuente.

## Documentación relacionada

Fuentes: [RF10](../domain/03-requerimientos.md), [CU-19 y CU-23–CU-32](../domain/04-actores-y-casos-de-uso.md), [modelo, §2.5](../domain/05-modelo-de-dominio.md#25-producción-y-ejecución-real) y [matriz de permisos](../domain/Matriz%20de%20permisos.md). Se conserva en `domain/` el detalle formal de reglas, estados y relaciones.
