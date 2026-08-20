# Contributing to Tornería Castro

This document defines the conventions the team follows when working in this monorepo. The goal is to keep the history readable, avoid conflicts, and make sure changes to shared contracts (OpenAPI, environment variables) don't silently break someone else's work.

## Language

We use English for all code, comments, and documentation. This is to make it easier for new team members to onboard and to avoid confusion when searching for help online.

## Branching

Branch names follow this pattern:

```
<type>/<jira-ticket>-<short-description>
```

Where `<type>` is one of: `feature`, `fix`, `chore`, `docs`, `ci`.

Examples:

```
feature/TC-12-openapi-schema-quotes
fix/TC-34-quote-expiration-job
chore/TC-8-update-eslint-config
```

Keep the description short (3-5 words) and lowercase, using hyphens instead of spaces.

## Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short summary>
```

Types: `feat`, `fix`, `chore`, `docs`, `ci`, `refactor`, `test`.

Examples:

```
feat(backend): add quote expiration scheduler
fix(openapi): correct required fields in QuoteItem schema
ci: add spectral lint step to pull request workflow
```

This isn't just style — it lets us generate changelogs automatically later and makes `git log` actually useful when debugging.

## Pull requests

Every PR must:

- Reference its Jira ticket.
- Use the PR template (`.github/PULL_REQUEST_TEMPLATE.md`) — don't delete the checklist.
- Be reviewed and approved by at least one other team member before merging.
- Stay focused on one concern. If you find yourself fixing something unrelated, open a separate PR.

## The environment variable rule

**If your PR introduces a new environment variable, it must update `.env.example` in the same commit.**

This is the single most common source of "works on my machine" bugs in a multi-developer setup — someone adds a variable locally, forgets to tell the team, and the next person's `docker compose up` fails with a confusing error. Until we have automated validation for this (coming in Sprint 1), this is enforced by convention and PR review — reviewers should reject a PR that adds config without touching `.env.example`.

## Contract-first: touching the OpenAPI spec

If your change affects any API endpoint (new route, changed schema, changed response), update the relevant file under `openapi/` in the same PR as the backend change. The OpenAPI contract is the source of truth — the backend implements it, not the other way around.

## Code review expectations

- Don't approve a PR you haven't actually read.
- If you're not sure something is correct, ask — a question in review is cheaper than a bug in production.
- Small, frequent PRs are preferred over large ones that are hard to review meaningfully.

## Architectural decisions

Always document architectural decisions in ADRs (Architecture Decision Records) under `docs/adr/`. If you find yourself making a decision that affects the architecture of the system, write an ADR before implementing it. This helps the team understand why a decision was made and makes it easier to revisit later.

Also take a look at existing ADRs before making a decision — if a similar decision has already been made, you may not need to write a new one.

## Questions

If a convention here doesn't fit a situation you're facing, raise it with the team instead of silently working around it — conventions should evolve when they stop making sense, not get ignored.
