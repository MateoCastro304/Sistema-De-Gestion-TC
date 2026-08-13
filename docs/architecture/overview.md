# System Architecture — Overview

This document describes the high-level architecture of Tornería Castro SRL's management system. Detailed technical decisions are in the [ADRs](../decisions/).

---

## System context (C4 Level 1)

```
┌─────────────────────────────────────────────────────────┐
│                   Tornería Castro SRL                   │
│                  Management System                      │
│                                                         │
│  ┌──────────────┐    ┌───────────────┐                  │
│  │Administrative│    │   Workshop    │                  │
│  │    Staff     │    │    Staff      │                  │
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
│          ┌───────▼───────┐   Internal HTTP              │
│          │   Backend     ├──────────────► PDF Service   │
│          │  (NestJS)     │               (Python)       │
│          └───────┬───────┘                              │
│                  │                                      │
│          ┌───────▼───────┐                              │
│          │  PostgreSQL   │                              │
│          └───────────────┘                              │
│                                                         │
│          ┌───────────────┐                              │
│          │  Filesystem   │  ← Drawings, photos, 3D      │
│          │ (local / S3)  │    designs linked to each    │
│          │               │    part                      │
│          └───────────────┘                              │
└─────────────────────────────────────────────────────────┘
```

---

## Backend Modules

The backend is organized into functional modules aligned with the domain:

### `auth`

Authentication and authorization. JWT + RBAC Guards. Protects all endpoints with role validation.

### `usuarios` (users)

Management of system users (creation, deactivation, role changes, password resets). Accessible only by AS.

### `clientes` (clients)

CRUD for clients (industrial companies such as EDASA, CorBlock, OxyCAM). Stores contact details and preferred quotation format.

### `piezas` (parts)

Catalog of quoted and manufactured parts. Includes drawing number, internal ID (when there is no drawing), variants, attached files (PDF drawings, 3D designs).

### `cotizaciones` (quotations)

Core module. Manages the lifecycle of a quotation: creation, breakdown by line items, dollar-rate updates, full/partial award. Implements the Quotation state machine.

### `ordenes-de-trabajo` (work orders)

Generation and tracking of work orders (OTs). Implements the WorkOrder state machine. Records planned and executed processes. Integrates with the reports module for profitability traceability.

### `produccion` (production)

Submodule accessible by JT. Allows recording process progress and actual times. No access to economic data.

### `reportes` (reports)

Decision-making statistics: jobs per company, budget award rates, monthly fluctuations, budgeted-vs-actual traceability.

### `pdf`

HTTP client that communicates with the Python PDF generation service. Receives a quotation (with all its data) and returns the PDF file to the frontend.

### `scheduler`

Scheduled jobs:

- Automatic quotation expiration (daily).
- (Future) Work order delay alerts.

---

## Frontend Modules

> ⚠️ Frontend stack yet to be defined. This section will be updated once confirmed.

An SPA is anticipated with the following main sections:

- Dashboard — summary of active quotations and work orders
- Quotations — listing, detail, creation, award
- Work Orders — listing, detail, production tracking
- Clients — client CRUD
- Parts — catalog with history
- Reports — statistics and metrics
- Settings — AS only: users, roles, process types, rates

---

## Architecture Principles

**No over-engineering for this scale.** No Redis, Kafka, Kubernetes, or Event Sourcing. The system is a modular monolith with an auxiliary Python process for PDFs. This is sufficient and maintainable for the current team and volume.

**Separation of public vs. private information from the backend.** Endpoints that return quotation data to the frontend have two variants: one with full data (administrative roles) and one without costs or margins (JT). Filtering is never done only on the frontend.

**Jobs with `@nestjs/schedule`.** Sufficient for quotation expiration and future alerts. Requires no additional infrastructure.

**File storage.** Local filesystem in the first instance. Migration to S3/MinIO possible without changes to business logic if abstracted behind a storage service.

---

## Pending Architecture Decisions

| Decision                 | ADR                                                  | Status                          |
| ------------------------- | ----------------------------------------------------- | -------------------------------- |
| Backend framework         | [ADR-001](../decisions/001-backend-framework.md)     | Approved                          |
| Database                  | [ADR-002](../decisions/002-base-de-datos.md)         | Approved          |
| ORM                       | [ADR-003](../decisions/003-orm.md)                   | Approved                          |
| PDF generation             | [ADR-004](../decisions/004-generacion-pdf.md)        | Approved   |
| Authentication             | [ADR-005](../decisions/005-autenticacion.md)         | Approved                          |
| Frontend stack             | —                                                    | Undefined                        |
| WhatsApp integration        | —                                                    | Undefined (official API vs. alternative) |
| Mail integration            | —                                                    | Undefined                        |
| Deployment infrastructure and file storage  | [ADR-009](../decisions/009-deploy-infrastructure.md) | Approved                 |
