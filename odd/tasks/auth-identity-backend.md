# auth-identity-backend

Objective: backend of HU 53 (login, DTC-33), HU 52 (logout, DTC-32) and HU 54 (change password, DTC-214) in subsystem `identity`, porting the generic parts of vzcausas.
Branch: `feat/auth-identity-backend` (from develop @ a6a204f). Delivery: ask-on-risk, ~400 changed lines per slice, T6 (guards) alone in its own commit.
Test runner: jest. `cd backend && npm test` (unit), `npm run test:int`, `npm run test:api`, `npm run lint`. Scope: backend only (frontend is owned by other people; hand-off notes in T11).

## Specs

Source of truth: Jira DTC-32/33/214 + `docs/api-contract/API_CONTRACT_SPRINT_2.md`. The user says the Jira acceptance criteria are NOT validated yet, so where they conflict with the user's decisions (S6) the decisions win.

**S1. Login (`POST /auth/login`, public).**
- Body `{username, password}`; username case-insensitive.
- 200: `accessToken`, `tokenType: "Bearer"`, `expiresIn: 900`, `inactivityTimeoutSeconds: 1800`, `sessionExpiresAt` (login + 7 days), `user`; cookie `refresh_token` (`HttpOnly; Secure; SameSite=Strict; Path=/api/auth; Max-Age=604800`). The accessToken is never stored by the client in `localStorage`.
- Success opens a new server session, clears the failed-attempt counter and registers "Último acceso".
- Wrong credentials: `401 INVALID_CREDENTIALS`, message "Usuario o contraseña incorrectos" (never says which one failed).
- Inactive user: `401 INVALID_CREDENTIALS`, same message, creates no session.
- Locked user: `423 USER_BLOCKED`, "Tu usuario fue bloqueado por intentos fallidos. Contactá al Administrador del Sistema." (text to revisit: lock is temporary, see S6).
- Empty fields: `400 VALIDATION_ERROR` with `details` per field ("Ingresá tu nombre de usuario", "Ingresá tu contraseña"); it does not count as an attempt.
- Password stored hashed with salt, never returned, never logged (RNF08).

**S2. Refresh / session lifetime (`POST /auth/refresh`, public, uses cookie).**
- accessToken 15 min; expired → `401 ACCESS_TOKEN_EXPIRED`; client calls refresh and retries.
- 30 min of inactivity → `401 SESSION_EXPIRED` (session closed with reason `INACTIVITY`). Refresh does not count as activity (D-46).
- 7 days max → `401 SESSION_EXPIRED` (reason `EXPIRED`). Refresh does not extend it (D-44).
- Refresh token rotates on every use; reuse of an already replaced token after 30 seconds → `401 UNAUTHENTICATED`, session closed with `REVOKED`, cookie cleared. Within 30 seconds it is tolerated (D-47).
- Response has the same shape as login, with the current `user` (page reload recovers the session).
- The refresh token travels only in the HttpOnly cookie, never in the body (D-45).

**S3. Authorization (all endpoints, Sprint 1 included, D-40).**
- No `Authorization` → `401 UNAUTHENTICATED`.
- Role without permission → `403 FORBIDDEN`, "No tenés permisos para realizar esta operación.", no data returned.
- Roles and permissions are checked on every request with the user's current roles (RNF09), not those at login.
- The session is verified server side on every request (D-04).

**S4. Logout (`POST /auth/logout`).**
- Always `204`, never `401` (D-09), also with expired session or no token.
- Invalidates the session on the server, ends it with reason `MANUAL`, clears the cookie (`Set-Cookie: refresh_token=; ... Max-Age=0`). Does not touch the user's other sessions.
- Afterwards the accessToken and the refresh token no longer work: `401 UNAUTHENTICATED`.

**S5. Change password (HU 54).** NOT in the Sprint 2 contract (D-25) and `frontend/CLAUDE.md` forbids it. Jira DTC-214 criteria, for reference: "Contraseña actualizada correctamente", "La contraseña actual no es correcta", "Las contraseñas no coinciden", "La nueva contraseña debe ser distinta de la actual", minimum 8 characters, wrong current password counts as a failed attempt, closes the user's other sessions and keeps the current one. Needs its own contract before coding (T8).

**S6. User decisions (override Jira where they conflict).**
- Session = family of rotating refresh tokens (`user_session` + `refresh_token`, `session_id` plays the role of vzcausas `familyId`).
- Lockout = temporary and progressive (port of vzcausas `login-lock-policy` + `login_attempt` table). Counts unknown usernames too (anti enumeration). Replaces Jira "5 intentos, bloqueo permanente".
- Inactivity timeout through a TTL port (`SESSION_INACTIVITY_SECONDS`).
- accessToken in memory on the client, refresh token in an HttpOnly cookie.
- Roles in tables `role` / `permission` / `role_permission` (already migrated).
- Auth lives in subsystem `identity` (ADR-014); `abmc-users` will be moved there later.
- "Copy from vzcausas what can be copied, adapt the rest."

## Tasks

| ID | Specs | Route | Status | Commit |
|---|---|---|---|---|
| T1 Deps and config: `cookie-parser`, `helmet`, env vars (`COOKIE_*`, `SESSION_INACTIVITY_TTL`, `BCRYPT_COST`, `LOGIN_LOCK_*`), `main.ts`/`app.setup.ts` wiring | S1 S2 | inline | DONE (RED: 16/19 new tests failed; GREEN: 19/19; unit 314/314, int 88/88, lint+tsc clean) | pending (user commits; staged) |
| T2a Ported `login-lock-policy` (+ spec, 20 tests) | S6 | inline | DONE (RED: module not found; GREEN 20/20) | pending (user commits) |
| T2b `identity` domain: errors, ports (abstract classes, Torneria style), entities | S1 S2 S6 | inline | pending | |
| T2c Prisma + in-memory adapters (user, role/permissions, session + refresh token store, login throttle) with integration tests | S1 S2 S6 | inline | pending | |
| T3 Login: `authenticate-user`, bcrypt hasher, JWT issuer (`sub`+`sid`), cookie options, `AuthController.login`, DTOs, errors → HTTP | S1 | inline | pending | |
| T4 Refresh: `refresh-session`, rotation + 30 s grace, reuse → REVOKED, inactivity/expiry, `AuthController.refresh` | S2 | inline | pending | |
| T5 Logout: `logout` use case, `AuthController.logout` | S4 | inline | pending | |
| T6 Guards (HIGH RISK, own commit): `JwtAuthGuard`, `PermissionsGuard`, `@Public`/`@CurrentUser`/`@RequirePermissions` as `APP_GUARD`; annotate Sprint 1 controllers (customers, supplier, technical-catalog, health); adapt existing tests with `loginAs` | S3 | inline | pending | |
| T7 Dev seed: initial employee + admin user (credentials from env) in `prisma/seed.ts` | S1 | inline | pending | |
| T8 Change password | S5 | inline | DEFERRED to next sprint (user decision L7) | |
| T9 Docs: update contract/OpenAPI (temporary lockout, `Retry-After`), identity docs | S1 S2 | inline | pending | |
| T10 Verification: lint, unit, int, api, differential check on Sprint 1 endpoints, manual Swagger flow | S1-S4 | inline | pending | |
| T11 Hand-off notes for frontend and `abmc-users` owners | all | inline | pending | |
| T12 Update Jira criteria (DTC-32, DTC-33; DTC-214 stays for next sprint) to match S6; show the new text to the user before writing to Jira | S1 S2 S4 | inline | pending | |

Route declaration: all inline, no Writer trigger holds (tasks depend on each other, no independent units with disjoint surfaces). Independent verifier only for T6 (named high-risk item 2: security/guards, and item 3: Sprint 1 endpoints start requiring a session).

## Log

L1 (2026-11-02, user, verbatim): "Hola, bueno mira necesito implementar 3 HUs del sprint 2 de este proyecto: 53 - Iniciar sesion, 52 - Cerrar sesion, 54 - Cambiar contraseña (esta fuera del sprint pero quiero incluirla por motivos que ahora charlaremos)"
L2 (2026-11-02, user, verbatim): "Vayamos por la familia de refresh tokens porque es algo que ya usamos y funciona bien" / "No esta bueno que tengan un bloqueo permanente y que no puedan usar el sistema asi que me parece bien lo de temporal y progresivo" / "La inactividad me parece mejor manejarla con un puerto de TTL" / "Roles mejor en Tablas Role/Permission"
L3 (2026-11-02, user, verbatim): "yo soy backend y frontend no tocamos pero si me queres decir algo yo lo puedo comunicar/delegar a los chicos."
L4 (2026-11-02, user, verbatim): "Copia las cosas que debas copiar de vzcausas y las demas que no se pueda las modificas para que anden aca como habiamos hablado"
L5 (2026-11-02): schema migrated and merged to develop (role/permission/role_permission/login_attempt; dropped blocked_at, failed_login_attempts). Baseline before this feature: 295 unit tests green.
L7 (2026-11-02, user, verbatim): "1. Me parece bien, como este en vzcausas en este caso" / "2. Dale me parece bien" / "3. Por el momento no la hagas ya que no esta en el sprint por lo tanto no se la considero en el api contrac. Queda para el proximo sprint" / "4. Luego de terminar todo esto hay que cambiar los CA del JIRA o en el orden que quieras pero hay que adaptarlos a lo que se decidio ahora mismo". Resolves L6: lock values accepted (threshold 5, window 15 min, ladder 1/5/15/60 min, as proposed; vzcausas two tiers `username+ip` and `username` backstop), 423 `USER_BLOCKED` + `Retry-After` kept, HU 54 deferred (S5 out of this feature), Jira criteria to be rewritten (T12).
L8 (2026-11-02): T1 done in a8ccc3f. Review assess: medium (`configuration_change` on package-lock.json), `review_due=false` (`under_budget`); slice stays open. Risk: item 5 (new dependencies cookie-parser, helmet; helmet adds headers to every response, int tests unaffected). Known environmental failure on the base: `npm run test:api` has 14 failing tests in `test/modules/supplier/api/{get,post,patch}-suppliers.api.spec.ts` ("response.body.message.join is not a function"): they expect `message` as an array, the API returns the contract shape; reproduced identically with T1 stashed. Not caused by this feature, not touched. Defaults chosen: tier `username+ip` 5 / 15m / 1m,5m,15m,1h; tier `username` backstop 25 / 1h / 15m (assumption, vzcausas test config uses 25 / 1h / 1s). `JWT_REFRESH_SECRET` stays required but unused: the refresh token is opaque (SHA-256 stored); `JWT_REFRESH_EXPIRATION` (7d) is the session max lifetime. New env vars have in-code defaults, so `.env.dev` needs no change.
L9 (2026-11-02, user): "no commitees vos las cosas, las commiteo yo" — T1 commit undone (staged), no more commits by the assistant; the user keeps the new branch `feat/auth-identity-backend`. Torneria conventions found: ports are abstract classes (not Symbols), errors extend `DomainError` with a `code` and are mapped by a per-subsystem exception filter, Spanish comments, relative imports, entities with `reconstruct`. vzcausas' recommended primary ladder is 90s,5m,15m,30m,60m (threshold 5, window 15m) and backstop 25/1h/15m: adopted as defaults since the user said "como este en vzcausas" (replaces my 1/5/15/60 proposal).
L6 (2026-11-02): open decisions: (a) lock ladder values (`LOGIN_LOCK_*`); (b) HU 54 contract (extra columns `must_change_password`, `password_changed_at`?); (c) HTTP status for temporary lock (proposal: keep 423 `USER_BLOCKED` plus `Retry-After`, vzcausas uses 429).
