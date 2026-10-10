# ADR-010 — Continuous Integration Pipeline

**Date:** 2026-10
**Status:** Accepted (partially implemented, see [Implementation status](#implementation-status))
**Decision-makers:** Dev-Ops Team

---

## Context

[ADR-009](./009-deploy-infrastructure.md) establishes GitHub Actions for CI/CD but does not define what the CI checks, when, or how strict it is. This ADR fills that gap.

The relevant facts about how the team works today:

- **`develop` receives direct pushes, without pull requests.** CI is the only automatic check those changes get, so it has to give feedback within minutes, or it stops being looked at.
- **`main` is the stable branch** and only receives pull requests. It is the right place for slower, more expensive checks.
- **The backend integration suite** (`backend/test/`) starts a real PostgreSQL with Testcontainers, applies all migrations and runs serially (`maxWorkers: 1`). It is the strongest check we have, but also the slowest.
- **Docker images are built from the same commands** (`npm ci`, `npm run build`) that CI runs directly, so building images on every push would repeat work without adding much early feedback.

The question was how to split checks between "fast feedback on every push" and "thorough validation before reaching `main`".

## Decision

A single workflow (`.github/workflows/ci.yaml`) with **two tiers of checks**.

### Tier 1 — Fast checks: every push to `develop` and every PR to `main`

Each job runs in parallel, on `ubuntu-latest` with Node 22.

| Job                | Steps                                                                                                                                  |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `frontend`         | `npm ci` → `npm run lint` → `npm run build` (includes `tsc -b`, the only type check of the frontend)                                    |
| `backend`          | `npm ci` → `npx prisma generate` → `npm run lint` → `npm run format:check` → `npm run build` → `npm test` (unit tests, `src/**/*.spec.ts`) |
| `openapi-contract` | In `tooling/openapi`: `npm ci` → `npm run validate` (Redocly lint + Spectral lint of `docs/openapi/openapi.yaml`)                       |

The contract job checks that the OpenAPI spec is **well formed** (valid schema, no broken `$ref`, required fields present). It does not check that the backend implements it: that is the job of the integration tests (Tier 2).

### Tier 2 — Gate checks: only on PRs to `main`

| Job                   | What it checks                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------ |
| `backend-integration` | `npm run test:int`: HTTP → use case → Prisma → real PostgreSQL, against the OpenAPI contract            |
| Docker build          | The production images build from their Dockerfiles (catches broken Dockerfiles / `.dockerignore`)        |

`backend-integration` declares `needs: backend`: it only runs if the fast backend job passed. There is no point spending minutes on the integration suite when the code does not lint or build. When `backend` fails, this job shows as **skipped**, not as passed.

### Rules that apply to every job

- **Linting is binary.** A warning nobody reads is not a check, so every rule is either `error` or `off`:
  - ESLint: scripts run with `--max-warnings 0`.
  - Redocly: extends `recommended-strict` (preset warnings become errors).
  - Spectral: runs with `--fail-severity=warn`.

  Turning a rule off requires a comment in the config explaining why (e.g. `no-server-example.com` in `tooling/openapi/redocly.yaml`: the only server is the local backend used by Swagger UI until a production host exists).
- **CI never fixes code.** `lint` has no `--fix`; fixing is done locally with `lint:fix` / `format`.
- **Formatting is Prettier's job, not ESLint's** (backend: `format:check`).
- **Same install as production:** `npm ci` from the committed `package-lock.json`, never `npm install`.
- **Node version:** `22`, pinned in the workflow. It must match the `node:22-alpine` base image of both Dockerfiles; changing one requires changing the other.
- **`prisma generate` needs `DATABASE_URL`** to load `prisma.config.ts`, even though it does not connect to a database. CI provides a dummy URL, the same one the backend Dockerfile uses.

## Options considered

### Where to run the backend integration tests

| Option                    | Decision     | Reason                                                                                                     |
| ------------------------- | ------------ | ---------------------------------------------------------------------------------------------------------- |
| Every push to `develop`   | Rejected     | Strongest safety net, but adds minutes to every push and goes against fast feedback on `develop`             |
| **Only on PRs to `main`** | **Selected** | Keeps `develop` fast; everything still gets validated before reaching `main`                                |
| Locally only (`make test-int`) | Rejected | Depends on discipline; nothing guarantees it was run                                                       |

### Whether CI builds Docker images

| Option                                    | Decision      | Reason                                                                                        |
| ----------------------------------------- | ------------- | --------------------------------------------------------------------------------------------- |
| npm only, images built at deploy time     | Rejected      | A broken Dockerfile would only be found when deploying                                          |
| `docker build` on every push              | Rejected      | Slower, duplicates `npm ci` / build, and needs extra cache setup to be usable                   |
| **npm on every push + `docker build` on PRs to `main`** | **Selected** | Fast feedback on `develop`, and the real artifact is validated before reaching `main` |

### When to lint the OpenAPI contract

| Option                                                    | Decision     | Reason                                                                                                                                       |
| --------------------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Job in `ci.yaml`, on every push**                       | **Selected** | Runs in parallel, so it does not add wait time; same pattern as the other jobs                                                                 |
| Separate workflow, only when `docs/openapi/**` changes    | Rejected     | Saves a few runner minutes, but a path-filtered check that is required on `main` stays pending forever on PRs that do not touch the contract    |

## Consequences

### Positive

- Feedback on `develop` in a few minutes, with the failing step clearly identified.
- Nothing reaches `main` without passing the integration suite and building its images.
- Lint and format are enforced the same way for everyone, instead of depending on each editor.
- Frontend and backend run in parallel and fail independently.

### Negative

- **Problems only covered by Tier 2 are discovered late:** a broken migration, an endpoint that drifts from the contract or a broken Dockerfile shows up when opening the PR to `main`, not on the push to `develop`. Mitigation: run `make test-int` locally when touching migrations, repositories or controllers.
- **Intentionally red integration tests block `main`.** By convention (see `backend/test/README.md`), a test stays red when the backend deviates from the OpenAPI contract. Those gaps must be closed before merging to `main`.
- **The Node version is duplicated** in the workflow and in the Dockerfiles.
- CI only warns until `main` is protected (see below).

## Implementation status

| Item                                                        | Status      |
| ----------------------------------------------------------- | ----------- |
| `frontend` job (Tier 1)                                     | Implemented |
| `backend` job (Tier 1)                                      | Implemented |
| `openapi-contract` job (Tier 1)                             | Implemented |
| `backend-integration` job on PRs to `main` (Tier 2)         | Implemented |
| Docker build on PRs to `main` (Tier 2)                      | Pending     |
| Branch protection on `main` requiring the CI checks to pass | Pending     |

## Future evolution

- Add frontend tests and include them in Tier 1.
- Continuous deployment (ADR-009, step 4): publish the images validated by Tier 2 and deploy them to EC2.
- Revisit the split if Tier 2 failures become frequent; moving the integration tests to every push to `develop` is the first option.
