# QA Test Structure — Module-First Organization

**Project:** Tornería Castro SRL — Management System
**Scope of this document:** how integration, API, and end-to-end testing are organized and run.
**Audience:** any QA engineer or tester joining the project.

---

## 1. Purpose and scope

This document describes how the QA-owned test suite is structured so that anyone can open the repository and understand where each test lives, how it is named, and how to run it.

The ownership boundary is fixed:

- **Unit tests → developers.** Pure business logic (cost calculation, dollar-rate updates, Zod validations) is tested next to the source code by the developers who wrote it.
- **Integration, API, and E2E tests → QA.** Everything that requires the database, the HTTP surface, or a real browser is owned and maintained by QA.

QA does **not** re-test arithmetic that a unit test already covers. QA tests that, once a request travels through the endpoint, the guard, the service and Postgres, the system's guarantees hold.

---

## 2. Organizing principle

**One business module = one folder = one chapter of this document.**

Each module owns its three test levels (integration, API, E2E) and its own traceability matrix. The layout mirrors the backend modules one-to-one, so a tester who knows the domain already knows where to look.

---

## 3. Folder structure

Mapped directly to the backend modules (`auth`, `usuarios`, `clientes`, `piezas`, `cotizaciones`, `ordenes-de-trabajo`, `produccion`, `reportes`, `pdf`, `scheduler`):

```
qa/                                  # root of the QA-owned suite (integration + API + E2E)
├─ README.md                         # THE DOCUMENT: how this part of the project works
├─ modules/
│  ├─ cotizaciones/                  # quotations
│  │  ├─ README.md                   # the module "chapter" (follows the template)
│  │  ├─ integration/
│  │  │  ├─ registrar-cotizacion.int.spec.ts
│  │  │  ├─ precio-inmutable.int.spec.ts
│  │  │  └─ adjudicacion.int.spec.ts
│  │  ├─ api/
│  │  │  └─ cotizaciones.api.spec.ts
│  │  └─ e2e/
│  │     └─ camino-de-la-pieza.e2e.spec.ts
│  ├─ ordenes-trabajo/    { README.md · integration/ · api/ · e2e/ }   # work orders
│  ├─ auth-rbac/          { README.md · integration/ · e2e/ }          # cross-cutting
│  ├─ tipos-proceso/      { README.md · integration/ · api/ }          # process types
│  ├─ clientes/           { README.md · integration/ · api/ }          # clients
│  ├─ piezas/             { README.md · integration/ · api/ }          # parts
│  ├─ reportes/           { README.md · integration/ · api/ }          # reports
│  ├─ pdf/                { README.md · integration/ }                 # PDF service
│  └─ scheduler/          { README.md · integration/ }                 # scheduled jobs
├─ shared/
│  ├─ harness/            # Testcontainers setup + NestJS test app + teardown
│  ├─ factories/          # data builders: unaCotizacionAdjudicable(), unTipoProceso()
│  ├─ fixtures/           # real files: plano.pdf, pieza-patron.png, diseno.stp
│  └─ auth/               # loginComo(role) and preloaded tokens per role
├─ jest.integration.config.ts
├─ playwright.config.ts
└─ package.json           # scripts: test:int, test:api, test:e2e, test:module
```

Two design decisions worth fixing up front:

- **Cross-cutting concerns get their own module.** RBAC and JWT live in `auth-rbac/` so they are not duplicated, but each module chapter references which RBAC matrix rows apply to it.
- **Seams are documented on both sides.** Adjudication (registering the purchase order) lives in `cotizaciones/` because it acts on the quotation, while the work-order lifecycle lives in `ordenes-trabajo/`. Both chapters name the seam explicitly so the transition is neither tested twice nor left ownerless.

---

## 4. Naming conventions

**File names:** `<topic>.<level>.spec.ts`, where level is `int`, `api`, or `e2e`. A glob then selects a whole layer (`**/*.int.spec.ts`), and the level is obvious at a glance.

**Tags in `describe` blocks:** every suite opens with the ERS identifiers it covers, in brackets, so tests can be filtered and traced back to requirements:

```ts
describe('[CU-23][INV-1] Register Purchase Order', () => { ... })
```

This allows running everything that touches the price invariant with `jest -t "INV-1"`.

---

## 5. Test levels defined

The single most important convention: what each level means in this project. This is what keeps "API" and "integration" from blurring together.

| Level | What it exercises | What it verifies | Tooling |
|-------|-------------------|------------------|---------|
| **Integration** | endpoint → guard → service → Prisma → **real Postgres** | business rules and invariants (the bulk of the suite) | Jest + Supertest + Testcontainers |
| **API / contract** | the HTTP surface | status codes, response shape (against OpenAPI), input validation, filters and pagination — **not** deep business rules | Jest + Supertest (same test app) |
| **E2E** | a real browser against the `docker-compose` stack | complete critical user journeys | Playwright |

Rule of thumb:

- Asserting *"the price does not change"* → **integration**.
- Asserting *"returns 400 when currency is missing"* → **API**.
- Asserting *"the user can complete the quotation"* → **E2E**.

---

## 6. The five invariants

Every QA test should trace back to one of these guarantees or to a use case. If it cannot, it probably does not belong.

1. **The awarded price is immutable.** Once the purchase order is received, the price to the client never changes, even if internal costs, processes, or suppliers do.
2. **The quotation number is correlative and unique under concurrency.** Backed by a database `SEQUENCE`, never `MAX(id)+1`.
3. **The workshop (JT role) never sees financial data.** Costs, margins, and actual hours are filtered in the backend, not only in the UI.
4. **State machines reject illegal transitions.** Quotation and Work Order have closed lifecycles; skipping a state corrupts traceability.
5. **Every change is traced** with date, time, and responsible user.

---

## 7. Root README index (`qa/README.md`)

The first thing any tester reads when entering the project:

1. **Purpose and scope** — what QA tests (integration, API, E2E) vs. what developers test (unit). The boundary, made explicit.
2. **How it is organized** — module-first; a map of the modules and their backend counterparts.
3. **Conventions** — file names, tags, and the definition of each level (the table in §5).
4. **The five invariants** — the quality compass, on one page.
5. **Harness and test data** — how the ephemeral Postgres is started, where factories and fixtures live.
6. **How to run** — locally (by module or by level) and in CI.
7. **How to add a test and how to report a bug** — the working loop.
8. **Module index** — links to each chapter.
9. **Minimal glossary** — roles (JT, EC, ERP…) and invariants.

---

## 8. Module chapter template (`qa/modules/<module>/README.md`)

Every chapter has the same shape, so reading one is reading them all:

1. **Purpose** (one line) and the backend module it covers.
2. **Use cases covered** — a CU → status table.
3. **Invariants and business rules in play.**
4. **Boundary with developers** — what QA tests here and what stays on the unit side.
5. **Scenarios by level** — integration / API / E2E, each with a summarized acceptance criterion.
6. **Module traceability matrix** — CU/RN → level → file → status.
7. **Test data and preconditions.**
8. **How to run just this module.**
9. **Open risks / pending items.**

---

## 9. Worked example chapter — Cotizaciones (Quotations)

A fully filled-in chapter, following the template above.

**1. Purpose.** Verifies the creation, query, and awarding of quotations. Covers the backend `cotizaciones` module.

**2. Use cases covered.**

| CU | Name | Status |
|----|------|--------|
| CU-14 | Register Quotation | ✅ |
| CU-15 | Query Quotations | ✅ |
| CU-16 | Query a Part's Quotation History | ⬜ |
| CU-17 | Generate Quotation from a Previous One | ⬜ |
| CU-18 | Apply Discount | ✅ |
| CU-20 | Generate Quotation Report | 🔗 (see `pdf` module) |
| CU-23 | Register Purchase Order | ✅ |

**3. Invariants in play.** INV-1 price immutability after award · INV-2 unique correlative number · INV-4 Quotation state machine (`Pending → Quoted → {Expired | Fully awarded | Partially awarded}`) · INV-5 traceability of pre-award changes.

**4. Boundary with developers.** Cost calculation (Composite pattern), dollar-rate updates, and Zod validation are **developer unit tests**. QA does not re-test the arithmetic; QA tests that — going through the endpoint with a real Postgres — the correlative number never repeats, the price freezes on award, discounts are rejected once awarded, and Work Orders are spawned correctly.

**5. Scenarios by level.**

*Integration* — Unique correlative number under N concurrent creations (INV-2) · Price frozen on purchase-order registration and later modification rejected (INV-1) · Discount rejected on an awarded quotation (CU-18) · Partial award of 2 of 3 items spawns 2 independent Work Orders (CU-23, INV-4) · Every pre-award change is recorded in history (INV-5).

*API* — `POST /cotizaciones` with an invalid currency → 400 · missing dollar value → 400 · `GET /cotizaciones?cliente=&estado=&desde=&hasta=` returns the paginated shape of the OpenAPI contract · `GET /cotizaciones/:id` for a missing id → 404.

*E2E* — "Path of the part" happy flow (ERP registers the request → EC quotes an assembly → PDF report → ERP awards partially), as a complete browser journey.

**6. Module traceability matrix.**

| CU / RN | Invariant | Level | File | Status |
|---------|-----------|-------|------|--------|
| CU-14 | — | Integration + E2E | `registrar-cotizacion.int.spec.ts` | ✅ |
| RN correlative | INV-2 | Integration | `registrar-cotizacion.int.spec.ts` | ✅ |
| CU-23 | INV-1, INV-4 | Integration | `adjudicacion.int.spec.ts` | ✅ |
| RN price immutability | INV-1 | Integration | `precio-inmutable.int.spec.ts` | ✅ |
| CU-18 | INV-1 | Integration | `adjudicacion.int.spec.ts` | ✅ |
| CU-15 | — | API | `cotizaciones.api.spec.ts` | ✅ |

**7. Test data.** Factories: `unaCotizacionCotizada()`, `unaCotizacionAdjudicable(price)`, `unaCotizacionVencida()`. Fixtures: `plano.pdf`. Roles used: EC, ERP.

**8. How to run.** `npm run test:module -- cotizaciones` (runs the module's integration + API) · `npm run test:e2e -- cotizaciones`.

**9. Open risks.** CU-16/17 (history and re-quoting) not covered yet. Still to agree with dev: what happens when awarding an **Expired** quotation — blocked or revalidated? (affects the scenario in `adjudicacion.int.spec.ts`).

---

## 10. Shared harness and fixtures

The `shared/harness/` starts an ephemeral Postgres (Testcontainers) once per run and boots the NestJS test app; teardown disposes of both. Factories build readable data (`unaCotizacionAdjudicable(100000)`) so tests tell a story instead of assembling objects by hand. `shared/fixtures/` holds real sample files (a PDF drawing, a PNG of a master part, a STEP 3D file) for upload scenarios, and `shared/auth/` exposes `loginComo(role)` plus preloaded tokens for every role, so RBAC assertions stay one line.

---

## 11. CI integration

In **GitHub Actions**, the *Tests & Validation* stage runs `test:int` and `test:api` on every push, and `test:e2e` on pull requests to `main`. Because each module is self-contained, the suite can be parallelized per module as it grows, and a developer touching only `ordenes-trabajo` runs that chapter alone for feedback in seconds. Any bug found in QA or production enters the suite as a regression test — tagged with its CU and invariant — before the issue is closed.

---

## 12. Working loop

- **A use case becomes testable** when its acceptance criteria are written (Given/When/Then). QA writes these with the developer before or as the code is built.
- **When a use case is done:** first exploratory manual testing to *discover*, then the normal course and edge cases are turned into automated regression tests to *protect*.
- **Every test traces back** to a CU, a business rule, or an invariant via its bracketed tag and its row in the module matrix.
