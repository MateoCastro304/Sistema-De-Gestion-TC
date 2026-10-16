# 01 · Introducción, propuesta y alcance

> Fuente: ERS V1.1 §1, §2, §2.1–2.3. Convenciones en `00-indice-y-convenciones.md`.

---

## 1. Contexto del negocio

Trasladado a la [visión general, «Propósito»](../vision-general.md#propósito): el negocio, «el camino de la pieza» y el problema de la situación actual.

## 2. Propósito del sistema

Trasladado a la [visión general, «Propósito»](../vision-general.md#propósito), junto con las cuatro capacidades que el sistema deberá brindar.

## 3. Propuesta (visión del flujo)

1. El **Encargado de Recepción** recibe una solicitud por mail o WhatsApp y la registra: fecha, descripción breve, cliente y fábrica, PDF de la solicitud y planos o fotos de la pieza patrón. Queda derivada a un Encargado de Cotización.
2. El **Encargado de Cotización** carga los datos generales (validez, fecha, moneda) y cotiza **cada ítem de forma secuencial**. Un ítem puede ser **pieza individual**, **conjunto/ensamblaje** o **reparación**. Para cada ítem registra:
   1. Tipo de trabajo.
   2. Material: calidad, presentación, proveedor y cantidad (kg o metros según la presentación).
   3. Procesos propios: tipo, descripción, costo por hora, horas estimadas.
   4. Procesos tercerizados: tipo, descripción, proveedor, costo total del servicio.
   5. Tratamientos superficiales (galvanizado, zincado…) y pintura (tipo, $/litro, proveedor, $/hora, horas).
   6. Repuestos: descripción, cantidad, proveedor, costo unitario estimado.
   7. Condición de pago y plazo de entrega.
3. Si la pieza ya fue cotizada (mismo **número de plano**), puede consultar su historial y **partir de una cotización anterior** con procesos y costos precargados y modificables.
4. Calculados los costos y aplicados descuentos y seña, el sistema genera el **informe de cotización en PDF** y lo envía por mail o WhatsApp.
5. El cliente adjudica la cotización **total o parcialmente**. **Cada ítem adjudicado genera una Orden de Trabajo (OT) independiente**, que avanza por su propio ciclo de producción.
6. El **Jefe de Taller** conduce cada OT: compra de material → recepción → construcción (con hoja de ruta) → finalización (con registro de lo real y cálculo de desvíos).
7. El **Encargado de Recepción** registra la entrega (nº de remito) y la facturación (nº de factura).
8. El **Encargado de Reportes** obtiene reportes de facturación, desvíos y efectividad de adjudicación.

## 4. Objetivos del sistema

| ID | Objetivo |
|---|---|
| OBJ-01 | Centralizar la información del proceso de cotización y producción. |
| OBJ-02 | Dar autonomía administrativa: que el EC cotice rápido consultando el historial, sin búsquedas manuales en archivos o correos. |
| OBJ-03 | Disponer de un historial de piezas cotizadas y entregadas, filtrable por empresa, número de plano y otros criterios. |
| OBJ-04 | Centralizar la documentación técnica de cada pieza (planos PDF/AutoCAD, fotos de pieza patrón, diseños 3D). |
| OBJ-05 | Calcular el costo de una cotización (materiales, procesos propios, tercerizados, mano de obra, repuestos) con descuentos y señas. |
| OBJ-06 | Registrar el historial de modificaciones de precios, cantidades y procesos de cotizaciones y hojas de ruta. |
| OBJ-07 | Generar el informe de cotización en PDF con formato propio y enviarlo por mail o WhatsApp. |
| OBJ-08 | Controlar la producción: registrar tiempos reales en la hoja de ruta y compararlos con lo presupuestado (desvíos). |
| OBJ-09 | Seguir el estado de cada trabajo adjudicado, marcando automáticamente como demorados los que superen su fecha de entrega. |
| OBJ-10 | Obtener estadísticas de decisión: trabajos por empresa, efectividad de adjudicación y desvíos de costos. |
| OBJ-11 | Diferenciar la información destinada al cliente de la de uso interno. |
| OBJ-12 | Restringir el acceso a la información según el rol del usuario. |

## 5. Alcance

**Límite del sistema:** desde la **recepción de la solicitud de cotización** hasta el **registro de la entrega y facturación** del trabajo.

### 5.1 Incluido

| # | Capacidad | RF |
|---|---|---|
| A-01 | Registro de solicitudes de cotización recibidas por mail o WhatsApp, con su documentación | RF08 |
| A-02 | Registro de clientes (fábricas y encargados), rubros y formas de pago | RF01, RF07 |
| A-03 | Registro de piezas y su documentación (planos PDF/AutoCAD, fotos de pieza patrón, diseños 3D SolidWorks/STEP) | RF08 |
| A-04 | Registro de procesos propios y tercerizados necesarios para fabricar cada pieza | RF08 |
| A-05 | Tipos de proceso con costo por hora preestablecido en pesos y dólares | RF03 |
| A-06 | Registro de materiales, calidades, presentaciones y proveedores | RF06, RF05 |
| A-07 | Administración de proveedores y sus tipos (materiales, servicios tercerizados, repuestos, pintura) | RF05 |
| A-08 | Gestión de cotizaciones: ítems, descuentos por pieza o generales, señas, cálculo de costos y presupuesto | RF08 |
| A-09 | Consulta del historial de cotizaciones de una pieza por número de plano e inicio de una cotización a partir de otra | RF08, RF09 |
| A-10 | Generación del informe de cotización con formato propio y envío por mail o WhatsApp | RF08 |
| A-11 | Registro de la Orden de Compra (adjudicación) y de la cancelación excepcional de trabajos | RF10 |
| A-12 | Ciclo de vida de cada trabajo adjudicado por estados, con marcado de demoras | RF10 |
| A-13 | Generación, modificación (con historial) y registro de la hoja de ruta: responsables, tiempos reales, observaciones y material real | RF10 |
| A-14 | Cálculo del desvío planificado vs. real (horas y material) | RF10 |
| A-15 | Registro del nº de remito en la entrega y del nº de factura en la facturación | RF10 |
| A-16 | Reportes y estadísticas de decisión | RF11 |
| A-17 | Usuarios, roles, empleados y control de acceso | RF02, RF04 |

### 5.2 Fuera de alcance (NO alcance)

| # | Excluido | Aclaración |
|---|---|---|
| X-01 | **Emisión de remitos** | El sistema solo **registra el número** de remito. |
| X-02 | **Emisión de facturas** | El sistema solo **registra el número** (y monto) de factura. |
| X-03 | **Logística de entrega** | — |
| X-04 | **Cobranza** | Incluye el cobro de la seña: el sistema la calcula e informa, no gestiona su cobro. |

> Prioridad de esta primera versión: el **seguimiento técnico y económico de la pieza** desde la cotización hasta su realización.

## 6. Perspectiva del producto

- Aplicación que **reemplaza el manejo manual** de la información de cotización y seguimiento de trabajos.
- **Repositorio centralizado** de información técnica y económica de piezas cotizadas y fabricadas: antecedentes, documentos, precios históricos y desvíos. Convierte conocimiento tácito en información estructurada.
- Información que administra: solicitudes de cotización · clientes, fábricas y rubros · cotizaciones e ítems · piezas y documentación · procesos planificados y ejecuciones reales · tipos de proceso con precio hora en $ y USD · materiales, presentaciones y unidades · proveedores y tipos · estados de cotizaciones y trabajos · historial de cambios · nº de remito y factura · usuarios, empleados, roles y sesiones.
- Interacción con sistemas externos: **Servidor de correo (SMTP)** y **API oficial de WhatsApp Business** para el envío de informes (RNF19, RNF20).

## 7. Usuarios

Trasladado a la [visión general, «Actores»](../vision-general.md#actores). El detalle de actores está en `04-actores-y-casos-de-uso.md` §1, y los permisos en `07-matriz-rbac.md`.

## 8. Restricciones generales

| ID | Restricción |
|---|---|
| R-01 | No se desarrollan funciones de emisión de remitos o facturas, logística de entrega ni cobranza (ver §5.2). |
| R-02 | Debe ejecutarse sobre el equipamiento actual de la empresa, sin hardware adicional (RNF07). |
| R-03 | Puestos Windows 10+, con Google Chrome o Microsoft Edge vigentes, sin complementos (RNF18). |
| R-04 | WhatsApp solo mediante la **API oficial de WhatsApp Business (Meta)**; prohibida la automatización de WhatsApp Web (RNF20). |

## 9. Glosario del dominio

Trasladado al [glosario](../glosario.md). El glosario completo del cliente está en el Anexo B [GLO].
