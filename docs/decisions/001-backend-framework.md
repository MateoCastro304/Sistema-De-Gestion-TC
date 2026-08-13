# ADR-001 — Backend Framework

**Date:** 2026-08  
**Status:** Pending decision  
**Decision makers:** Technical team

---

## Context

The system requires a Node.js/TypeScript backend that supports a rich domain: two state machines, a Composite pattern in quote items, RBAC with multiple roles, PDF generation delegated to a Python service, and scheduled jobs for quote expiration.

## Options evaluated

### Option A: NestJS

Opinionated framework with a modular, layered rich-domain architecture (modules, controllers, services, guards). Includes native support for dependency injection, decorators, RBAC via Guards, TypeORM/Prisma integration, and `@nestjs/schedule` for jobs.

**Pros:**
- Predefined structure reduces architecture decisions for the team.
- Native Guards for RBAC simplify role-based access control.
- `@nestjs/schedule` covers expiration and delay jobs without extra dependencies.
- Better long-term maintainability as the team rotates.
- Mature ecosystem with modules for nearly everything the system needs.

**Cons:**
- Learning curve if the team is unfamiliar with decorators and the DI system.
- More initial boilerplate.

### Option B: Manual Express

Minimalist framework with no imposed structure. Requires deciding and building the architecture from scratch (routing, middleware, DI, guards, etc.).

**Pros:**
- Full control over every layer.
- Less abstraction = easier to debug for experienced devs.

**Cons:**
- Without imposed structure, projects of this size tend to diverge in quality across modules.
- Everything NestJS already provides must be built manually: RBAC guards, dependency injection, scheduler.
- More initial setup time with no business value.

## Provisional recommendation

**NestJS**, given the team size and domain complexity. The imposed structure is an advantage, not a cost, when multiple modules must grow in parallel.

## Decision

The final decision is to adopt **NestJS** as the backend framework.
