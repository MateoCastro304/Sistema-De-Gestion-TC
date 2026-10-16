# Clientes, fábricas y rubros

## Propósito y alcance

Mantener la información comercial que permite identificar quién solicita un trabajo y bajo qué condiciones se cotiza. Comprende fábricas, encargados y rubros (RF01, RF07); la elaboración del presupuesto se explica en [cotizaciones](cotizaciones.md).

## Actores y conceptos

El Encargado de Recepción (ERP) registra, modifica, consulta y da de baja estos registros. Una fábrica representa a la empresa cliente; un encargado es la persona que solicita cotizaciones. Los particulares también se registran como encargados asociados a una fábrica de rubro «Particular» (RN01).

## Relaciones y reglas

Una fábrica puede tener varios encargados y una o varias formas de pago acordadas, que pueden cambiar con el tiempo y deben estar disponibles al cotizar (RN01–RN02). Cada solicitud identifica al encargado solicitante y su fábrica. La solicitud conserva su documentación y se deriva al Encargado de Cotización (RN03).

El detalle formal permanece en [RN01–RN03](../dominio/02-reglas-de-negocio.md#a-clientes-y-solicitudes), [RF01 y RF07](../dominio/03-requerimientos.md) y el [modelo de dominio, entrada comercial](../dominio/05-modelo-de-dominio.md#21-entrada-comercial).

## Funcionamiento

El ERP mantiene fábricas y encargados mediante CU-01–CU-04 y CU-58–CU-61, y rubros mediante CU-41–CU-44. Al recibir un pedido, selecciona al encargado para registrar la solicitud. Si no existe, CU-13 contempla registrar al cliente y volver a la selección; el flujo completo está en [CU-13](../dominio/04-actores-y-casos-de-uso.md#cu-13--registrar-solicitud-de-cotización).

## Límites y referencias

Las diferencias de baja, reactivación, validación y paginación de rubros siguen documentadas en [Rubros: diferencias entre el contrato y el backend](../rubros-desvios-contrato.md). Su reorganización no determina qué versión prevalece.

Fuentes: [catálogo de casos de uso, §2.1](../dominio/04-actores-y-casos-de-uso.md#21-clientes-fábricas-y-rubros--rf01-rf07) y [matriz de permisos](../dominio/Matriz%20de%20permisos.md). Los requisitos y reglas conservan sus identificadores en `domain/`.
