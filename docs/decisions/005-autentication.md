# ADR-005 — Authentication and Authorization

**Date:** 2026-08  
**Status:** Decision pending  
**Decision makers:** Technical team

---

## Context

The system has 7 roles with different permissions, including a critical separation between administrative staff (access to costs) and shop floor staff (only process times). Authentication must be secure, simple to operate, and suitable for an internal-use application.

## Options evaluated

### Option A: JWT (JSON Web Tokens)

Signed tokens that contain the user payload (id, role) and are verified without querying the database.

**Pros:**
- Stateless on the server: scales horizontally without shared sessions.
- Direct integration with NestJS Guards for RBAC.
- Standard known by most devs.
- Ideal if a mobile app is added in the future or the API is exposed to third parties.

**Cons:**
- No native revocation mechanism before expiration. If a user is disabled, their token remains valid until it expires.
- Requires explicit handling of the refresh token for long sessions.
- The token payload travels with every request: don't store sensitive data (margins, costs) in the token.

**Revocation mitigation:** a blocklist of revoked tokens in memory or Redis (although it was decided not to use Redis, a table in PostgreSQL with TTL may be enough for this volume).

### Option B: Sessions (express-session / @nestjs/session)

The server keeps session state in memory or in the database. The client receives only a session ID.

**Pros:**
- Immediate revocation: deleting the session on the server = user logged out.
- Simpler to reason about the authentication state.

**Cons:**
- Stateful: scaling horizontally requires a shared store (Redis or another).
- Less portable if a public API or mobile app is added in the future.

## Authorization model (RBAC)

Regardless of the chosen authentication mechanism, the system uses **role-based RBAC** (not granular permissions). Each endpoint declares which roles have access.

| Module | Roles with access |
|--------|-----------------|
| Quotes (read + create) | EC, AT, AS, A |
| Quotes (internal costs) | EC, AT, AS |
| Work Orders (read) | JT, EC, ERP, AT, AS |
| Work Orders (record processes/times) | JT, AT, AS |
| Reports | ER, AT, AS |
| System configuration | AS |
| User management | AS |

The critical separation is that **JT never accesses financial data**. This must be validated both in the backend (Guard) and in the frontend (hiding the UI).

## Decision

**JWT** with refresh tokens and a table of revoked tokens in PostgreSQL for sessions terminated early. It is the most portable and standard option for this type of application.

For authorization, a **role-based RBAC** will be implemented with Guards in NestJS.