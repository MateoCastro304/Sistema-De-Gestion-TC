# QA Test Structure — Module-First Organization

**Project:** Tornería Castro SRL — Management System
**Scope of this document:** how unit, integration, API, and end-to-end testing are organized and run.
**Audience:** any developer or tester joining the project.

---

## 1. Purpose and scope

This document describes how the test suite is structured so that anyone can open the repository and understand where each test lives, how it is named, and how to run it.

The ownership boundary is fixed:

- **Unit tests → developers.** Pure business logic (cost calculation, dollar-rate updates, Zod validations) is tested next to the source code, in `backend/src/<module>/`, against a **mocked database**.
- **Integration, API, and E2E tests → QA.** Everything that requires a real database, the HTTP surface, or a real browser is owned and maintained by QA.

QA does **not** re-test arithmetic that a unit test already covers. QA tests that, once a request travels through the endpoint, the guard, the service and Postgres, the system's guarantees hold.

---

## 2. Organizing principle

**One business module = one folder per test level.** Each module's tests are split across three physical locations, one per level, mirroring the backend modules one-to-one so a tester who knows the domain already knows where to look:

| Level | Lives in |
|-------|----------|
| Unit | `backend/src/<module>/` (next to the code) |
| Integration + API | `backend/test/modules/<module>/` |
| E2E | `e2e/<module>/` (root of the repo) |

---

## 3. Folder structure

```
backend/
├── src/
│   └── <module>/
│       ├── ...                       # controller, service, domain, dto
│       └── *.spec.ts                 # unit tests: business logic, mocked DB
└── test/
    ├── modules/
    │   ├── cotizaciones/              # quotations
    │   │   ├── int/
    │   │   │   ├── registrar-cotizacion.int.spec.ts
    │   │   │   ├── precio-inmutable.int.spec.ts
    │   │   │   └── adjudicacion.int.spec.ts
    │   │   └── api/
    │   │       └── cotizaciones.api.spec.ts
    │   ├── ordenes-trabajo/           { int/ · api/ }   # work orders
    │   ├── auth-rbac/                 { int/ }          # cross-cutting
    │   ├── tipos-proceso/             { int/ · api/ }   # process types
    │   ├── clientes/                  { int/ · api/ }   # clients
    │   ├── piezas/                    { int/ · api/ }   # parts
    │   ├── reportes/                  { int/ · api/ }   # reports
    │   ├── pdf/                       { int/ }           # PDF service
    │   └── scheduler/                 { int/ }           # scheduled jobs
    ├── shared/
    │   ├── harness/                    # Testcontainers global setup/teardown + NestJS test app
    │   ├── factories/                  # data builders: unaCotizacionAdjudicable(), unTipoProceso()
    │   ├── fixtures/                   # real files: plano.pdf, pieza-patron.png, diseno.stp
    │   └── auth/                       # loginComo(role) and preloaded tokens per role
    ├── jest-integration.config.ts
    ├── jest-api.config.ts
    └── README.md                       # how the integration + API suite works

e2e/                                     # root of the repo, sibling to backend/ and frontend/
├── README.md                            # how the E2E suite works
├── playwright.config.ts
├── shared/                              # fixtures and auth helpers specific to E2E journeys
└── <module>/
    └── camino-de-la-pieza.e2e.spec.ts
```

Two design decisions worth fixing up front:

- **Cross-cutting concerns get their own module.** RBAC and JWT live in `auth-rbac/` so they are not duplicated, but each module chapter references which RBAC matrix rows apply to it.
- **Seams are documented on both sides.** Adjudication (registering the purchase order) lives in `cotizaciones/` because it acts on the quotation, while the work-order lifecycle lives in `ordenes-trabajo/`. Both chapters name the seam explicitly so the transition is neither tested twice nor left ownerless.

---

## 4. Naming conventions

**File names:** `<topic>.<level>.spec.ts`, where level is `int`, `api`, or `e2e` (plain `.spec.ts`, no level suffix, for unit tests next to the code). A glob then selects a whole layer (`**/*.int.spec.ts`), and the level is obvious at a glance.

**Tags in `describe` blocks:** every suite opens with the ERS identifiers it covers, in brackets, so tests can be filtered and traced back to requirements:

```ts
describe('[CU-23][INV-1] Register Purchase Order', () => { ... })
```

This allows running everything that touches the price invariant with `jest -t "INV-1"`.

---

## 5. Test levels defined

The single most important convention: what each level means in this project. This is what keeps "unit", "API" and "integration" from blurring together.

| Level | Lives in | What it exercises | What it verifies | Tooling |
|-------|----------|--------------------|---------------------|---------|
| **Unit** | `backend/src/<module>/*.spec.ts` | pure business logic in isolation | business rules that don't need a real database — cost calculation, state-machine transitions, Zod validations | Jest, database mocked |
| **Integration** | `backend/test/modules/<module>/int/` | endpoint → guard → service → Prisma → **real Postgres** | business rules and invariants that only hold end-to-end (the bulk of the QA suite) | Jest + Supertest + Testcontainers, one database container started per execution and isolated to that run |
| **API / contract** | `backend/test/modules/<module>/api/` | the HTTP surface | status codes, response shape (against OpenAPI), input validation, filters and pagination — **not** deep business rules | Jest + Supertest (same test app as integration) |
| **E2E** | `e2e/<module>/` | a real browser against the `docker-compose` stack | complete critical user journeys | Playwright |

Rule of thumb:

- Asserting *"the discount is computed correctly given a rate and a quantity"* → **unit**.
- Asserting *"the price does not change once awarded"* → **integration**.
- Asserting *"returns 400 when currency is missing"* → **API**.
- Asserting *"the user can complete the quotation"* → **E2E**.

---

## 6. Root README files (`backend/test/README.md` and `e2e/README.md`)

There is no single top-level QA README — the integration/API suite and the E2E suite live in different roots (`backend/` vs the repo root), so each gets its own entry point.

**`backend/test/README.md`** — the first thing anyone reads before touching an integration or API test:

1. **Purpose and scope** — integration vs API, and the boundary with unit tests that live in `backend/src/`.
2. **How it is organized** — module-first; a map of the modules under `test/modules/`.
3. **Conventions** — file names, tags, and the definition of each level (the table in §5).
4. **Harness and test data** — how the Testcontainers database is started once per execution (`shared/harness/`), and where factories and fixtures live.
5. **How to run** — locally (`npm run test:int`, `npm run test:api`, `npm run test:module -- <module>`) and in CI.
6. **How to add a test and how to report a bug** — the working loop.
7. **Module index** — links to each module's chapter under `test/modules/<module>/`.
8. **Minimal glossary** — roles (JT, EC, ERP…).

**`e2e/README.md`** — the entry point for browser journeys:

1. **Purpose and scope** — which modules have E2E coverage and why (not every module needs one; a simple CRUD module may have none).
2. **How it is organized** — one folder per module under `e2e/<module>/`.
3. **How to run** — locally against `docker compose up`, and in CI (pull requests to `main`).
4. **Fixtures and auth helpers** — `e2e/shared/`.
5. **Module index** — links to each module's journeys.

---

## 7. Module chapter template

Each module's traceability lives close to its tests rather than in one giant document:

- `backend/test/modules/<module>/README.md` — covers the module's **integration + API** chapter.
- `e2e/<module>/README.md` — covers the module's **E2E** chapter, only for modules that have one.

Every chapter has the same shape, so reading one is reading them all:

1. **Purpose** (one line) and the backend module it covers.
2. **Use cases covered** — a CU → status table.
3. **Invariants and business rules in play.**
4. **Boundary with developers** — what QA tests here and what stays on the unit side (`backend/src/<module>/*.spec.ts`).
5. **Scenarios by level** — integration / API (or E2E, in the `e2e/` chapter), each with a summarized acceptance criterion.
6. **Module traceability matrix** — CU/RN → level → file → status.
7. **Test data and preconditions.**
8. **How to run just this module.**
9. **Open risks / pending items.**

---

## 8. Worked example chapter — Cotizaciones (Quotations)

A fully filled-in chapter, following the template above. This one lives at `backend/test/modules/cotizaciones/README.md` (the E2E chapter for this module, if any, would live at `e2e/cotizaciones/README.md`).

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

**4. Boundary with developers.** Cost calculation (Composite pattern), dollar-rate updates, and Zod validation are **developer unit tests**, in `backend/src/cotizaciones/*.spec.ts`. QA does not re-test the arithmetic; QA tests that — going through the endpoint with a real Postgres — the correlative number never repeats, the price freezes on award, discounts are rejected once awarded, and Work Orders are spawned correctly.

**5. Scenarios by level.**

*Integration* — Unique correlative number under N concurrent creations (INV-2) · Price frozen on purchase-order registration and later modification rejected (INV-1) · Discount rejected on an awarded quotation (CU-18) · Partial award of 2 of 3 items spawns 2 independent Work Orders (CU-23, INV-4) · Every pre-award change is recorded in history (INV-5).

*API* — `POST /cotizaciones` with an invalid currency → 400 · missing dollar value → 400 · `GET /cotizaciones?cliente=&estado=&desde=&hasta=` returns the paginated shape of the OpenAPI contract · `GET /cotizaciones/:id` for a missing id → 404.

*E2E* (`e2e/cotizaciones/`) — "Path of the part" happy flow (ERP registers the request → EC quotes an assembly → PDF report → ERP awards partially), as a complete browser journey.

**6. Module traceability matrix.**

| CU / RN | Invariant | Level | File | Status |
|---------|-----------|-------|------|--------|
| CU-14 | — | Integration + E2E | `backend/test/modules/cotizaciones/int/registrar-cotizacion.int.spec.ts` + `e2e/cotizaciones/camino-de-la-pieza.e2e.spec.ts` | ✅ |
| RN correlative | INV-2 | Integration | `backend/test/modules/cotizaciones/int/registrar-cotizacion.int.spec.ts` | ✅ |
| CU-23 | INV-1, INV-4 | Integration | `backend/test/modules/cotizaciones/int/adjudicacion.int.spec.ts` | ✅ |
| RN price immutability | INV-1 | Integration | `backend/test/modules/cotizaciones/int/precio-inmutable.int.spec.ts` | ✅ |
| CU-18 | INV-1 | Integration | `backend/test/modules/cotizaciones/int/adjudicacion.int.spec.ts` | ✅ |
| CU-15 | — | API | `backend/test/modules/cotizaciones/api/cotizaciones.api.spec.ts` | ✅ |

**7. Test data.** Factories: `unaCotizacionCotizada()`, `unaCotizacionAdjudicable(price)`, `unaCotizacionVencida()`. Fixtures: `plano.pdf`. Roles used: EC, ERP.

**8. How to run.** `npm run test:module -- cotizaciones` (from `backend/`, runs the module's integration + API) · `npm run test:e2e -- cotizaciones` (from `e2e/`).

**9. Open risks.** CU-16/17 (history and re-quoting) not covered yet. Still to agree with dev: what happens when awarding an **Expired** quotation — blocked or revalidated? (affects the scenario in `adjudicacion.int.spec.ts`).

---

## 9. Shared harness and fixtures

`backend/test/shared/harness/` starts an ephemeral Postgres via Testcontainers **once per execution** (`global-setup.ts`/`global-teardown.ts`) — a single database container is shared by every integration and API test file in that run, not one per file — and boots the NestJS test app against it; teardown disposes of both at the end of the run. Factories in `backend/test/shared/factories/` build readable data (`unaCotizacionAdjudicable(100000)`) so tests tell a story instead of assembling objects by hand. `backend/test/shared/fixtures/` holds real sample files (a PDF drawing, a PNG of a master part, a STEP 3D file) for upload scenarios, and `backend/test/shared/auth/` exposes `loginComo(role)` plus preloaded tokens for every role, so RBAC assertions stay one line.

`e2e/` does not use the Testcontainers harness: E2E runs Playwright against the real `docker-compose` stack, so its `e2e/shared/` only holds browser-level fixtures and auth helpers (e.g. preloaded sessions/cookies), not a database harness.

---

## 10. CI integration

In **GitHub Actions**, the *Tests & Validation* stage runs `test:int` and `test:api` from `backend/` on every push, and `test:e2e` from `e2e/` on pull requests to `main`. Because each module is self-contained, the suite can be parallelized per module as it grows, and a developer touching only `ordenes-trabajo` runs that chapter alone for feedback in seconds. Any bug found in QA or production enters the suite as a regression test — tagged with its CU and invariant — before the issue is closed.

---

## 11. Working loop

- **A use case becomes testable** when its acceptance criteria are written (Given/When/Then). QA writes these with the developer before or as the code is built.
- **When a use case is done:** first exploratory manual testing to *discover*, then the normal course and edge cases are turned into automated regression tests to *protect*.
- **Every test traces back** to a CU, a business rule, or an invariant via its bracketed tag and its row in the module matrix.
