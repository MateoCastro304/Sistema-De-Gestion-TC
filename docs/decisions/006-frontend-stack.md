# ADR-006 — Frontend Stack

**Date:** 2026-08  
**Status:** Decision pending  
**Decision makers:** Technical team

---

## Context

The system requires an internal-use web interface with the sections described in the [architecture overview](../architecture/overview.md): dashboard, quotations, work orders, clients, parts, reports, and settings. It is an application intensive in forms and tables, not a content site. Every screen is behind authentication, so there are no SEO requirements.

Two constraints shape the decision. First, the backend is TypeScript (NestJS, see ADR-001-backend-framework.md), so choosing the same language on the client allows sharing the API contract types. Second, the UI must reflect the RBAC defined in ADR-005-autentication.md: the JT role must not see costs or margins, hidden in the frontend and enforced in the backend.

## Options evaluated

### Option A: React + TypeScript

Component library with the largest ecosystem in the frontend landscape, bundled with Vite and compiled to static files.

**Pros:**
- Same language as the backend: types can be generated from the API contract, so a change breaks compilation instead of failing at runtime.
- Largest ecosystem and hiring pool, which matters as the team rotates.
- Conditional rendering by role is plain JavaScript: the RBAC-driven UI stays readable and easy to audit.
- The build produces static assets served directly by Nginx, with no additional process in the deployment defined in ADR-009-deploy-infrastructure.md.
- Recursive components fit the quotation builder's nested line items naturally.

**Cons:**
- It is a library, not a framework: routing, server state, and forms require external libraries.
- It imposes no project structure, so conventions must be enforced with ESLint and code review.

### Option B: Angular + TypeScript

Complete framework, TypeScript-first, with routing, HTTP client, and forms included.

**Pros:**
- Imposed structure and a decorator- and DI-based approach similar to NestJS.
- Reactive Forms fit validation-heavy forms such as the quotation builder well.

**Cons:**
- Steepest learning curve: modules, RxJS, and change detection must be understood before becoming productive.
- RxJS is mandatory for most asynchronous flows, a significant cost for a team that does not use it.
- Smaller ecosystem and hiring pool than React.

### Option C: Next.js

React with server-side rendering and API routes. Rejected without further analysis: SSR provides no benefit for an application entirely behind authentication, it adds a Node.js runtime to production, and its API routes overlap with the existing NestJS backend.

## Supporting libraries

React does not cover routing, server state, or forms. The stack is completed with **Vite** (build), **React Router** (routing and route guards by role), **TanStack Query** (server state and caching), **React Hook Form + Zod** (forms and validation), and **Axios** (HTTP client with interceptors for the JWT).

A global store (Redux, Zustand) is not adopted: most state is server state, already handled by TanStack Query.

## Provisional recommendation

**React + TypeScript**, for language continuity with the backend and for the size of its ecosystem, which reduces onboarding cost as the team rotates.

## Decision

The final decision is to adopt **React with TypeScript** as the frontend stack, built with Vite and served as static assets. The cons — the need for external libraries and the absence of an imposed structure — are considered manageable with an agreed folder structure and linting rules.
