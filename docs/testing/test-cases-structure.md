# Test Cases — Purpose, Structure & Traceability

This document explains how test cases are handled in the Tornería Castro SRL
management system: **why they exist**, **where they live**, and **how each one
stays linked** from the business specification all the way down to the code that
proves it in CI. It complements [`estrategia-qa.md`](./estrategia-qa.md), which
defines the testing *strategy* (the pyramid, the tools, the invariants); this
document defines the testing *bookkeeping* (the artifacts and how they connect).

---

## 1. Purpose of the test cases

A **test case** is the smallest verifiable statement about what the system must
do. In this project every test case exists to answer one question with evidence:
*"does this rule from the ERS actually hold?"*

Test cases serve two different audiences at once, and that is why they exist in
two forms:

- **As business-readable specifications.** Each test case describes, in plain
  language, a precondition, the steps, the input data and the expected result.
  This is what a non-developer — the client, the course instructor, a QA
  reviewer — reads to confirm that the system covers the real behaviour of the
  workshop. It is derived directly from the use cases and business rules of the
  ERS: the normal course of a use case becomes the positive ("happy path") test
  case, and **each alternate course becomes a negative or edge test case**.

- **As executable checks.** The very same test case is implemented as an
  automated test that runs in CI (GitHub Actions, per
  [ADR-009](../decisions/009-deploy-infrastructure.md)). If the rule is ever
  broken by a code change, the build fails.

The guiding principle is the same one that governs the whole architecture:
**appropriate complexity, not over-engineering.** We do not chase an arbitrary
coverage percentage. A test case earns its place only if it can be traced back
to a use case, a business rule, or one of the five system invariants defined in
`estrategia-qa.md` (price immutability, correlative quote number, the workshop
never seeing money, closed state machines, full traceability). If a test cannot
be traced to any of those, it does not belong in the suite.

Every test case carries a stable identifier — **`CP-NN`** (Caso de Prueba). That
id is the thread that ties the three artifacts below together.

---

## 2. Chosen structure

Test cases live in **two homes**, each with a single, non-overlapping
responsibility. Nothing is duplicated: the same content is never maintained in
two places.

### 2.1 The formal catalog — `docs/testing/casos-de-prueba/`

The human-facing, formal definition of every test case lives here, one document
per module:

```
docs/testing/
├── estrategia-qa.md                 # testing strategy (pyramid, tools, invariants)
└── casos-de-prueba/                 # formal test-case catalog, one file per module
    ├── Clientes.docx
    ├── Fabricas.docx
    ├── Cotizaciones.docx
    ├── Ordenes-de-Trabajo.docx
    └── ...
```

Each document uses the classic test-plan table: **ID, precondition, steps, test
data, expected result, actual result, status**. This is the deliverable a
reviewer reads, and the source of truth for *what* must be tested. It is written
in business language and does not assume any knowledge of the code.

#### Test-case table format

Every test case in the catalog is recorded with exactly these fields:

| Field | Meaning |
|-------|---------|
| **ID** | Stable identifier `CP-NN`. The glue across catalog, README and code. |
| **Use case / rule** | The ERS use case or business rule the case is derived from (e.g. CU-1, RN *Client management*). |
| **Type** | Positive (normal course) or Negative / Edge (alternate course). |
| **Precondition** | System state required before the steps run. |
| **Steps** | Ordered actions the actor performs. |
| **Test data** | Concrete input values used. |
| **Expected result** | The observable outcome that makes the case pass. |
| **Actual result** | Filled in at execution time. |
| **Status** | Not run · Pass · Fail (per execution). |

Blank template (one row per case):

| ID | Use case / rule | Type | Precondition | Steps | Test data | Expected result | Actual result | Status |
|----|-----------------|------|--------------|-------|-----------|-----------------|---------------|--------|
| CP-NN | CU-x / RN-y | Positive \| Negative | … | 1. … 2. … | … | … | *(execution)* | *(execution)* |

Worked example:

| ID | Use case / rule | Type | Precondition | Steps | Test data | Expected result | Actual result | Status |
|----|-----------------|------|--------------|-------|-----------|-----------------|---------------|--------|
| CP-01 | CU-1 Register Client | Positive | ERP logged in; factory EDASA exists. | 1. Open "Register Client". 2. Enter contact data. 3. Select factory EDASA. 4. Confirm. | Name "Juan", Surname "Pérez", DNI 30.111.222, mail juan.perez@edasa.com; Factory EDASA. | Client is stored as Active, linked to EDASA, and available for quote requests. | — | Not run |
| CP-05 | CU-1 Register Client | Negative | ERP logged in; a client with DNI 30.111.222 already exists. | 1. Open "Register Client". 2. Enter DNI 30.111.222. 3. Confirm. | DNI 30.111.222 (duplicate). | System reports the client already exists, offers to open its record, and creates no duplicate. | — | Not run |

> Note: `.docx` is a binary format, so Git will not show a meaningful diff per
> pull request. That is an accepted trade-off because the formal, presentable
> document is the priority here. If per-PR change visibility ever becomes more
> important than the document format, these can be switched to `.md` without
> changing anything else in this scheme.

### 2.2 The executable suite — `backend/test/` and `e2e/`

The QA-owned suite is split across two physical roots, by level:

- **Integration + API** live in `backend/test/modules/<module>/`, next to the
  backend that runs them.
- **E2E** lives in `e2e/<module>/`, at the root of the repository, alongside
  `backend/` and `frontend/`.

Each module folder is a self-contained "chapter", one per level:

```
backend/test/
├── modules/
│   └── clientes/
│       ├── README.md                # module chapter → TRACEABILITY (see §3)
│       ├── int/                     # deep tests: endpoint → Guard → Prisma → Postgres
│       │   ├── clientes-unicidad.int.spec.ts
│       │   └── clientes-baja-logica.int.spec.ts
│       └── api/                     # HTTP-surface tests: CRUD, validation, RBAC
│           └── clientes.api.spec.ts
├── shared/
│   ├── harness/                     # Testcontainers global setup/teardown + NestJS test app
│   ├── factories/                   # data builders: unCliente(), unaFabrica()
│   ├── fixtures/                    # real files: plano.pdf, pieza-patron.png
│   └── auth/                        # loginComo(role) + preloaded tokens per role
└── README.md                        # how the integration + API suite works

e2e/
├── README.md                        # how the E2E suite works
├── shared/                          # browser-level fixtures + auth helpers
└── clientes/                        # only present for modules that need E2E coverage
    └── ...
```

Each test case from the catalog becomes a named test:

```ts
// backend/test/modules/clientes/api/clientes.api.spec.ts
it('CP-01 registers a client successfully', ...)
it('CP-03 rejects creation with missing required fields', ...)

// backend/test/modules/clientes/int/clientes-unicidad.int.spec.ts
it('CP-05 rejects a duplicate document (409)', ...)
```

The split between folders follows one rule:

- **`int/`** — a case that proves a rule living in the **database or in
  the Guard → Prisma circuit** (uniqueness, logical deletion that preserves
  history, the client↔factory relationship). These run against a real Postgres
  started once per execution via Testcontainers, isolated to that run.
- **`api/`** — a case that proves **HTTP-surface behaviour** (status codes,
  payload validation, list filters, "only the ERP role may operate on
  clients"). Exhaustive RBAC lives in the cross-cutting `auth-rbac/` module; a
  module only keeps one representative role-check.
- **`e2e/<module>/`** — full user journeys, added only for modules that need
  them. A simple CRUD module (such as Clients) has **no** `e2e/` folder for
  its module.

### 2.3 What deliberately stays *outside* `backend/test/` and `e2e/`

Those two roots cover integration + API + E2E only. Two kinds of test do not
belong there:

- **Unit tests** (pure domain logic and schema validation, e.g. the Zod schema
  for a client, DNI/CUIT format) live next to the code they test, in
  `backend/src/<module>/*.spec.ts`, and run against a **mocked database**.
- **Frontend tests** (component behaviour, and any purely UI-level case such as
  "cancel discards the form") live in `frontend/` with Vitest + React Testing
  Library.

Those cases are still catalogued in the `.docx` (so the business view is
complete) and still carry a `CP-NN` id; only their *implementation* lives
elsewhere.

---

## 3. Traceability — the module `README.md`

The catalog says *what* is tested. The specs *prove* it. The **module
`README.md` is the bridge between them**: it holds nothing but the traceability
matrix, so anyone can answer "is CP-05 covered, and where?" without reading
either the `.docx` or the TypeScript.

Since integration/API and E2E live in different roots, each gets its own
module README when applicable:

- `backend/test/modules/clientes/README.md` — integration + API chapter.
- `e2e/clientes/README.md` — E2E chapter, only if the module has E2E coverage.

`backend/test/modules/clientes/README.md` contains:

1. A one-line purpose and a link to the formal catalog:
   `../../../../docs/testing/casos-de-prueba/Clientes.docx`.
2. The ERS references the module covers (e.g. CU-1…CU-4 and the *Client
   management* business rule).
3. The traceability table below — one row per test case.

| CP (see `Clientes.docx`) | Level | File · test | Invariant | Status |
|--------------------------|-------|-------------|-----------|--------|
| CP-01 Successful creation | API | `api/clientes.api.spec.ts` · `it('CP-01…')` | — | ⬜ |
| CP-03 Missing required fields | API | `api/clientes.api.spec.ts` · `it('CP-03…')` | — | ⬜ |
| CP-05 Duplicate document | Integration | `int/clientes-unicidad.int.spec.ts` · `it('CP-05…')` | Uniqueness | ⬜ |
| CP-24 Logical deletion keeps history | Integration | `int/clientes-baja-logica.int.spec.ts` · `it('CP-24…')` | Traceability | ⬜ |
| CP-06 Cancel discards form | Frontend (outside `backend/test/` and `e2e/`) | `frontend/.../ClienteForm.test.tsx` | — | ⬜ |

Status legend: ⬜ pending · ✅ automated & green · 🟡 documented, not yet automated.

### How the three artifacts stay in sync

The `CP-NN` id is the single glue across all three layers:

```
Clientes.docx          →  defines CP-05 (steps, data, expected result)
        │  (same id)
module README.md       →  traces CP-05 to its file and status
        │  (same id)
*.int.spec.ts          →  it('CP-05 …') proves it in CI
```

Because the id is identical everywhere, searching the repository for `CP-05`
returns the row in the README and the `it()` that implements it, and the id
points back to the full definition in the catalog. A case can never silently
drift out of any layer: if the README lists a `CP` with no matching `it()`, it
is visibly not automated yet; if a spec references a `CP` absent from the
catalog, the catalog is out of date.

### Workflow for adding or changing a test case

1. Write or update the case in the module's `.docx` (definition first).
2. Add its row to the module `README.md` traceability table.
3. Implement it as an `it('CP-NN …')` in the correct `int/`, `api/`,
   `frontend/`, or `backend/src` location.
4. Flip the README status to ✅ once it is automated and green in CI.

Every production bug becomes a new `CP` before it is closed — it is catalogued,
traced, and added as a regression test in the same pull request.
