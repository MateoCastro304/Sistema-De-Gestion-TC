# Project Setup — Tornería Castro

Onboarding guide: how to get the project running locally from scratch.

---

## 1. Prerequisites

| Tool                            | Notes                                                                                                     |
| ------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **Docker** + **Docker Compose** | `docker --version` / `docker compose version`                                                             |
| **make**                        | Preinstalled on Linux/Mac. On Windows: use WSL, or Git Bash with `make` installed (`choco install make`). |
| **Node.js**                     | Only needed if you plan to run the backend _outside_ Docker (not required for the normal workflow).       |

---

## 2. Clone the repo and configure environment variables

```bash
git clone <repo-url>
cd torneria-castro
```

Fill in the Docker environment files (these are not versioned; each developer creates their own from `.env.example`):

```bash
cp infrastructure/docker/.env.example infrastructure/docker/.env.dev
```

Edit `infrastructure/docker/.env.dev` with real values:

```env
POSTGRES_USER=torneria_dev
POSTGRES_PASSWORD=<choose one>
POSTGRES_DB=torneria_castro_dev
POSTGRES_PORT=5432

JWT_SECRET=<generate with the command below>
JWT_REFRESH_SECRET=<generate with the command below>
```

JWT secrets must be at least 32 characters long (enforced by `env.validation.ts` at startup). Generate them like this:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run this command twice (once for `JWT_SECRET`, once for `JWT_REFRESH_SECRET` — **do not reuse the same value for both**).

> Project rule: if you add a new environment variable, update `.env.example` in the same commit (see `docs/CONTRIBUTING.md`).

---

## 3. Start the environment with Docker

With the `Makefile` at the repo root, the whole workflow is handled through short commands:

```bash
make dev-up          # starts backend + postgres in the background
make ps           # confirms both containers are "healthy" / "running"
make dev-logs     # follows logs live (Ctrl+C to exit, doesn't stop the containers)
```

See all available commands at any time:

```bash
make help
```

---

## 4. First steps after starting

### Run Prisma migrations

```bash
make migrate
```

### Load test data (seed)

```bash
make seed
```

### Verify the backend is responding

- API: `http://localhost:3000`
- Swagger docs: `http://localhost:3000/docs`

### Access the containers for debugging

```bash
make shell-backend   # shell inside the backend container
make shell-db        # psql inside the postgres container
```

---

## 5. Available commands (summary)

| Command              | What it does                                                                 |
| -------------------- | ---------------------------------------------------------------------------- |
| `make dev-up`        | Start backend + postgres (dev)                                               |
| `make dev-build`     | Rebuild images and start (use after changing the Dockerfile or dependencies) |
| `make dev-down`      | Stop the containers                                                          |
| `make dev-down-v`    | Stop containers **and delete Postgres data** (full reset)                    |
| `make dev-logs`      | Live logs for all services                                                   |
| `make dev-restart`   | Restart the backend only                                                     |
| `make ps`            | Container status                                                             |
| `make migrate`       | Run Prisma migrations                                                        |
| `make seed`          | Load test data                                                               |
| `make shell-backend` | Shell inside the backend                                                     |
| `make shell-db`      | psql inside Postgres                                                         |
| `make clean`         | Stop everything, remove volumes and orphaned images                          |
| `make prod`          | Start the production environment                                             |
| `make prod-logs`     | Live production logs                                                         |

---

## 6. Production

```bash
make prod
```

Uses `docker-compose.prod.yml`, which unlike dev:

- Builds the backend using the `production` stage of the Dockerfile (pre-compiled code, no bind mounts).
- Does not expose the Postgres port to the host.
- Uses a real persistent volume for data.

Real values go in `infrastructure/docker/.env.prod` (same process as step 2, with production values — never commit this file).

---

## 7. Common issues

| Symptom                                      | Likely cause / fix                                                                                                                                                                       |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `port is already allocated`                  | Another process is using port 5432 or 3000 on your machine. Change `POSTGRES_PORT` in `.env.dev` or free up the port.                                                                    |
| Backend can't connect to the database        | `DATABASE_URL` must use `postgres` as the host (the service name on the Docker network), not `localhost`.                                                                                |
| Env validation fails on startup              | Check that **all** variables required by `env.validation.ts` are set (`NODE_ENV`, `PORT`, `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`), and that secrets are 32+ characters long. |
| Prisma error about `schema.prisma` not found | Rebuild the image with `make dev-build` — there may be a stale cached image.                                                                                                             |
| Code changes aren't reflected                | Confirm the bind mount (`../../backend:/app`) is active — this only applies in `dev`, not in `prod`.                                                                                     |

---

## 8. Related conventions

- Branching, commits (Conventional Commits) and PRs: see `docs/CONTRIBUTING.md`.
- Architecture decisions: see the ADRs in `docs/architecture/`.
- Docker infrastructure layout: see `infrastructure/docker/README.md`.
