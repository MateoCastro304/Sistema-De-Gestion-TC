# Arquitectura del sistema — Visión general

Este documento describe la arquitectura de alto nivel del sistema de gestión de Tornería Castro SRL siguendo el progreso por sprint. Actualmente estamos en el sprint 2. Las decisiones técnicas detalladas están en los [ADR](../decisions/).

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

El backend está organizado en módulos funcionales alineados con el dominio. En este sprint 2 tenemos hasta: 


### `identity`

Gestión de usuarios del sistema, Autenticación y autorización. (creación, desactivación, cambios de rol, restablecimiento de contraseñas, guards de RBC)..

### `customers`

Subsistema conformado por las entidades/componentes Rubro, Encargados, Fabricas.

### `employees`

Employees.  

### `supplier`

Supplier

### `technicalCatalog`

technicalCatalog va a contener Materiales y TipoProcesos


---

## Módulos del frontend

El frontend es una **SPA React + TypeScript** compilada con Vite y servida como archivos estáticos mediante Nginx. Ver [ADR-006](../decisions/006-frontend-stack.md) para los fundamentos completos y las bibliotecas complementarias.

La SPA se organiza en las siguientes secciones principales:


- Solicitud de Cotizaciones — Listado, detalle, creación y adjudicación.

- Clientes — CRUD de encargado, fabrica y rubros.

- Gestion — CRUD de proveedores, CRUD de materiales, CRUD de Tipo de Proceso.
- Administracion — CRUD  de usuarios, CRUD de empleados. 

---

## Principios de arquitectura

**Sin sobrediseño para esta escala.** Sin Redis, Kafka, Kubernetes ni Event Sourcing. El sistema es un monolito modular con un proceso Python auxiliar para PDF. Es suficiente y mantenible para el equipo y el volumen actuales (ver [ADR-009](../decisions/009-deploy-infrastructure.md)).

**Separación de información pública y privada desde el backend.** Los endpoints que devuelven datos de cotización al frontend tienen dos variantes: una con datos completos (roles administrativos) y otra sin costos ni márgenes (JT). El filtrado nunca se realiza únicamente en el frontend.


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
