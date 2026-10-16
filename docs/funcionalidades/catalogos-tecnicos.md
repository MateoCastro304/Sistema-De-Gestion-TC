ad# Catálogos técnicos

## Propósito y responsabilidades

Proporcionar los materiales, proveedores y tipos de proceso usados para [cotizar](cotizaciones.md) y ejecutar [órdenes de trabajo](ordenes-de-trabajo.md). Corresponden a RF03, RF05 y RF06. Los catálogos aportan referencias; el presupuesto y el registro real conservan los datos particulares del trabajo.

## Actores y conceptos

El Administrativo Técnico (AT) administra los catálogos; el Encargado de Cotización (EC) hereda esas operaciones. La consulta del historial de compras a proveedores (CU-55) corresponde únicamente a EC, según la [matriz de permisos](../dominio/Matriz%20de%20permisos.md).

El material se identifica por nombre y calidad. La presentación, unidad, cantidad, precio y proveedor pertenecen a la compra de material del trabajo. El tipo de proceso define el precio hora base. El proveedor suministra materiales, servicios tercerizados, repuestos o pintura. Estas distinciones provienen del [modelo, §§2.3–2.6](../dominio/05-modelo-de-dominio.md).

## Relaciones y reglas

- Puede haber varios proveedores para un material, servicio o repuesto. Al cotizar se preselecciona uno; después de adjudicar puede cambiarse con registro en el historial (RN15).
- El precio del material se calcula por kilogramo, excepto caño o cilindro hueco, que se calcula por metro (RN14).
- El precio hora del catálogo se propone al cotizar. El EC puede modificar su copia para esa cotización o actualizar el catálogo para cotizaciones futuras (RN17).
- Al variar el tipo de cambio, se recalcula el precio hora en dólares y se mantiene el precio en pesos (RN18).
- Los procesos tercerizados se valorizan por el costo total del servicio; la pintura combina insumo y mano de obra; los repuestos se incorporan por cantidad y precio (RN19–RN22).

Las fórmulas y restricciones completas permanecen en [RN13–RN22](../dominio/02-reglas-de-negocio.md#c-materiales-proveedores-y-mano-de-obra).

## Funcionamiento y dependencias

CU-09–CU-12 mantienen tipos de proceso, CU-33–CU-36 proveedores y CU-37–CU-40 materiales. Durante CU-14, si falta un material, tipo de proceso o proveedor, se ejecuta el alta correspondiente y se vuelve al paso de cotización que la necesitaba (alternativas A7–A9).

La compra estimada y la real se conservan separadas para calcular desvíos; actualizar un catálogo no sustituye el registro de ejecución de la orden de trabajo.

## Límites y documentación relacionada

El modelo describe un tipo por proveedor, mientras el [contexto del prototipo](../prototipo/fuente/CONTEXTO.md) admite varios. Esa diferencia permanece abierta: ver [DOC-07](../seguimiento/inconsistencias-documentales.md#doc-07--tipos-por-proveedor).

Fuentes: [RF03, RF05 y RF06](../dominio/03-requerimientos.md), [catálogo de casos de uso, §2.3](../dominio/04-actores-y-casos-de-uso.md#23-catálogos-técnicos--rf03-rf05-rf06) y [CU-14](../dominio/04-actores-y-casos-de-uso.md#cu-14--registrar-cotización).
