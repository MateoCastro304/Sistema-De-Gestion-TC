# ADR-014 — Subsistemas del backend

**Fecha:** 2026-10  
**Estado:** Propuesta  
**Responsables de la decisión:** Equipo técnico

---

## Contexto y problema

El backend es un monolito modular. Cada subsistema es un hexágono propio ([ADR-013](013-arquitectura-interna-backend.md)). Falta fijar **cuáles son esos subsistemas**: qué agregados agrupa cada uno y qué tablas puede escribir. Sin ese mapa, cada integrante decide dónde poner una entidad nueva, y las fronteras se definen por accidente.

Hoy existen dos subsistemas:

- `customers`: rubros, fábricas y encargados.
- `supplier`: proveedores.

El documento [visión general de arquitectura](../arquitectura/overview.md#backend) lista otros cinco módulos (`identity`, `customers`, `employees`, `supplier`, `technicalCatalog`). Esa lista no coincide con el código ni con la documentación funcional.

La documentación de [funcionalidades](../funcionalidades/) ya divide el negocio en áreas con reglas y casos de uso propios. Es la partición que el equipo usa para hablar del sistema y para repartir el trabajo.

Los archivos (pedido en PDF, planos, fotos de la pieza patrón, modelos 3D) se guardan en S3 ([ADR-009](009-deploy-infrastructure.md)). Pertenecen a entidades de distintas áreas: solicitud, pieza, cotización y orden de trabajo. La tabla `file` los vincula de forma polimórfica, mediante `entity_type` + `entity_id`, sin clave foránea real.

## Decisión

**Un subsistema por funcionalidad documentada, más un subsistema `files` para los archivos.**

| Carpeta (`backend/src/subsystems/`) | Funcionalidad | Agregados del dominio | Estado |
| --- | --- | --- | --- |
| `customers` | [Clientes, fábricas y rubros](../funcionalidades/clientes.md) | Rubro, FabricaCliente, EncargadoCliente | Implementado |
| `technical-catalog` | [Catálogos técnicos](../funcionalidades/catalogos-tecnicos.md) | Proveedor, Material, TipoProceso (con su historial de precio), cotización del dólar y parámetros del negocio (RNF15: validez de la oferta, % de seña) | Proveedores implementados en `subsystems/supplier`, pendientes de mover. El resto, contratado en el Sprint 2 y sin implementar |
| `identity` | [Usuarios y empleados](../funcionalidades/usuarios-y-empleados.md) | Usuario, Rol, Sesión, RefreshToken, Empleado | Contratado en el Sprint 2, sin implementar |
| `quoting` | [Solicitudes y cotizaciones](../funcionalidades/cotizaciones.md) | SolicitudCotizacion, Cotizacion, ItemCotizacion (Composite), Descuento, HistorialCambio, ProcesoPlanificado, Repuesto | Propuesto |
| `work-orders` | [Órdenes de trabajo](../funcionalidades/ordenes-de-trabajo.md) | OrdenDeTrabajo, EjecucionProceso, Remito, Factura | Propuesto |
| `reporting` | [Reportes](../funcionalidades/reportes.md) | Ninguno: solo modelos de lectura | Propuesto |
| `files` | Transversal; sin funcionalidad propia | Archivo (tabla `file`) y su almacenamiento en S3 | Propuesto |

Notas sobre la tabla:

- Los nombres de carpeta están en inglés y en *kebab-case*. Los de los agregados son los del [modelo de dominio](../dominio/05-modelo-de-dominio.md).
- `identity` reúne usuarios y empleados porque la funcionalidad es una sola. La regla de que la baja del empleado desactiva su usuario ([RN44](../dominio/02-reglas-de-negocio.md)) se resuelve **dentro** del subsistema, sin puertos.
- `reporting` es la única excepción a la regla general: lee la base directamente y nunca escribe. El detalle está en la [arquitectura del backend](../arquitectura/backend.md#reporting-solo-lectura).

### Propiedad del dato

Cada subsistema escribe solo en sus tablas. Las claves foráneas entre tablas de distintos subsistemas están permitidas.

| Subsistema | Tablas que escribe |
| --- | --- |
| `customers` | `category`, `factory_customer`, `manager_customer` |
| `technical-catalog` | `supplier`, `material`, `process_type`, `process_type_price_history`, `exchange_rate` |
| `identity` | `employee`, `app_user`, `user_role`, `user_session`, `refresh_token` |
| `quoting` | `quote_request` y las tablas de cotización, ítem, descuento e historial que se creen |
| `work-orders` | Las tablas de orden de trabajo, ejecución, remito y factura que se creen |
| `files` | `file` |
| `reporting` | Ninguna |

### Subsistema `files`

- **Qué tiene.** Es dueño de la tabla `file` y de un puerto de almacenamiento (`FileStoragePort`). La implementación de producción usa S3. La de desarrollo todavía no está definida: [`storage.config.ts`](../../backend/src/config/storage.config.ts) prevé un *driver* `local`, y el [backlog de ingeniería](../seguimiento/engineering-backlog.md#9-infraestructura-aws) menciona MinIO.
- **Qué no expone.** No hay un alta genérica de archivos.
- **Quién valida la entidad.** Lo hace el subsistema dueño de la entidad a la que pertenece el archivo. Primero valida esa entidad: que exista, que esté activa y que el usuario tenga permiso. Después invoca, mediante su adaptador anticorrupción, el caso de uso de registro de `files`. Por ejemplo, para adjuntar un plano a una pieza, `quoting` valida la pieza y llama a `files`.
- **Por qué así.** `entity_id` se valida donde está el conocimiento sobre esa entidad, y `files` no depende de ningún otro subsistema.
- **Orden de las operaciones.** La subida a S3 se hace **fuera** de la transacción de base de datos.

## Alternativas consideradas

### Para la partición

- **Un subsistema por entidad del modelo de dominio.** Produciría decenas de módulos con fronteras artificiales. Por ejemplo, ItemCotizacion separado de Cotizacion, cuando sus reglas cambian juntas.
- **Los módulos de la visión general de arquitectura.** Separa `employees` de `identity` y `supplier` de `technicalCatalog`, lo que no coincide con las funcionalidades documentadas.

### Para los archivos

| Alternativa | Por qué no se eligió |
| --- | --- |
| Registro de validadores: `files` expone un alta genérica y valida `entity_id` con un validador por `entity_type`, que implementa cada subsistema dueño | `files` pasaría a depender de todos los subsistemas que tienen archivos |
| Tablas puente con FK real (`part_file`, `quote_request_file`, …) | Requiere una migración del esquema y contradice la convención actual de FK polimórfica |
| Archivos como infraestructura dentro de `shared/` | Rompe la regla de admisión de `shared/`: el tipo de documento (`DocumentType`) es un concepto del negocio |

## Consecuencias

- Una persona asignada a una funcionalidad trabaja, en general, dentro de un único subsistema.
- `technical-catalog` e `identity` agrupan varios agregados. Su módulo NestJS va a ser más grande que el resto. Se acepta porque sus reglas cambian juntas.
- La integridad de `file.entity_id` sigue sin estar garantizada por la base de datos. Depende de que todo alta pase por el subsistema dueño de la entidad.
- La tabla de módulos de la [visión general de arquitectura](../arquitectura/overview.md#backend) queda desactualizada respecto de esta decisión.

## Referencias y pendientes

- [Arquitectura del backend](../arquitectura/backend.md) y [ADR-013](013-arquitectura-interna-backend.md).
- **Mover `subsystems/supplier` a `subsystems/technical-catalog`.** Es un refactor sin cambio funcional, registrado en [pendientes actuales (A-05)](../seguimiento/pendientes-actuales.md#a-05--p2--mover-supplier-a-technical-catalog).
- **Frontera entre `quoting` y `work-orders`.** La orden de trabajo referencia ItemCotizacion, CompraDeMaterial y ProcesoPlanificado, y la Pieza se usa en las dos áreas. Falta definir qué subsistema es dueño de cada tabla: [DA-01](../arquitectura/backend.md#decisiones-pendientes).
- **Creación de la orden de trabajo al adjudicar un ítem** ([RN33](../dominio/02-reglas-de-negocio.md), transición C8 de la [máquina de estados](../dominio/06-maquinas-de-estado.md)): [DA-02](../arquitectura/backend.md#decisiones-pendientes).
