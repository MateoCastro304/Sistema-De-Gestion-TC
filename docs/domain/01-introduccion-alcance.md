# 01 · Introducción, propuesta y alcance

> Fuente: ERS V1.1 §1, §2, §2.1–2.3. Convenciones en `00-indice-y-convenciones.md`.

---

## 1. Contexto del negocio

**Tornería Castro SRL** fabrica a medida y repara piezas metalmecánicas y plásticas industriales. Trabaja **por demanda**: cada trabajo empieza con un pedido de cotización de un cliente industrial (por ejemplo EDASA, CorBlock u OxyCAM) y recorre lo que los dueños llaman **"el camino de la pieza"**:

```mermaid
flowchart LR
    A[Pedido de cotización] --> B[Cotización] --> C[Recepción de Orden de Compra] --> D[Construcción] --> E[Entrega] --> F[Facturación]
```

**Situación actual (problema):** la información está repartida en planillas, archivos y en la memoria de los responsables administrativos. Eso dificulta:

- reutilizar información histórica al cotizar,
- seguir las cotizaciones emitidas,
- contrastar lo planificado con lo realmente ejecutado en el taller.

## 2. Propósito del sistema

Brindar una herramienta informática que permita **administrar el proceso de cotización de piezas industriales y el seguimiento técnico y económico de los trabajos adjudicados**, centralizando la información técnica, económica y documental de cada trabajo.

El sistema deberá:

1. Registrar solicitudes de cotización, clientes, piezas, procesos, costos, materiales, proveedores y antecedentes de cotizaciones, para agilizar nuevos presupuestos.
2. Generar el informe de cotización con el formato propio de Tornería Castro y enviarlo automáticamente por correo electrónico o WhatsApp.
3. Conservar el historial de cotizaciones y de modificaciones de precios y procesos de las piezas.
4. Seguir el estado de cada trabajo adjudicado mediante la hoja de ruta, registrar tiempos y materiales reales y calcular los desvíos respecto de lo planificado.

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

Los usuarios son el personal interno de Tornería Castro. El detalle de actores y sus roles está en `04-actores-y-casos-de-uso.md` §1, y los permisos en `07-matriz-rbac.md`.

| Actor | Rol en una línea |
|---|---|
| Encargado de Recepción (ERP) | Contacto con el cliente; registra solicitudes, OC, entregas y facturas; mantiene clientes y rubros |
| Encargado de Cotización (EC) | Elabora y administra cotizaciones; hereda del AT |
| Administrativo Técnico (AT) | Mantiene catálogos de materiales, tipos de proceso y proveedores |
| Jefe de Taller (JT) | Conduce la producción de las OT y la hoja de ruta |
| Encargado de Reportes (ER) | Obtiene información estadística y gerencial |
| Administrador del Sistema (AS) | Empleados, usuarios y roles |

## 8. Restricciones generales

| ID | Restricción |
|---|---|
| R-01 | No se desarrollan funciones de emisión de remitos o facturas, logística de entrega ni cobranza (ver §5.2). |
| R-02 | Debe ejecutarse sobre el equipamiento actual de la empresa, sin hardware adicional (RNF07). |
| R-03 | Puestos Windows 10+, con Google Chrome o Microsoft Edge vigentes, sin complementos (RNF18). |
| R-04 | WhatsApp solo mediante la **API oficial de WhatsApp Business (Meta)**; prohibida la automatización de WhatsApp Web (RNF20). |

## 9. Glosario del dominio

> Extraído de la ERS, los CU y el modelo de dominio. El glosario completo del cliente está en el Anexo B [GLO].

| Término | Definición |
|---|---|
| **Adjudicación** | Aprobación de la cotización por el cliente, total o parcial, que se concreta con la Orden de Compra. |
| **Borrador** | Estado de una cotización empezada y guardada sin emitir; no corre el plazo de validez. |
| **Camino de la pieza** | Ciclo completo: pedido de cotización → cotización → OC → construcción → entrega → facturación. |
| **Conjunto / Ensamblaje** | Ítem compuesto por piezas hijas más procesos propios del conjunto (ensamblaje, pintura general, tratamiento final). |
| **Cotización (presupuesto)** | Oferta económica formal, con número correlativo, para una solicitud. |
| **Desvío** | Diferencia entre lo planificado (horas, material) y lo real registrado en la hoja de ruta. |
| **Encargado cliente** | Persona de una fábrica cliente que pide cotizaciones. |
| **Fábrica cliente** | Empresa cliente; un particular se registra como fábrica de rubro «Particular». |
| **Hoja de ruta** | Tabla impresa de procesos que acompaña la pieza por el taller, donde cada responsable anota tiempo y observaciones. |
| **Ítem** | Unidad que se presupuesta y que, si se adjudica, se fabrica. |
| **Número de plano** | Identificador de la pieza provisto por el cliente. Sin plano, el sistema genera uno interno (p. ej. `OC-001`). |
| **Orden de Compra (OC)** | Documento o mensaje del cliente que adjudica la cotización; puede ser formal (PDF/Excel) o informal (WhatsApp). |
| **Orden de Trabajo (OT)** | Registro operativo que autoriza y organiza la fabricación de un ítem adjudicado. |
| **Pieza patrón** | Pieza física de muestra provista por el cliente cuando no hay plano; se registra con fotos. |
| **Precio pactado** | Precio acordado con el cliente al adjudicar; queda congelado en la OT (🔁 D-02). |
| **Presentación** | Forma en que se compra el material: cilindro sólido, hexágono, planchuela, caño, cortado por hilo o láser… |
| **Proceso propio** | Trabajo hecho en el taller, cobrado por hora según su tipo (torno manual, CNC, herrería…). |
| **Proceso tercerizado** | Servicio contratado afuera (zincado, galvanizado, tratamiento térmico, corte por hilo), costeado por precio total. |
| **Recotización** | Nueva cotización emitida para la misma solicitud cuando la anterior venció o el cliente pide cambios. |
| **Reparación** | Ítem compuesto por piezas más procesos de reparación (armado, desarmado…). |
| **Seña** | Adelanto solicitado, expresado como porcentaje del precio final. |
