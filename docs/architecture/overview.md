# Arquitectura del sistema — Visión general

Este documento describe la arquitectura de alto nivel del sistema de gestión de Tornería Castro SRL. Las decisiones técnicas detalladas están en los [ADR](../decisions/).

---

## Contexto del sistema (C4 nivel 1)

```
┌─────────────────────────────────────────────────────────┐
│                   Tornería Castro SRL                    │
│                   Sistema de gestión                    │
│                                                         │
│  ┌───────────────┐    ┌───────────────┐                  │
│  │   Personal    │    │   Personal    │                  │
│  │administrativo │    │  de taller    │                  │
│  │(EC, ERP, A,   │    │    (JT)       │                  │
│  │  ER, AT, AS)  │    │               │                  │
│  └──────┬────────┘    └──────┬────────┘                  │
│         │                   │                           │
│         └────────┬──────────┘                           │
│                  │                                      │
│          ┌───────▼───────┐                              │
│          │   Frontend    │                              │
│          │ (React SPA)   │                              │
│          └───────┬───────┘                              │
│                  │ HTTPS / REST                         │
│          ┌───────▼───────┐   HTTP interno               │
│          │   Backend    ├──────────────► Servicio PDF   │
│          │  (NestJS)    │               (Python)       │
│          └───────┬───────┘                              │
│                  │                                      │
│          ┌───────▼───────┐                              │
│          │  PostgreSQL   │                              │
│          └───────────────┘                              │
│                                                         │
│          ┌───────────────┐                              │
│          │  Amazon S3    │  ← Planos, fotos y diseños    │
│          │ (almacén de   │    3D vinculados a cada       │
│          │   objetos)    │    pieza                      │
│          └───────────────┘                              │
└─────────────────────────────────────────────────────────┘
```

---

## Módulos del backend

El backend está organizado en módulos funcionales alineados con el dominio:

### `auth`

Autenticación y autorización. JWT + Guards de RBAC. Protege todos los endpoints mediante validación de roles.

### `usuarios`

Gestión de usuarios del sistema (creación, desactivación, cambios de rol, restablecimiento de contraseñas). Accesible solo para AS.

### `clientes`

CRUD de clientes (empresas industriales como EDASA, CorBlock, OxyCAM). Almacena datos de contacto y formato preferido de cotización.

### `piezas`

Catálogo de piezas cotizadas y fabricadas. Incluye número de plano, ID interno (cuando no hay plano), variantes y archivos adjuntos (planos PDF, diseños 3D).

### `cotizaciones`

Módulo central. Gestiona el ciclo de vida de una cotización: creación, desglose por ítems, actualizaciones del tipo de cambio del dólar y adjudicación total/parcial. Implementa la máquina de estados de cotización.

### `ordenes-de-trabajo`

Generación y seguimiento de órdenes de trabajo (OT). Implementa la máquina de estados de WorkOrder. Registra procesos planificados y ejecutados. Se integra con el módulo de reportes para la trazabilidad de rentabilidad.

### `produccion`

Submódulo accesible para JT. Permite registrar avances de procesos y tiempos reales. Sin acceso a datos económicos.

### `reportes`

Estadísticas para tomar decisiones: trabajos por empresa, tasas de adjudicación de presupuestos, variaciones mensuales y trazabilidad entre lo presupuestado y lo real.

### `pdf`

Cliente HTTP que se comunica con el servicio Python de generación de PDF. Recibe una cotización (con todos sus datos) y devuelve el archivo PDF al frontend.

### `notificaciones`

Envía el PDF de cotización al cliente por correo electrónico (Amazon SES o un proveedor externo, ver [ADR-007](../decisions/007-mail-integration.md)) y WhatsApp (AWS End User Messaging Social o un BSP externo, ver [ADR-008](../decisions/008-whatsapp-integration.md)). Se activa al enviar la cotización (UC-21); la vigencia de la oferta comienza con ese envío (RN-06). No procesa ni automatiza las conversaciones posteriores con el cliente.

### `scheduler`

Tareas programadas:

- Vencimiento automático de cotizaciones (diario).
- (Futuro) Alertas de demora en órdenes de trabajo.

---

## Módulos del frontend

El frontend es una **SPA React + TypeScript** compilada con Vite y servida como archivos estáticos mediante Nginx. Ver [ADR-006](../decisions/006-frontend-stack.md) para los fundamentos completos y las bibliotecas complementarias.

La SPA se organiza en las siguientes secciones principales:

- Panel principal — resumen de cotizaciones y órdenes de trabajo activas
- Cotizaciones — listado, detalle, creación y adjudicación
- Órdenes de trabajo — listado, detalle y seguimiento de producción
- Clientes — CRUD de clientes
- Piezas — catálogo con historial
- Reportes — estadísticas y métricas
- Configuración — solo AS: usuarios, roles, tipos de proceso y tarifas

---

## Principios de arquitectura

**Sin sobrediseño para esta escala.** Sin Redis, Kafka, Kubernetes ni Event Sourcing. El sistema es un monolito modular con un proceso Python auxiliar para PDF. Es suficiente y mantenible para el equipo y el volumen actuales (ver [ADR-009](../decisions/009-deploy-infrastructure.md)).

**Separación de información pública y privada desde el backend.** Los endpoints que devuelven datos de cotización al frontend tienen dos variantes: una con datos completos (roles administrativos) y otra sin costos ni márgenes (JT). El filtrado nunca se realiza únicamente en el frontend.

**Tareas con `@nestjs/schedule`.** Suficiente para el vencimiento de cotizaciones y futuras alertas. No requiere infraestructura adicional.

**Almacenamiento de archivos.** Amazon S3 para almacenamiento persistente de objetos (planos, fotos, diseños 3D y PDF generados), abstraído mediante un servicio de almacenamiento para poder cambiar el proveedor sin afectar la lógica de negocio. Ver [ADR-009](../decisions/009-deploy-infrastructure.md).

**Despliegue.** Docker Compose en una única instancia Amazon EC2, con Nginx como proxy inverso/punto de entrada HTTPS, PostgreSQL como contenedor con almacenamiento persistente y GitHub Actions para CI/CD. CloudWatch gestiona métricas y registros de infraestructura; Sentry gestiona el seguimiento de errores de la aplicación. Ver [ADR-009](../decisions/009-deploy-infrastructure.md).

---

## Decisiones de arquitectura (ADR)

| Decisión | ADR | Estado |
| ------------------------- | ----------------------------------------------------- | -------------------------------- |
| Framework del backend | [ADR-001](../decisions/001-backend-framework.md) | Aprobado |
| Base de datos | [ADR-002](../decisions/002-data-base.md) | Aprobado |
| ORM | [ADR-003](../decisions/003-orm.md) | Aprobado |
| Generación de PDF | [ADR-004](../decisions/004-generate-pdf.md) | Aprobado |
| Autenticación | [ADR-005](../decisions/005-autentication.md) | Aprobado |
| Tecnologías del frontend | [ADR-006](../decisions/006-frontend-stack.md) | Aprobado |
| Integración de correo | [ADR-007](../decisions/007-mail-integration.md) | Orientación arquitectónica aprobada; proveedor pendiente de presupuesto |
| Integración de WhatsApp | [ADR-008](../decisions/008-whatsapp-integration.md) | Orientación arquitectónica aprobada; proveedor pendiente de presupuesto |
| Infraestructura de despliegue y almacenamiento de archivos | [ADR-009](../decisions/009-deploy-infrastructure.md) | Aprobado |
