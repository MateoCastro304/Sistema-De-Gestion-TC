# Inconsistencias documentales

Diferencias entre documentos detectadas durante la reorganización de la documentación (octubre de 2026). Se registran sin resolverlas: cada documento conserva su formulación hasta que el equipo decida cuál es la vigente.

## Resumen

| # | Inconsistencia | Estado |
|---|---|---|
| DOC-01 | Estados de los ADR: encabezados, texto de la decisión y tabla de arquitectura | Abierta |
| DOC-02 | Frecuencia de respaldos: RNF14 frente a ADR-009 | Abierta |
| DOC-03 | Formato del informe de cotización: RN30 frente a ADR-004 | Abierta |
| DOC-04 | Referencias a reglas en ADR-008 | Abierta |
| DOC-05 | Roles y accesos de ADR-005 y de la arquitectura frente al dominio | Abierta |
| DOC-06 | Organización y ejecución de las pruebas | Abierta |
| DOC-07 | Tipos por proveedor: modelo de dominio frente al prototipo | Abierta |
| DOC-08 | Decisiones `D-xx` sin catálogo y con identificadores repetidos | Abierta |
| DOC-09 | Archivos citados que no existen en el repositorio | Abierta |
| DOC-10 | Ítems de documentación del backlog de ingeniería | Abierta |
| DOC-11 | `make migrate` documentado pero inexistente en el `Makefile` | Corregido en SETUP; abierta en `infrastructure/docker/README.md` |
| DOC-12 | Módulos del backend: arquitectura frente al código | Abierta |

---

## Estados de los ADR

### DOC-01 · Estados de los ADR

- ADR-001, ADR-003, ADR-005 y ADR-006 tienen estado **Decisión pendiente**; ADR-002 y ADR-004, **Recomendado** (pendiente de confirmación); ADR-009, **Pendiente de aprobación**. Sin embargo, el apartado «Decisión» de ADR-001, 003 y 006 dice «La decisión final es adoptar…», y los demás formulan la elección como adoptada.
- La tabla de [arquitectura](../architecture/overview.md#decisiones-de-arquitectura-adr) muestra ADR-001 a 006 y ADR-009 como **Aprobado**, y no incluye ADR-010 (**Aceptado**, implementado parcialmente).

**A resolver:** confirmar el estado de cada ADR y alinear encabezado, texto y tabla.

## Requisitos y ADR

### DOC-02 · Frecuencia de respaldos

[RNF14](../domain/03-requerimientos.md#rnf14--confiabilidad--backups-y-recuperación) exige respaldo automático **diario** de la base y los adjuntos, conservando **≥ 15 copias** (RPO ≤ 24 h). [ADR-009](../decisions/009-deploy-infrastructure.md) propone una **frecuencia semanal** de respaldos.

### DOC-03 · Formato del informe de cotización

[RN30](../domain/02-reglas-de-negocio.md#rn30--formato-y-contenido-del-informe-de-cotización) establece que el informe se emite en el **formato propio de Tornería Castro**, cualquiera sea el formato que pida el cliente. [ADR-004](../decisions/004-generate-pdf.md) parte de que **cada cliente puede tener un formato específico** y prevé plantillas por formato de cliente.

### DOC-04 · Referencias a reglas en ADR-008

[ADR-008](../decisions/008-whatsapp-integration.md) liga la vigencia de la oferta al envío mediante «RN-06», pero en el [catálogo de reglas](../domain/02-reglas-de-negocio.md) RN06 es «Identificación y documentación de la pieza»; la validez de la oferta está en RN29. Además, ADR-007 y ADR-008 citan los casos de uso como `UC-xx` y ADR-008 las reglas como `RN-xx`, distinto de `CU-xx` y `RNxx` del dominio.

## Roles y permisos

### DOC-05 · Roles y accesos de ADR-005 y de la arquitectura

- [ADR-005](../decisions/005-autentication.md) menciona **7 roles** y su tabla de autorización incluye el rol `A`; el [catálogo de actores](../domain/04-actores-y-casos-de-uso.md#11-catálogo) define seis roles (JT, ERP, ER, EC, AT, AS). La [arquitectura](../architecture/overview.md) también incluye `A` entre el personal administrativo.
- La tabla de ADR-005 asigna accesos distintos de las matrices del dominio (por ejemplo, Cotizaciones a AT y AS, y Reportes a AT y AS). Las asignaciones de referencia del dominio están en la [Matriz de permisos](../domain/Matriz%20de%20permisos.md) y la [matriz RBAC](../domain/07-matriz-rbac.md).

**Resuelto aparte:** la diferencia de CU-55 y CU-56 entre la matriz RBAC y la Matriz de permisos se resolvió a favor de esta última (CU-55: EC; CU-56: ER).

## Testing

### DOC-06 · Organización y ejecución de las pruebas

- [Estructura de pruebas de QA](../testing/code-structure.md) separa las pruebas de integración (`int/`) y de API (`api/`); el [README de la suite](../../backend/test/README.md) documenta tests de integración que verifican contrato y base en el mismo test.
- La guía indica que CI ejecuta `test:int` y `test:api` en cada push; [ADR-010](../decisions/010-continuous-integration.md) ubica las pruebas de integración en el nivel de validación previo a `main`.
- La guía describe una suite `e2e/` en la raíz del repositorio, que todavía no existe.

## Modelo y prototipo

### DOC-07 · Tipos por proveedor

El [modelo de dominio](../domain/05-modelo-de-dominio.md) asocia cada proveedor con **un** `TipoProveedor`; el [contexto del prototipo](../prototipo/fuente/CONTEXTO.md#sprint-1) admite **varios tipos** por proveedor.

## Trazabilidad

### DOC-08 · Decisiones `D-xx`

El dominio marca textos modificados con `🔁 D-01`, `🔁 D-02` y `🔁 D-03` ([convenciones, §2.2](../domain/00-indice-y-convenciones.md#22-marcas-en-el-texto)), pero no existe un catálogo de esas decisiones: [02-reglas-de-negocio.md](../domain/02-reglas-de-negocio.md) remitía a un «§4» de `00-indice-y-convenciones.md` que no existe. Además, [pendientes actuales](pendientes-actuales.md) usa `D-02` y `D-03` para decisiones de proceso distintas (merge de PR y promoción a `main`). El [backlog de ingeniería](engineering-backlog.md) usa a su vez `I-01`, `I-02`, `I-04` e `I-05`, identificadores del `pendientes-sprint-1.md` ausente.

### DOC-09 · Archivos citados que no existen

| Archivo citado | Dónde se cita |
|---|---|
| `docs/testing/estrategia-qa.md` | [Casos de prueba](../testing/test-cases-structure.md) |
| `docs/database/README.md`, `docs/prototipo/LEEME.md`, `docs/decisions/decisiones-clientes-fabricas.md`, `docs/seguimiento/pendientes-sprint-1.md`, `docs/seguimiento/inconsistencias-clientes-fabricas.md` | Índice anterior de [docs/README.md](../README.md) |
| `docs/pendientes-sprint-1.md` | [Pendientes actuales](pendientes-actuales.md) y [backlog de ingeniería](engineering-backlog.md#6-documentación) |
| `docs/decisiones-clientes-fabricas.md`, `docs/inconsistencias-clientes-fabricas.md` | [Backlog de ingeniería](engineering-backlog.md#6-documentación) |
| Fuentes V1.1 (ERS, Casos de Uso, Modelo de Dominio y diagramas `.png`) | Encabezados de `domain/` y del [contexto del prototipo](../prototipo/fuente/CONTEXTO.md) (en `uploads/`) |

### DOC-10 · Ítems de documentación del backlog de ingeniería

La sección 6 del [backlog de ingeniería](engineering-backlog.md#6-documentación) pide **traducir al inglés** varios documentos «según la regla de `CONTRIBUTING`», pero [CONTRIBUTING](../CONTRIBUTING.MD#idioma) establece hoy que la documentación se escribe en español. Los archivos que menciona ese ítem, salvo `backend/test/README.md`, no existen (ver DOC-09).

### DOC-11 · `make migrate`

El `Makefile` solo define `migrate-dev`, `migrate-deploy` y `migrate-create` (`migrate` aparece en `.PHONY` sin receta). [SETUP.md](../SETUP.md) ya usa `make migrate-dev`; [`infrastructure/docker/README.md`](../../infrastructure/docker/README.md) todavía indica `make migrate`.

**A resolver:** actualizar ese README o agregar el target `migrate` al `Makefile`.

### DOC-12 · Módulos del backend

La [arquitectura](../architecture/overview.md#backend) lista los módulos `identity`, `customers`, `employees`, `supplier` y `technicalCatalog`; `backend/src/` contiene hoy `categories`, `customers`, `factory`, `suppliers`, `health`, `config` y `shared`.
