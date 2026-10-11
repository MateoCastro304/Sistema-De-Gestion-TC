# Contributing to Tornería Castro

This document defines how the team works in this monorepo: how code moves from your machine to `main`, what CI checks, and the rules the code has to follow. The goal is a readable history, a `develop` branch that works, and shared contracts (OpenAPI, environment variables, database schema) that never break silently.

If a rule here doesn't fit a situation you're facing, raise it with the team instead of silently working around it. Conventions should evolve when they stop making sense, not get ignored.

---

## Language

**Everything is written in English:** code, comments, documentation, commit messages, pull requests and ADRs. It makes onboarding easier and keeps searches for help consistent.

---

## Branches and flow

```
your machine ──push──▶ develop ──PR (merge commit)──▶ main
                         │                             │
                    CI: fast checks              CI: fast + gate checks
                    (reports, doesn't block)     (required to merge)
```

| Branch    | Purpose                                     | How changes get in                                       |
| --------- | ------------------------------------------- | -------------------------------------------------------- |
| `main`    | Stable code. Protected.                     | Only through a pull request from `develop`, with CI green |
| `develop` | Integration branch. Where day-to-day work lands. | Direct push, or a short-lived branch merged into it  |

### Working on `develop`

Direct pushes to `develop` are allowed. That makes CI the **only** automatic check those changes get, and it runs **after** the push has already landed: CI reports, it does not block. The flow relies on these rules:

1. **Before pushing, run the checks locally** for the parts you touched (see [Running checks locally](#running-checks-locally)).
2. **Pull with rebase before pushing**, so `develop` doesn't fill up with merge commits:
   ```bash
   git pull --rebase origin develop
   ```
3. **After pushing, check the CI run** in the Actions tab.
4. **If you break `develop`, fixing it is your top priority**, before anything else. If you can't fix it in a few minutes, revert your commit (`git revert <sha>`) and fix it calmly on a branch.
5. **Never rewrite `develop`'s history:** no `git push --force`, no `git reset` on commits that are already pushed. Fix with a new commit or a revert.

### Short-lived branches

Use a branch when the work takes more than a day, when you want feedback before it lands, or when it touches something risky (migrations, the OpenAPI contract, CI). Keep it short-lived and rebase it on `develop` often.

Branch names follow this pattern:

```
<type>/<ticket>-<short-description>     # when there is a Jira ticket
<type>/<short-description>              # when there isn't
```

`<type>` is one of `feature`, `fix`, `refactor`, `chore`, `docs`, `ci`. The description is short (3-5 words), lowercase, with hyphens:

```
feature/TC-12-quote-expiration
fix/supplier-cuit-validation
ci/docker-build-job
```

> Windows and macOS don't distinguish uppercase from lowercase in branch names, GitHub does. `feature/CI` and `feature/ci` are different branches on GitHub but the same one on your machine. Always use lowercase.

### Releasing to `main`

1. Open a pull request from `develop` to `main`.
2. CI runs the fast checks **and** the gate checks (integration tests, Docker image builds). All of them must pass; `main` is protected and won't allow the merge otherwise.
3. Intentionally red integration tests (see [Tests](#tests)) block the release: close those gaps first.
4. Merge with **"Create a merge commit"**. Don't squash or rebase: squashing creates a new commit that `develop` doesn't have, and the next release PR shows already-released commits again and produces conflicts.

---

## Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <summary>
```

**Types:**

| Type       | Use it for                                              |
| ---------- | ------------------------------------------------------- |
| `feat`     | A new feature for the user or a new endpoint            |
| `fix`      | A bug fix                                               |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test`     | Adding or fixing tests                                  |
| `docs`     | Documentation only (including ADRs)                     |
| `ci`       | GitHub Actions workflows                                |
| `chore`    | Tooling, dependencies, configuration                    |

**Scopes:** `frontend`, `backend`, `openapi`, `db`, `infra`. Use more than one separated by commas when a commit genuinely touches several (`feat(backend,openapi): ...`), and omit the scope when the change is truly repo-wide. Don't invent scopes like `general`, `back` or `front`.

**Summary:** imperative mood, lowercase, no trailing period, under 72 characters. It completes the sentence *"If applied, this commit will..."*.

```
feat(backend): add quote expiration scheduler
fix(openapi): correct required fields in QuoteItem schema
refactor(frontend): move useToast to shared
ci: add docker build job
docs: add ADR-010 continuous integration
```

One commit, one concern. If a commit mixes unrelated changes (a CI file and a docker-compose service, say), split it with `git add -p` or by staging files separately.

---

## Pull requests

Every pull request:

- Uses the template (`.github/PULL_REQUEST_TEMPLATE.md`). Don't delete the checklist.
- Has a Conventional Commits title. It shows up in the history.
- References its Jira ticket, if there is one.
- Stays focused on one concern. If you find yourself fixing something unrelated, open a separate PR.
- Has CI green before asking for review.

---

## Continuous integration

CI runs on every push to `develop` and on every pull request to `main` (`.github/workflows/ci.yaml`). The full rationale is in [ADR-010](./decisions/010-continuous-integration.md).

| Job                   | Runs on                     | What it checks                                                        |
| --------------------- | --------------------------- | --------------------------------------------------------------------- |
| `frontend`            | push to `develop`, PR to `main` | lint, build (includes the TypeScript type check)                  |
| `backend`             | push to `develop`, PR to `main` | lint, formatting, build, unit tests                               |
| `openapi-contract`    | push to `develop`, PR to `main` | Redocly + Spectral lint of the OpenAPI contract                   |
| `backend-integration` | PR to `main` only           | integration tests against a real PostgreSQL (Testcontainers)          |
| `docker-build`        | PR to `main` only           | the production Docker images build                                    |

A job shown as **skipped** on a PR is not a pass: `backend-integration` and `docker-build` only run if the jobs they depend on passed.

**Never weaken CI to make it pass:** don't remove a step, don't lower a rule, don't add `--fix` to a CI script. A red build that tells the truth is worth more than a green one that lies.

### Running checks locally

The normal workflow runs everything in Docker, so run the commands inside the containers (`make backend-shell` / `make frontend-shell`) or on your machine if you have Node 22 installed.

| What                        | Where             | Command                                    |
| --------------------------- | ----------------- | ------------------------------------------ |
| Lint                        | `frontend/`, `backend/` | `npm run lint` (fix what can be fixed with `npm run lint:fix`) |
| Formatting                  | `backend/`        | `npm run format:check` (fix with `npm run format`) |
| Build / type check          | `frontend/`, `backend/` | `npm run build`                      |
| Unit tests                  | `backend/`        | `npm test`                                 |
| Integration tests           | repo root         | `make backend-test-int`                    |
| OpenAPI contract            | `tooling/openapi/` | `npm run validate` (or `make openapi-docs-build`) |

The backend's type-aware lint needs the Prisma client: if `src/generated` is missing, run `npm run prisma:generate` first.

Integration tests only run in CI on the release PR. **Run them locally when you touch migrations, repositories or controllers**, so you don't find out when trying to release.

---

## Code rules

### Linting

Every lint rule is either `error` or `off`; there are no warnings. Lint scripts run with `--max-warnings 0`, and the OpenAPI linters fail on warnings too.

- **Don't disable a rule to get past it.** Fix the code. If the rule is genuinely wrong for a case, disable it for that line only and say why:
  ```ts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- third-party callback is untyped
  ```
- **Changing a rule in a config file is a team decision.** Turning a rule off requires a comment in the config explaining why. Discuss it before merging.
- **Don't edit generated files** (`frontend/public/mockServiceWorker.js`, `backend/src/generated/`). They are regenerated and your changes will be lost. Ignore them in the config instead.

### Backend architecture (enforced by ESLint)

Each module in `backend/src/<module>/` is split into layers, and dependencies point inwards:

```
http ───────────┐
                ├──▶ application ──▶ domain
infrastructure ─┘
```

| Layer            | Contains                                    | Must not import                                           |
| ---------------- | ------------------------------------------- | --------------------------------------------------------- |
| `domain`         | Entities, value objects, domain errors, ports | Other layers, `@nestjs/*`, `@prisma/*`, `class-validator`, `express` |
| `application`    | Use cases                                   | `http` (including its DTOs), `infrastructure`, Prisma     |
| `http`           | Controllers, DTOs, filters, mappers         | `infrastructure`, Prisma                                  |
| `infrastructure` | Repository implementations (Prisma, in-memory) | —                                                      |

Unit tests (`*.spec.ts`) are exempt: they may use in-memory repositories from `infrastructure`.

> **Don't convert imports of injected classes to `import type`.** With `emitDecoratorMetadata`, Nest's dependency injection reads the class at runtime; a type-only import removes it and breaks DI.

### Frontend architecture (enforced by ESLint)

| Folder      | Contains                                     | May import                                                     |
| ----------- | -------------------------------------------- | -------------------------------------------------------------- |
| `app/`      | Composition: router, providers, layout, mocks | Everything                                                    |
| `features/` | One module per business area                 | `shared/`, `domain/`, `app/providers`, other features **through their `index.ts` only** |
| `shared/`   | Reusable code with no business logic         | `shared/`, `domain/`                                           |
| `domain/`   | Shared business types and rules              | Nothing else                                                   |

- Inside a feature, use relative imports (`../types/customer`). To leave your folder, use the `@/` alias, never `../../`.
- A feature exposes what others may use through its `index.ts`.
- Mocks (`*.mocks.ts`) are imported only by `app/mocks`, so MSW and fake data never reach the production bundle.

### Formatting

The backend is formatted with Prettier (`backend/.prettierrc`); CI fails if a file isn't formatted. Configure your editor to format on save with the project's Prettier. Line endings are always LF (enforced by `.gitattributes`).

---

## Tests

| Level                    | Where                                      | Owner      | Runs in CI on          |
| ------------------------ | ------------------------------------------ | ---------- | ---------------------- |
| Unit                     | `backend/src/**/*.spec.ts`, next to the code | Developers | every push and PR    |
| Integration (API + DB)   | `backend/test/modules/<module>/`           | QA         | PRs to `main`          |
| End-to-end               | not set up yet                             | QA         | —                      |

How the integration suite is organized and written: [`backend/test/README.md`](../backend/test/README.md).

**Tests follow the contract.** When the backend deviates from the OpenAPI spec, the integration test stays red on purpose: it's a gap to fix in the code, not a broken test. Don't adjust the test to the current behavior.

The frontend has no tests yet.

---

## Shared contracts

### The OpenAPI contract

The OpenAPI spec in `docs/openapi/` is the source of truth: the backend implements it, not the other way around. If your change affects an endpoint (new route, changed schema, changed response), update the spec **in the same commit or PR** as the backend change. CI lints the spec on every push.

### Environment variables

**If you introduce a new environment variable, update `.env.example` in the same commit.** That includes the backend's validation in `src/config/env.validation.ts`, which makes the app fail at startup if a required variable is missing. A variable added locally and never documented is the most common source of "works on my machine" bugs.

### Database migrations

- Create migrations with `make migrate-create name=<description>` and commit them together with the `schema.prisma` change.
- **Never edit a migration that has already been pushed.** Someone may have applied it already. Create a new one.
- Run the integration tests locally after a migration change (see [Running checks locally](#running-checks-locally)).

---

## Code review

- Don't approve a pull request you haven't actually read.
- If you're not sure something is correct, ask. A question in review is cheaper than a bug in production.
- Small, frequent pull requests are easier to review well than large ones.

---

## Architectural decisions

Architectural decisions are recorded as ADRs in [`docs/decisions/`](./decisions/), numbered in order (`NNN-short-title.md`). If you're about to make a decision that affects the architecture, the tooling or the way the team works, read the existing ADRs first (it may already be decided), and write a new one before implementing it.
