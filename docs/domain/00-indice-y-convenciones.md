# 00 · Índice y convenciones — Sistema de Gestión Tornería Castro SRL

> **Qué es esto.** La documentación de análisis del sistema (ERS, Casos de Uso y Modelo de Dominio V1.1) organizada en archivos Markdown delimitados. Cada archivo trata un único tema y cada ítem tiene un ID estable que se puede referenciar desde código, tests, issues y PRs.

---

## 1. Índice de archivos

| # | Archivo | Contenido | IDs que define |
|---|---|---|---|
| 00 | `00-indice-y-convenciones.md` | Este archivo: índice y convenciones | — |
| 01 | `01-introduccion-alcance.md` | Flujo propuesto, objetivos, alcance y **no alcance**, perspectiva del producto y restricciones. El contexto, el propósito y los usuarios están en [`vision-general.md`](../vision-general.md); el glosario, en [`glosario.md`](../glosario.md) | `OBJ-xx` |
| 02 | `02-reglas-de-negocio.md` | Las 44 reglas de negocio, tipificadas y trazadas | `RN01`…`RN44` |
| 03 | `03-requerimientos.md` | Requerimientos funcionales (globales y detallados) y no funcionales | `RF01`…`RF11`, `RF01.1`…, `RNF01`…`RNF21` |
| 04 | `04-actores-y-casos-de-uso.md` | Actores, catálogo de 61 CU, diagramas de CU, descripciones de CU 13 y CU 14 | `CU-01`…`CU-61` |
| 05 | `05-modelo-de-dominio.md` | Diagrama de clases (Mermaid) y argumentación | Clases del dominio |
| 06 | `06-maquinas-de-estado.md` | Máquinas de estado de `Cotizacion` y `OrdenDeTrabajo` + tabla evento ↔ CU | Estados y transiciones |
| 07 | `07-matriz-rbac.md` | Roles × operaciones y visibilidad de datos por rol | Permisos |
| 08 | `08-erd.md` *(pendiente)* | Diagrama entidad-relación derivado de `schema.prisma` | — |

**Orden de lectura recomendado para implementar una funcionalidad:** `03` (qué RF) → `04` (qué CU, quién, pasos) → `02` (qué reglas aplican) → `05`/`06` (qué clases y estados toca) → `07` (quién puede y qué ve).

---

## 2. Convenciones

### 2.1 Identificadores (estables: no se renumeran, se deprecan)

| Prefijo | Elemento | Ejemplo | Nota |
|---|---|---|---|
| `RNxx` | Regla de negocio | `RN34` | Numeración de la ERS V1.1 |
| `RFxx` | Requerimiento funcional global | `RF08` | |
| `RFxx.y` | Requerimiento funcional detallado (alcance) | `RF08.3` | Numeración nueva, introducida en esta documentación |
| `RNFxx` | Requerimiento no funcional | `RNF09` | Numeración de la ERS V1.1 |
| `CU-xx` | Caso de uso | `CU-23` | Numeración del documento de CU V1.1 |
| `D-xx` | Decisión de análisis posterior a la V1.1 | `D-02` | Indica qué cambió respecto de la V1.1 |

Si un ítem se elimina, **no se reutiliza su número**: se marca `~~DEPRECADO~~` con el motivo.

### 2.2 Marcas en el texto

| Marca | Significado |
|---|---|
| *(sin marca)* | Transcripción fiel de la documentación V1.1 |
| `🔁 D-xx` | Texto modificado respecto de la documentación V1.1 |
| `⚠️ SUPUESTO` | Inferencia del analista no confirmada explícitamente por el cliente; validar antes de implementar si es crítica |

### 2.3 Nomenclatura (alineada con el modelo de dominio)

| Elemento | Convención | Ejemplo |
|---|---|---|
| Clase | PascalCase, singular | `OrdenDeTrabajo`, `ItemCotizacion` |
| Atributo | camelCase | `fechaVtoOferta`, `estaDemorado` |
| Método / evento | camelCase con `()` | `adjudicar()`, `marcarDemorado()` |
| Estado | PascalCase compacto (como en los diagramas) | `PteCotizacion`, `EnConstruccion` |
| Caso de uso | Frase verbal en infinitivo | `Registrar Orden de Compra` |

### 2.4 Abreviaturas de actores

`JT` Jefe de Taller · `ERP` Encargado de Recepción · `ER` Encargado de Reportes · `EC` Encargado de Cotización · `AT` Administrativo Técnico · `AS` Administrador del Sistema · `US` Usuario (genérico) · `SC` Servidor de Correo · `SM` Servidor de Mensajería · `T` Temporizador.

---

## 3. Historial

| Versión | Fecha | Responsable | Cambios |
|---|---|---|---|
| DOM 1.0 | 15/10/2026 | M. Castro | Primera versión en Markdown. Hace referencia a la documentación V1.1 (ERS, Casos de Uso y Modelo de Dominio). |
