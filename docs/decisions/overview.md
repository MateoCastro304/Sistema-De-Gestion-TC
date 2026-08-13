# Arquitectura del Sistema — Overview

Este documento describe la arquitectura de alto nivel del sistema de gestión de Tornería Castro SRL. Las decisiones técnicas detalladas están en los [ADRs](../decisions/).

---

## Contexto del sistema (C4 Nivel 1)

```
┌─────────────────────────────────────────────────────────┐
│                   Tornería Castro SRL                   │
│                  Sistema de Gestión                     │
│                                                         │
│  ┌──────────────┐    ┌───────────────┐                  │
│  │  Personal    │    │  Personal     │                  │
│  │Administrativo│    │  de Taller    │                  │
│  │(EC, ERP, A,  │    │    (JT)       │                  │
│  │  ER, AT, AS) │    │               │                  │
│  └──────┬───────┘    └──────┬────────┘                  │
│         │                  │                            │
│         └────────┬─────────┘                            │
│                  │                                      │
│          ┌───────▼───────┐                              │
│          │   Frontend    │                              │
│          │  (Web App)    │                              │
│          └───────┬───────┘                              │
│                  │ HTTPS / REST                         │
│          ┌───────▼───────┐   HTTP interno               │
│          │   Backend     ├──────────────► Servicio PDF  │
│          │  (NestJS)     │               (Python)       │
│          └───────┬───────┘                              │
│                  │                                      │
│          ┌───────▼───────┐                              │
│          │  PostgreSQL   │                              │
│          └───────────────┘                              │
│                                                         │
│          ┌───────────────┐                              │
│          │  Filesystem   │  ← Planos, fotos, diseños 3D │
│          │ (local / S3)  │     asociados a cada pieza   │
│          └───────────────┘                              │
└─────────────────────────────────────────────────────────┘
```

---

## Módulos del Backend

El backend se organiza en módulos funcionales alineados con el dominio:

### `auth`

Autenticación y autorización. JWT + Guards de RBAC. Protege todos los endpoints con validación de rol.

### `usuarios`

Gestión de usuarios del sistema (alta, baja, cambio de rol, reseteo de contraseña). Solo accesible por AS.

### `clientes`

CRUD de clientes (empresas industriales como EDASA, CorBlock, OxyCAM). Almacena datos de contacto y formato de cotización preferido.

### `piezas`

Catálogo de piezas cotizadas y fabricadas. Incluye número de plano, ID interno (cuando no hay plano), variantes, archivos adjuntos (planos PDF, diseños 3D).

### `cotizaciones`

Módulo central. Maneja el ciclo de vida de una cotización: creación, desglose por ítems, actualización por dólar, adjudicación total/parcial. Implementa la máquina de estados de Cotización.

### `ordenes-de-trabajo`

Generación y seguimiento de OTs. Implementa la máquina de estados de OrdenDeTrabajo. Registro de procesos planificados y ejecutados. Integra con el módulo de reportes para trazabilidad de rentabilidad.

### `produccion`

Submódulo accesible por JT. Permite registrar avance de procesos y tiempos reales. Sin acceso a datos económicos.

### `reportes`

Estadísticas de decisión: trabajos por empresa, adjudicación de presupuestos, fluctuaciones mensuales, trazabilidad presupuestado vs. real.

### `pdf`

Cliente HTTP que comunica con el servicio Python de generación de PDF. Recibe una cotización (con todos sus datos) y devuelve el archivo PDF al frontend.

### `scheduler`

Jobs programados:

- Vencimiento automático de cotizaciones (diario).
- (Futuro) Alertas de demoras en OTs.

---

## Módulos del Frontend

> ⚠️ Stack frontend pendiente de definición. Esta sección se actualizará una vez confirmado.

Se anticipa una SPA con las siguientes secciones principales:

- Dashboard — resumen de cotizaciones y OTs activas
- Cotizaciones — listado, detalle, creación, adjudicación
- Órdenes de Trabajo — listado, detalle, seguimiento de producción
- Clientes — ABM de clientes
- Piezas — catálogo con historial
- Reportes — estadísticas y métricas
- Configuración — solo AS: usuarios, roles, tipos de proceso, tarifas

---

## Principios de arquitectura

**Sin sobreingeniería para esta escala.** No se usa Redis, Kafka, Kubernetes, ni Event Sourcing. El sistema es un monolito modular con un proceso Python auxiliar para PDFs. Esto es suficiente y mantenible para el equipo y volumen actuales.

**Separación de información pública vs. privada desde el backend.** Los endpoints que devuelven datos de cotización al frontend tienen dos variantes: una con datos completos (roles administrativos) y una sin costos ni márgenes (JT). Nunca se filtra solo en el frontend.

**Jobs con `@nestjs/schedule`.** Suficiente para el vencimiento de cotizaciones y futuras alertas. No requiere infraestructura adicional.

**Almacenamiento de archivos.** Filesystem local en primera instancia. Migración a S3/MinIO posible sin cambios en la lógica de negocio si se abstrae detrás de un servicio de storage.

---

## Pendientes de arquitectura

| Decisión                      | ADR                                                  | Estado                                    |
| ----------------------------- | ---------------------------------------------------- | ----------------------------------------- |
| Framework backend             | [ADR-001](../decisions/001-backend-framework.md)     | Pendiente                                 |
| Base de datos                 | [ADR-002](../decisions/002-base-de-datos.md)         | Recomendado: PostgreSQL                   |
| ORM                           | [ADR-003](../decisions/003-orm.md)                   | Pendiente                                 |
| Generación PDF                | [ADR-004](../decisions/004-generacion-pdf.md)        | Recomendado: Python/WeasyPrint            |
| Autenticación                 | [ADR-005](../decisions/005-autenticacion.md)         | Pendiente                                 |
| Stack frontend                | —                                                    | Sin definir                               |
| Almacenamiento de archivos    | —                                                    | Sin definir (local vs. S3/MinIO)          |
| WhatsApp integration          | —                                                    | Sin definir (API oficial vs. alternativa) |
| Infraestructura de deployment | [ADR-009](../decisions/009-deploy-infrastructure.md) | Pending Aproval                           |
| Integracion de mail           | —                                                    | Sin definir                               |
