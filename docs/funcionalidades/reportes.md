# Reportes y consultas gerenciales

## Propósito y actores

Ofrecer información para evaluar facturación, desvíos y efectividad de adjudicación. El Encargado de Reportes (ER) utiliza CU-49–CU-51, CU-56 y CU-57, conforme a la [matriz de permisos](../domain/Matriz%20de%20permisos.md).

## Información y dependencias

Los reportes usan datos de [cotizaciones](cotizaciones.md) y [órdenes de trabajo](ordenes-de-trabajo.md): ofertas adjudicadas, trabajos realizados, facturación registrada y diferencias entre costos planificados y reales. El historial de compras a proveedores (CU-55) es una consulta del Encargado de Cotización; se explica en [catálogos técnicos](catalogos-tecnicos.md).

## Consultas disponibles en la especificación

- CU-49: reporte mensual de facturación.
- CU-50: reporte anual de facturación por rubro.
- CU-51: estadísticas de desvíos de cotizaciones.
- CU-56: trabajos realizados, filtrados por fábrica, material y descripción, con acceso a la cotización de origen, hoja de ruta y desvíos.
- CU-57: efectividad de adjudicación de presupuestos.

Los criterios completos se conservan en [RF09 y RF11](../domain/03-requerimientos.md) y el [catálogo de casos de uso, §2.6](../domain/04-actores-y-casos-de-uso.md#26-reportes-y-consultas-gerenciales--rf09-rf11). Las fórmulas de desvío se definen en RN40; no se redefine aquí su cálculo.

## Alcance documental

Los casos anteriores tienen entradas de catálogo, pero no descripciones detalladas equivalentes a CU-13 y CU-14. Esta síntesis conserva ese nivel de detalle y no agrega flujos ni criterios de aceptación nuevos. CU-56 corresponde únicamente a ER; la consulta operativa del taller sigue siendo CU-19.
