# Project Setup — Tornería Castro

Onboarding guide: how to get the project running locally from scratch.

---

## 1. Prerequisites

| Tool                            | Notes                                                                                                            |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Docker** + **Docker Compose** | `docker --version` / `docker compose version`                                                                    |
| **make**                        | Preinstalled on Linux/Mac. On Windows: use WSL, or Git Bash with `make` installed (`choco install make`).        |
| **Node.js**                     | Only needed if you plan to run backend or frontend tooling outside Docker. Not required for the normal workflow. |

> The normal development workflow runs the **backend, frontend and PostgreSQL** inside Docker. Node.js does not need to be installed locally unless you want to run project tooling directly on your host machine.

---

## 2. Clone the repo and configure environment variables

Clone the repository:

```bash
git clone <repo-url>
cd torneria-castro
```

Fill in the Docker environment files (these are not versioned; each developer creates their own from `.env.example`):

```bash
cp infrastructure/docker/.env.example infrastructure/docker/.env.dev
```

Edit `infrastructure/docker/.env.dev` with the required development values:

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

Run this command twice: once for `JWT_SECRET` and once for `JWT_REFRESH_SECRET`.

**Do not reuse the same value for both secrets.**

> Project rule: if you add a new environment variable, update `.env.example` in the same commit (see `docs/CONTRIBUTING.md`).

---

## 3. Start the development environment with Docker

The development environment is composed of three main services:

- **Backend** — NestJS API.
- **Frontend** — React/Vite application.
- **PostgreSQL** — Development database.

> In addition to these three, an auxiliary `openapi-docs` service serves the API contract documentation independently — see section 4.

With the `Makefile` at the repository root, the whole development workflow is handled through short commands.

Start all services in the background:

```bash
make dev-up
```

Check the status of the containers:

```bash
make ps
```

Follow the logs from all services:

```bash
make dev-logs
```

To see all available commands:

```bash
make help
```

---

## 4. First steps after starting

### Run Prisma migrations

Once the containers are running, apply the database migrations:

```bash
make migrate
```

### Load test data

Run the Prisma seed:

```bash
make seed
```

### Verify the backend

The backend API is available at:

```text
http://localhost:3000
```

Swagger documentation is available at:

```text
http://localhost:3000/docs
```

### Verify the frontend

The frontend is available at:

```text
http://localhost:5173
```

> The frontend runs inside its own Docker container. Its source code is mounted into the container during development, allowing changes to be reflected without rebuilding the image in the normal development workflow.

### Verify the OpenAPI documentation

A standalone Redoc viewer serves the API contract independently of the backend container. It is available at:

```text
http://localhost:8081
```

This service reads the already-bundled OpenAPI spec and stays up even if the backend container is stopped or crashes — useful for consulting endpoint contracts while debugging or restarting the backend.

### Accessing the stack through Nginx

In addition to reaching each service directly on its own port, the
development stack includes an **Nginx reverse proxy**, exposed at:

    http://localhost

Nginx routes incoming requests based on the URL path:

| Path     | Routed to                        |
| -------- | -------------------------------- |
| `/`      | `frontend-dev` (Vite dev server) |
| `/api/*` | `backend` (API)                  |
| `/docs`  | `backend` (Swagger)              |

**Why this exists:** it lets the frontend and backend be reached through a
single origin, exactly as they will be in production. This avoids CORS
configuration in development and catches routing issues early, before they
show up for the first time in a production deploy.

**Direct ports vs. Nginx — when to use each:**

- Use `localhost:3000` / `localhost:5173` directly when debugging a single
  service in isolation (e.g. checking raw backend responses, or using
  Vite's dev tools without the proxy in the way).
- Use `localhost` (port 80, through Nginx) to verify that routing between
  frontend and backend behaves as it will in production.

Both work at the same time — Nginx does not replace the direct ports, it
is an additional way to reach the same services.

> If `http://localhost` returns `502 Bad Gateway`, Nginx is running but the
> service it's routing to (backend or frontend-dev) is not responding yet —
> check with `make ps` and the corresponding `*-logs` command.
> A `404` from `/api/*`, on the other hand, means the request reached the
> backend successfully — the proxy is working, the route/endpoint itself
> just doesn't exist yet.

### Access the containers for debugging

Backend:

```bash
make backend-shell
```

Frontend:

```bash
make frontend-shell
```

PostgreSQL:

```bash
make db-shell
```

---

## 5. Available commands (summary)

### Environment-wide

| Command           | What it does                                                                     |
| ----------------- | -------------------------------------------------------------------------------- |
| `make dev-up`     | Start backend + frontend + postgres (dev)                                        |
| `make dev-build`  | Rebuild all images and start (use after changing any Dockerfile or dependencies) |
| `make dev-down`   | Stop the containers                                                              |
| `make dev-down-v` | Stop containers **and delete Postgres data** (full reset)                        |
| `make dev-logs`   | Live logs for all services                                                       |
| `make ps`         | Container status                                                                 |
| `make clean`      | Stop everything, remove volumes and orphaned images/containers                   |
| `make prod-up`    | Start the production environment                                                 |
| `make prod-build` | Rebuild all production images and start the production environment               |
| `make prod-logs`  | Live production logs                                                             |
| `make prod-down`  | Stop the production environment                                                  |

### Backend-scoped

| Command                | What it does                       |
| ---------------------- | ---------------------------------- |
| `make backend-restart` | Restart the backend container only |
| `make backend-logs`    | Live logs for the backend only     |
| `make backend-shell`   | Shell inside the backend container |
| `make backend-build`   | Rebuild the backend image only     |
| `make migrate`         | Run Prisma migrations              |
| `make seed`            | Load test data                     |

### OpenAPI docs-scoped

| Command                     | What it does                                                          |
| --------------------------- | --------------------------------------------------------------------- |
| `make openapi-docs-rebuild` | Re-bundle the OpenAPI contract and regenerate the Redoc documentation |
| `make openapi-docs-logs`    | Live logs for the OpenAPI docs service                                |

### Frontend-scoped

| Command                 | What it does                        |
| ----------------------- | ----------------------------------- |
| `make frontend-restart` | Restart the frontend container only |
| `make frontend-logs`    | Live logs for the frontend only     |
| `make frontend-shell`   | Shell inside the frontend container |
| `make frontend-build`   | Rebuild the frontend image only     |

### Database-scoped

| Command         | What it does         |
| --------------- | -------------------- |
| `make db-shell` | psql inside Postgres |

---

## 6. Development workflow

The development Docker Compose configuration is designed to provide a fast feedback loop.

The backend and frontend source directories are mounted into their respective containers using **bind mounts**. This means that the files edited on the host machine are directly available inside the corresponding container.

As a result:

- Backend code changes can be detected without rebuilding the Docker image.
- Frontend code changes can be detected by the Vite development server.
- Dependencies and the container environment remain isolated inside Docker.
- PostgreSQL data is stored in a Docker volume and persists across normal container restarts.

### When to rebuild

A normal code change does **not** require rebuilding the image.

For example:

```bash
make backend-restart
```

or:

```bash
make frontend-restart
```

can be used when a specific service needs to be restarted.

Rebuild the affected image when changing its Dockerfile or dependencies:

```bash
make backend-build
make frontend-build
```

Or rebuild everything:

```bash
make dev-build
```

---

## 7. Production

Start the production environment:

```bash
make prod-up
```

If the Dockerfiles or dependencies have changed, rebuild the production images:

```bash
make prod-build
```

Follow production logs:

```bash
make prod-logs
```

Stop the production environment:

```bash
make prod-down
```

The production environment uses:

```text
infrastructure/docker/docker-compose.prod.yaml
```

and:

```text
infrastructure/docker/.env.prod
```

The production environment differs from development in several important ways:

- The backend uses the **production stage** of its Dockerfile.
- Application code is built before being executed.
- Development bind mounts are not used.
- PostgreSQL is not exposed directly to the host.
- PostgreSQL uses a persistent Docker volume for its data.
- Services are configured for production rather than development workflows.

Real production values go in:

```text
infrastructure/docker/.env.prod
```

Never commit this file to the repository.

---

## 8. Resetting the development database

If the local PostgreSQL database needs to be completely reset, use:

```bash
make dev-down-v
```

This stops the development containers and removes their Docker volumes.

**Warning:** this deletes the local PostgreSQL data.

After resetting, start the environment again:

```bash
make dev-up
```

Then run:

```bash
make migrate
make seed
```

to recreate the database schema and load the development data.

---

## 9. Common issues

| Symptom                                       | Likely cause / fix                                                                                                                                                                      |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `port is already allocated`                   | Another process is using one of the ports required by the services. Check the Docker Compose configuration and the corresponding `.env.dev` values.                                     |
| Backend can't connect to the database         | `DATABASE_URL` must use `postgres` as the host (the service name on the Docker network), not `localhost`.                                                                               |
| Env validation fails on startup               | Check that **all** variables required by `env.validation.ts` are set (`NODE_ENV`, `PORT`, `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`) and that secrets are 32+ characters long. |
| Prisma error about `schema.prisma` not found  | Rebuild the backend image with `make backend-build` or `make dev-build` if the Docker image contains a stale or incomplete build.                                                       |
| Code changes aren't reflected in the backend  | Confirm that the backend bind mount is active in the development Compose configuration.                                                                                                 |
| Code changes aren't reflected in the frontend | Confirm that the frontend bind mount and Vite development server are running correctly inside the frontend container.                                                                   |
| Dependency changes aren't reflected           | Rebuild the affected image with `make backend-build` or `make frontend-build`.                                                                                                          |
| Database data disappeared                     | `make dev-down-v` or `make clean` may have removed the Docker volume containing the development database.                                                                               |
| OpenAPI docs not reflecting a contract change | Run `make openapi-docs-rebuild` — the Redoc HTML is generated once by the `openapi-build` init container and needs to be regenerated after editing the OpenAPI source files.            |

---

## 10. Related conventions

- Branching, commits (Conventional Commits) and PRs: see `docs/CONTRIBUTING.md`.
- Architecture decisions: see the ADRs in `docs/architecture/`.
- Docker infrastructure layout: see `infrastructure/docker/README.md`.
- Docker Compose configurations are located in `infrastructure/docker/`.
- Development environment variables are stored in `infrastructure/docker/.env.dev`.
- Production environment variables are stored in `infrastructure/docker/.env.prod`.

---

## 11. Quick start

For a developer who already has Docker and `make` installed, the shortest path to a working development environment is:

```bash
cp infrastructure/docker/.env.example infrastructure/docker/.env.dev
```

Configure the required values in `.env.dev`, then:

```bash
make dev-build
make migrate
make seed
```

After that, the development environment is ready.
Use:

```bash
make ps
```

to check the containers and:

```bash
make dev-logs
```

to inspect the logs.
