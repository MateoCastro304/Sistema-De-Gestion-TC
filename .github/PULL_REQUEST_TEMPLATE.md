## What and why

<!-- What does this PR change, and why? Link the Jira ticket if there is one. -->

## How to test

<!-- Steps a reviewer can follow to check that it works. -->

## Checklist

- [ ] The title follows Conventional Commits (`type(scope): summary`)
- [ ] CI is green
- [ ] Endpoints changed → `docs/openapi/` updated in this PR
- [ ] New environment variables → `.env.example` and `env.validation.ts` updated
- [ ] Schema changed → migration included, integration tests run locally
- [ ] Architectural decision → ADR added or updated in `docs/decisiones/`
- [ ] No lint rule disabled without a comment explaining why
