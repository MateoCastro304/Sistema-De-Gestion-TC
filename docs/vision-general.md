# Visión general del sistema

Punto de partida para orientarse en el sistema de gestión de Tornería Castro SRL. Las especificaciones formales (objetivos, alcance, reglas, requisitos y casos de uso) están en [`domain/`](dominio/00-indice-y-convenciones.md); este documento las resume y enlaza. Los términos del negocio se definen en el [glosario](glosario.md).

> Fuente: ERS V1.1 §1 y §2 (contexto, propósito y usuarios, antes en [01-introduccion-alcance.md](dominio/01-introduccion-alcance.md) §1, §2 y §7).

## Propósito

**Tornería Castro SRL** fabrica a medida y repara piezas metalmecánicas y plásticas industriales. Trabaja **por demanda**: cada trabajo empieza con un pedido de cotización de un cliente industrial (por ejemplo EDASA, CorBlock u OxyCAM) y recorre lo que los dueños llaman **"el camino de la pieza"**:

```mermaid
flowchart LR
    A[Pedido de cotización] --> B[Cotización] --> C[Recepción de Orden de Compra] --> D[Construcción] --> E[Entrega] --> F[Facturación]
```

**Situación actual (problema):** la información está repartida en planillas, archivos y en la memoria de los responsables administrativos. Eso dificulta:

- reutilizar información histórica al cotizar,
- seguir las cotizaciones emitidas,
- contrastar lo planificado con lo realmente ejecutado en el taller.

**Propósito del sistema:** brindar una herramienta informática que permita **administrar el proceso de cotización de piezas industriales y el seguimiento técnico y económico de los trabajos adjudicados**, centralizando la información técnica, económica y documental de cada trabajo.

El sistema deberá:

1. Registrar solicitudes de cotización, clientes, piezas, procesos, costos, materiales, proveedores y antecedentes de cotizaciones, para agilizar nuevos presupuestos.
2. Generar el informe de cotización con el formato propio de Tornería Castro y enviarlo automáticamente por correo electrónico o WhatsApp.
3. Conservar el historial de cotizaciones y de modificaciones de precios y procesos de las piezas.
4. Seguir el estado de cada trabajo adjudicado mediante la hoja de ruta, registrar tiempos y materiales reales y calcular los desvíos respecto de lo planificado.

Los objetivos medibles (OBJ-01 a OBJ-12) están en [01-introduccion-alcance.md, §4](dominio/01-introduccion-alcance.md#4-objetivos-del-sistema).

## Alcance

El sistema cubre desde la **recepción de la solicitud de cotización** hasta el **registro de la entrega y facturación** del trabajo. La prioridad de esta primera versión es el **seguimiento técnico y económico de la pieza** desde la cotización hasta su realización.

Queda fuera la emisión de remitos y facturas (solo se registran sus números), la logística de entrega y la cobranza, incluido el cobro de la seña. El detalle de capacidades incluidas (A-01 a A-17) y excluidas (X-01 a X-04) está en [01-introduccion-alcance.md, §5](dominio/01-introduccion-alcance.md#5-alcance).

## Actores

Los usuarios son el personal interno de Tornería Castro. El detalle de actores está en el [catálogo de actores](dominio/04-actores-y-casos-de-uso.md#11-catálogo), y los permisos, en [roles y permisos](conceptos-transversales/roles-y-permisos.md).

| Actor | Rol en una línea |
|---|---|
| Encargado de Recepción (ERP) | Contacto con el cliente; registra solicitudes, OC, entregas y facturas; mantiene clientes y rubros |
| Encargado de Cotización (EC) | Elabora y administra cotizaciones; hereda del AT |
| Administrativo Técnico (AT) | Mantiene catálogos de materiales, tipos de proceso y proveedores |
| Jefe de Taller (JT) | Conduce la producción de las OT y la hoja de ruta |
| Encargado de Reportes (ER) | Obtiene información estadística y gerencial |
| Administrador del Sistema (AS) | Empleados, usuarios y roles |

Intervienen además el **Servidor de Correo** y el **Servidor de Mensajería** (WhatsApp Business), para enviar el informe de cotización, y el **Temporizador**, que dispara los procesos programados.

## Áreas funcionales

| Área | Responsabilidad principal |
|---|---|
| [Clientes, fábricas y rubros](funcionalidades/clientes.md) | Información comercial de quien solicita los trabajos. |
| [Catálogos técnicos](funcionalidades/catalogos-tecnicos.md) | Materiales, proveedores y tipos de proceso usados para cotizar y fabricar. |
| [Solicitudes y cotizaciones](funcionalidades/cotizaciones.md) | Registro de pedidos, elaboración de ofertas, informe y adjudicación. |
| [Órdenes de trabajo](funcionalidades/ordenes-de-trabajo.md) | Ejecución de cada ítem adjudicado, desvíos, entrega y facturación. |
| [Reportes y consultas gerenciales](funcionalidades/reportes.md) | Facturación, desvíos y efectividad de adjudicación. |
| [Usuarios y empleados](funcionalidades/usuarios-y-empleados.md) | Personal, cuentas de acceso y roles. |

## Funcionamiento general

1. El ERP registra la **solicitud** recibida por correo o WhatsApp, con su documentación, y queda una cotización pendiente.
2. El EC elabora la **cotización** ítem por ítem, apoyándose en los catálogos técnicos y en cotizaciones anteriores de la misma pieza; el sistema calcula el precio y genera el informe que se envía al cliente.
3. Cuando el cliente **adjudica** total o parcialmente, cada ítem adjudicado genera una **orden de trabajo** independiente.
4. El JT conduce cada orden en el taller con la hoja de ruta y registra lo real; el sistema calcula los desvíos.
5. El ERP registra la entrega y la facturación, y el ER obtiene los **reportes** a partir de esa información.

El recorrido completo, con lo que se registra en cada ítem, está en [01-introduccion-alcance.md, §3](dominio/01-introduccion-alcance.md#3-propuesta-visión-del-flujo).

## Principios y restricciones

- La información destinada al cliente se diferencia de la de uso interno, y el acceso se restringe según el rol del usuario (OBJ-11, OBJ-12; [roles y permisos](conceptos-transversales/roles-y-permisos.md)).
- Debe ejecutarse sobre el equipamiento actual de la empresa, en puestos Windows con navegador, y WhatsApp solo mediante la API oficial de WhatsApp Business. Las restricciones R-01 a R-04 están en [01-introduccion-alcance.md, §8](dominio/01-introduccion-alcance.md#8-restricciones-generales).

## Mapa de documentación

- **Dominio:** [índice y convenciones](dominio/00-indice-y-convenciones.md), [reglas de negocio](dominio/02-reglas-de-negocio.md), [requisitos](dominio/03-requerimientos.md), [casos de uso](dominio/04-actores-y-casos-de-uso.md), [modelo](dominio/05-modelo-de-dominio.md), [máquinas de estado](dominio/06-maquinas-de-estado.md) y [matriz de permisos](dominio/Matriz%20de%20permisos.md).
- **Arquitectura y decisiones:** [visión general de arquitectura](arquitectura/overview.md) y [ADR](decisiones/).
- **Referencias técnicas:** [contrato OpenAPI](openapi/openapi.yaml), [referencia de API del Sprint 2](api-contract/API_CONTRACT_SPRINT_2.md), [migraciones](uso-ORM-DB/Migrations.md) y [pruebas](testing/code-structure.md).
- **Trabajo en el proyecto:** [SETUP](SETUP.md), [CONTRIBUTING](CONTRIBUTING.MD) y [seguimiento](seguimiento/pendientes-actuales.md).
