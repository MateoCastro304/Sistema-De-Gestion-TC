# ADR-002 — Database

**Date:** 2026-08  
**Status:** Recommended (pending formal confirmation)  
**Decision makers:** Technical team

---

## Context

The system handles a complex relational domain: quotes with multiple items (Composite), work orders with planned and executed processes, price change history, SEQUENCEs for correlative numbers, and relationships between customers, parts, and drawings.

## Options evaluated

### Option A: PostgreSQL

Relational database with native support for SEQUENCEs, integrity constraints, ACID transactions, JSON for semi-structured data when needed, and views for reporting.

**Pros:**
- Native SEQUENCEs for the correlative quote number (RN-04) — the only correct approach under concurrency.
- Database-level constraints as a second line of defense for critical invariants (immutable price post-award).
- Robust support for reporting and statistics queries.
- Mature ecosystem with Prisma and TypeORM.
- Stable migration tooling.

**Cons:**
- None relevant to this use case.

### Option B: MySQL / MariaDB

Similar in general capabilities, but with a somewhat more limited tooling ecosystem in the Node.js context and less expressiveness in SEQUENCEs (AUTO_INCREMENT is not equivalent in all scenarios).

### Option C: MongoDB

Document database. Unsuitable for this domain: the system has strong relationships, critical referential integrity, and needs SEQUENCEs that don't exist natively in MongoDB.

## Decision

**PostgreSQL**. It is the only correct option for this relational domain. SEQUENCEs for the correlative number and constraints for price invariants have no adequate substitute in other options.

## Implementation notes

- Use `CREATE SEQUENCE` for the quote number, not `MAX(id) + 1` in the application.
- Evaluate database constraints for locking the price post-award.
- Use versioned migrations from the start (Prisma Migrate or Flyway).
