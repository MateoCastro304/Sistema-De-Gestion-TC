# Docker Infrastructure

This directory contains the Docker configuration for the Tornería Castro project, including compose files, environment configurations, and database initialization scripts.

## Overview

The project uses Docker Compose to orchestrate multiple services:

- **backend**: NestJS application server
- **postgres**: PostgreSQL 16 database server
- **frontend**: React + Vite application, served via Nginx in production
- **openapi-build**: Development-only init container that bundles and validates the OpenAPI contract
- **openapi-docs**: Development-only Swagger UI serving the bundled contract, with "Try it out" against the backend

The setup supports both development and production environments with different configurations and resource constraints.

## Directory Structure

```
docker/
├── docker-compose.yaml        # Base compose configuration (shared by all environments)
├── docker-compose.dev.yaml    # Development environment overrides
├── docker-compose.prod.yaml   # Production environment overrides
├── docker-compose.test.yaml   # Test environment overrides (production images + seed)
├── .env.example               # Template for environment variables (the only tracked one)
├── .env.dev                   # Development variables (gitignored, created from .env.example)
├── .env.prod                  # Production variables (gitignored, created from .env.example)
├── .env.test                  # Test variables (gitignored, created from .env.example)
├── postgres/
│   ├── Dockerfile             # PostgreSQL container image configuration
│   └── init/                  # Initialization scripts (executed on first container start)
├── nginx/
│   └── frontend.conf          # Nginx config for serving the frontend static build
└── README.md                  # This file
```

## Services

### Backend Service

The NestJS backend application built from `backend/Dockerfile`.

**Configuration:**

- Container name: `torneria-backend`
- Network: `torneria-network`
- Restart policy: `unless-stopped`
- Depends on: PostgreSQL (waits for health check)

**Build targets:**

- `development`: Used in development environment with source code mounted as volume and `npm run start:dev` command
- `production`: Optimized production build with smaller image size

### Postgres Service

PostgreSQL 16 database server with health checks and initialization support.

**Configuration:**

- Container name: `torneria-postgres`
- Network: `torneria-network`
- Restart policy: `unless-stopped`
- Image: Custom image built from `postgres/Dockerfile`

**Health check:**

- Method: `pg_isready` command
- Interval: 10 seconds
- Timeout: 5 seconds
- Retries: 5 attempts

**Initialization:**

- Scripts in `postgres/init/` are automatically executed on first container start
- Location: `/docker-entrypoint-initdb.d/`

### Frontend Service

The React + Vite application built from `frontend/Dockerfile`.

**Configuration:**

- Container name: `torneria-frontend`
- Network: `torneria-network`
- Restart policy: `unless-stopped`
- Depends on: none (the frontend does not need the backend to be ready at container startup — API calls happen from the browser at runtime, not from the container process itself)

**Build targets:**

- `development`: Runs the Vite dev server (`npm run dev`) with source code mounted as a volume for hot reload. Vite is configured with `host: '0.0.0.0'` so it's reachable from outside the container.
- `build`: Intermediate stage. Installs dependencies and runs `npm run build`, producing the static `dist/` folder. This stage is never run as a container — it only exists to be copied from.
- `production`: Based on `nginx:alpine`, not on Node. Copies the compiled `dist/` from the `build` stage into Nginx's static file directory, along with a custom `frontend.conf`. Nginx serves the files directly; no Node runtime is present in this stage.

**Why no `depends_on` with the backend:** unlike the backend, which needs Postgres reachable the moment its process starts (to run migrations, connect the ORM, etc.), the frontend container just needs to start serving files. The actual dependency on the backend API happens later, in the user's browser, which is outside the container's lifecycle.

**Build-time environment variables (important):**

Vite bakes environment variables into the compiled JavaScript at **build time**, not runtime. This means variables like `VITE_API_URL` cannot be passed the same way as backend variables (`env_file`, read by a running process) — there is no running process reading them in the `production` stage, only Nginx serving static files.

Today no build argument is needed: the frontend calls the API at `/api` (the default of `VITE_API_URL`, see `frontend/src/shared/api/http.ts`), and Nginx forwards `/api` to the backend in every environment (ADR-009). The same build works in dev and prod, so the Dockerfile declares no `ARG` and the compose files pass no `build.args`.

If a `VITE_` variable ever has to differ per environment, it must be passed as a build argument (`ARG` + `ENV` in the `build` stage, before `RUN npm run build`, and `build.args` in the compose override), never through `env_file`. Like any other variable, it must be added to `frontend/.env.example` in the same commit that introduces it (see `CONTRIBUTING.md`).

## Environment Variables

### Configuration Files

| File           | Purpose                                                                        |
| -------------- | ------------------------------------------------------------------------------ |
| `.env.example` | Template with every variable, with example values (tracked in version control) |
| `.env.dev`     | Development (gitignored). Used by `make dev-*`                                 |
| `.env.prod`    | Production (gitignored, real secrets). Used by `make prod-*`                   |
| `.env.test`    | Test stack (gitignored). Used by `make test-*`                                 |

Each file is created by copying `.env.example` and adjusting the values. The Makefile uses the same file twice:

- `--env-file`: Compose interpolates `${POSTGRES_USER}`, `${POSTGRES_PASSWORD}` and `${POSTGRES_DB}` in the compose files (the `postgres` service and the `DATABASE_URL` anchor).
- `env_file`: the `backend` container receives every variable in the file as its environment.

There is no `.env` in this directory: Compose only reads the file passed with `--env-file`. Running `docker compose` by hand without that flag leaves the `POSTGRES_*` variables empty.

### Validation

The backend validates its variables on startup (`backend/src/config/env.validation.ts`). If one is missing or invalid, the container exits with the list of errors in `make dev-logs` (or `make backend-logs`). The values in `.env.example` are examples that pass this validation, so a fresh copy works for development as is. They must never be used in production.

### Variables

| Variable | Required | Used by | Description |
| --- | :-: | --- | --- |
| `POSTGRES_USER` | Yes | Compose | Database user. Also used in `DATABASE_URL` |
| `POSTGRES_PASSWORD` | Yes | Compose | Database password. Also used in `DATABASE_URL` |
| `POSTGRES_DB` | Yes | Compose | Database name. Also used in `DATABASE_URL` |
| `NODE_ENV` | Yes | Backend | `development`, `production` or `test` |
| `PORT` | Yes | Backend | Port the backend listens on inside the container (`3000`; the healthcheck and Nginx assume it) |
| `DATABASE_URL` | — | Backend | **Do not set it.** `docker-compose.yaml` builds it from the `POSTGRES_*` variables and the `postgres` service host |
| `JWT_SECRET` | Yes | Backend | Access token signing secret. At least 32 characters |
| `JWT_REFRESH_SECRET` | Yes | Backend | Refresh token signing secret. At least 32 characters and **different from `JWT_SECRET`** |
| `JWT_EXPIRATION` | No | Backend | Access token lifetime (`15m`, `1h`…). Default `15m` |
| `JWT_REFRESH_EXPIRATION` | No | Backend | Refresh token lifetime (`7d`…). Default `7d` |
| `ALLOWED_ORIGINS` | No | Backend | Comma-separated CORS origins. Dev: `http://localhost:8081` (Swagger UI). Leave it unset in prod |
| `STORAGE_DRIVER` | No | Backend | `local` (default) or `s3` |
| `S3_BUCKET`, `S3_REGION` | If `s3` | Backend | Required only when `STORAGE_DRIVER=s3`. `S3_BUCKET` is the business files bucket |
| `S3_BUCKET`, `S3_BUCKET_UPLOADS`, `S3_BUCKET_BACKUPS` | Dev | Compose (SeaweedFS) | Buckets created on startup: business files, unconfirmed uploads and DB backups. Lowercase letters, digits and hyphens |
| `S3_BACKEND_ACCESS_KEY`, `S3_BACKEND_SECRET_KEY` | Dev | Compose (SeaweedFS) | Backend credential, limited to the files and uploads buckets. Letters and digits only, at least 16 characters |
| `S3_BACKUP_ACCESS_KEY`, `S3_BACKUP_SECRET_KEY` | Dev | Compose (SeaweedFS) | **In `.env.storage.dev`**, not `.env.dev`: the backend loads `.env.dev` whole. Backup service credential, limited to the backups bucket. Same format |
| `S3_ADMIN_ACCESS_KEY`, `S3_ADMIN_SECRET_KEY` | Dev | Compose (SeaweedFS) | **In `.env.storage.dev`**. Admin credential, used only by `storage-init` to configure the buckets. Same format |
| `S3_CORS_ORIGINS` | Dev | Compose (SeaweedFS) | Comma-separated origins allowed to call the storage directly (presigned URLs). Separate from `ALLOWED_ORIGINS` |

To generate a secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run it once per secret: two runs, two different values.

### OpenAPI Build Service (Development Only)

An init container that bundles and validates the modular OpenAPI contract before the backend and the docs viewer can use it.

**Configuration:**

- Container name: `torneria-openapi-build`
- Network: `torneria-network`
- Defined only in `docker-compose.dev.yaml` — this service does not exist in production. Bundling the OpenAPI contract for production is planned to happen inside the backend's `production` Dockerfile stage instead (baked into the image at build time), consistent with how the frontend's Nginx config and the rest of the production setup avoid runtime dependencies.

**What it does:**

Reads the source OpenAPI files (bind-mounted, not copied into the image, so edits are picked up without rebuilding) and runs, in order:

1. `redocly lint` + `spectral lint` (contract validation)
2. `redocly bundle` → writes `openapi.yaml` to the shared `build/` directory

Because this runs once per container start rather than being baked into an image, changing the OpenAPI source requires re-running the container to see the update reflected — run `make openapi-docs-build`, which rebuilds the `openapi-build` image (its `package.json` is copied into the image) and runs it once with `docker compose run --rm`.

**Build context:** `../../tooling/openapi`

### OpenAPI Docs Service (Development Only)

The official `swaggerapi/swagger-ui` image (no custom Dockerfile) serving the contract bundled by `openapi-build`.

**Configuration:**

- Container name: `torneria-openapi-docs`
- Network: `torneria-network`
- Port: `8081:8080` (the image listens on 8080)
- Spec: `../../build` is mounted read-only at `/spec`, and `SWAGGER_JSON=/spec/openapi.yaml` points the UI at it. The image links the file instead of copying it, so a re-bundle shows up after a `Ctrl+F5` without restarting the container. Do not mount anything over `/usr/share/nginx/html`: that is where the image keeps the Swagger UI itself.
- Depends on: `openapi-build` (`condition: service_completed_successfully`) — waits for the bundle to exist before starting
- Defined only in `docker-compose.dev.yaml`, for the same reason as `openapi-build` above

**Why it's decoupled from the backend:** it is the only API documentation (the backend no longer serves Swagger at `/docs`), and running it apart keeps the contract readable even if the backend container is down or crashing.

**How "Try it out" reaches the backend:** the requests are sent by the browser, not by the container, to the server picked in the UI. `openapi.yaml` declares two:

- `http://localhost/api` (default): through Nginx, like the frontend. It is the one to use for the session endpoints, because the `refresh_token` cookie has `Path=/api/auth` and the browser only sends it to URLs under `/api/auth`.
- `http://localhost:3000`: the backend directly, without Nginx and without `/api`. Everything works except `/auth/refresh` and `/auth/logout`, which never receive the cookie.

Since the page is served from another origin (`:8081`), the backend enables CORS for the origins listed in `ALLOWED_ORIGINS`, with `credentials: true`. `WITH_CREDENTIALS=true` makes Swagger UI send its requests with `credentials: 'include'`, so the browser stores the cookie set by `POST /auth/login` and sends it back to `/auth/refresh` and `/auth/logout`. Both sides are needed: without either, the browser drops the `Set-Cookie`.

## Usage

All Docker operations are managed through the Makefile at the project root. See `make help` for available commands.

### Quick Start (Development)

```bash
# Start the development environment
make dev

# View logs
make dev-logs

# Stop services
make dev-down

# Reset database (removes volumes)
make dev-down-v
```

### Production

```bash
# Start production environment
make prod

# View logs
make prod-logs

# Stop services
make prod-down
```

### Database Management

```bash
# Run Prisma migrations
make migrate

# Execute database seed
make seed

# Connect to PostgreSQL shell
make shell-db
```

## Development Environment Setup

`make dev-*` passes `.env.dev` both to Compose (`--env-file`, for interpolation) and to the backend (`env_file`); see [Environment Variables](#environment-variables). The file is local-only and gitignored. Create it from the template before starting Docker Compose:

```bash
cp .env.example .env.dev
```

### How It Works

1. **Base Configuration** (`docker-compose.yaml`):
   - Defines services and base settings
   - Uses environment variables for configuration
   - Sets up networking and health checks

2. **Development Overrides** (`docker-compose.dev.yaml`):
   - Exposes ports for local development (backend on 3000, postgres on 5432, frontend on 5173)
   - Mounts backend and frontend source code as volumes for hot reload
   - Uses development build target with `npm run start:dev` (backend) / `npm run dev` (frontend)
   - Creates persistent volume for database data
   - Sets the frontend's dev-server variables directly in `environment` (`API_PROXY_TARGET=http://backend:3000`, `VITE_WATCH_POLLING=true`, `VITE_USE_MOCKS=false`)

3. **Environment Variables** (`.env.dev`):
   - Sets NODE_ENV to `development`
   - Sets database credentials and the JWT secrets (the example values work as is)
   - Sets `ALLOWED_ORIGINS=http://localhost:8081` so Swagger UI can call the backend

### Features

- **Hot Reload**: Backend and frontend code changes are immediately reflected without container restart
- **Database Persistence**: Data persists across container restarts in `postgres_dev_data` volume
- **Easy Shell Access**: Quick access to backend container (`make shell-backend`) and database (`make shell-db`)
- **Full Logging**: Direct access to container logs for debugging

## Production Environment Setup

### How It Works

1. **Base Configuration** (`docker-compose.yaml`):
   - Same as development

2. **Production Overrides** (`docker-compose.prod.yaml`):
   - No exposed ports for backend or frontend (services communicate internally through the network; only the reverse proxy, once added, will publish ports to the host)
   - Uses production build target for optimized images (backend runs compiled `dist/`; frontend is served by Nginx from a static `dist/` build, no Node runtime)
   - No bind mounts — code is baked into the image at build time
   - Implements resource limits and reservations per service

3. **Environment Variables** (`.env.prod`):
   - Sets NODE_ENV to `production`
   - Uses its own database password and JWT secrets, generated for production and never copied from `.env.example` or `.env.dev`
   - Leaves `ALLOWED_ORIGINS` unset: the frontend reaches the backend through Nginx from the same origin, so CORS stays disabled

### Features

- **Optimized Images**: Production builds are smaller and more efficient. The frontend's production image doesn't include Node at all — only Nginx and the compiled static files.
- **Resource Limits**: CPU and memory constraints prevent resource exhaustion
  - Backend — CPU: limited to 1 core / Memory: limited to 512MB with 256MB reservation
  - Frontend — CPU: limited to (see current value in `docker-compose.prod.yaml`) / Memory: limited to 256MB with 128MB reservation (Nginx serving static files is lightweight compared to the backend)
- **No Port Exposure**: Services only communicate internally through named networks
- **Persistent Database**: Data persists in `postgres_prod_data` volume

## Nginx (Frontend Static Serving)

The frontend's `production` build stage is based on `nginx:alpine`. Nginx here does not execute any application code — it either serves pre-built static files or (in a separate, not-yet-implemented reverse proxy service) forwards traffic to other containers.

**`nginx/frontend.conf`** configures:

- `listen 80;` — internal HTTP only; TLS termination and public-facing HTTPS are handled by the reverse proxy (planned, not yet implemented), not by this container.
- `root /usr/share/nginx/html;` — matches the path where the Dockerfile copies the compiled `dist/`.
- `location / { try_files $uri $uri/ /index.html; }` — resolves client-side routing (React Router): if the requested path doesn't match a real file (e.g. `/quotes/123`), Nginx falls back to `index.html` so the SPA can handle the route itself. Real static assets (JS, CSS) are still served directly when they exist, since `$uri` is tried first.

**Config delivery:** the config is copied into the image at build time (`COPY` in the Dockerfile), not mounted as a volume at runtime — this keeps the production image fully self-contained and reproducible, consistent with how the OpenAPI bundle is handled in the backend's production stage.

## PostgreSQL Initialization

### First Start

When the PostgreSQL container starts for the first time, it automatically executes all SQL and shell scripts found in `postgres/init/`:

```
postgres/init/
├── *.sql       # SQL initialization scripts
├── *.sh        # Shell scripts
└── .gitkeep    # Placeholder (directory exists in git)
```

### Adding Initialization Scripts

1. Create `.sql` or `.sh` files in `postgres/init/`
2. Files are executed in alphabetical order
3. Restart the container or use `make dev-down-v && make dev` to reinitialize

Example SQL script:

```sql
-- postgres/init/01-extensions.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

Example Shell script:

```bash
#!/bin/bash
# postgres/init/02-setup.sh
echo "Custom PostgreSQL setup"
```

## Networking

All services communicate through the `torneria-network` bridge network:

- **Backend**: Connects to PostgreSQL at hostname `postgres:5432`
- **Frontend**: Reachable internally at hostname `frontend:80` (used by the reverse proxy once implemented; not reachable from the host in production)
- **Database URL** (for backend):
  ```
  postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
  ```

Services are isolated from the host network and can only be accessed through exposed ports (in development). In production, only the reverse proxy (planned) will expose ports to the host.

## Volumes

### Development

| Volume              | Mount Point                                       | Purpose                                                        |
| ------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| `postgres_dev_data` | `/var/lib/postgresql/data`                        | Database persistence                                           |
| Host directory      | `/app` (backend)                                  | Source code hot reload                                         |
| Host directory      | `/app` (frontend)                                 | Source code hot reload                                         |
| Host directory      | `/spec` (openapi-docs, read-only)                 | Bundled OpenAPI contract read by Swagger UI                    |

Both backend and frontend also use an anonymous volume for `/app/node_modules`, so the container's installed dependencies aren't overwritten by the host's bind mount.

### Production

| Volume               | Mount Point                | Purpose              |
| -------------------- | -------------------------- | -------------------- |
| `postgres_prod_data` | `/var/lib/postgresql/data` | Database persistence |

No volumes are used for backend or frontend in production — both are fully baked into their respective images at build time.

## Building Images

### Automatic Builds

Images are automatically built when running `docker compose up --build`:

```bash
make dev-build      # Rebuild and start development
make prod-build     # Rebuild and start production
```

### Manual Builds

```bash
# Build using docker compose
docker compose -f docker-compose.yaml -f docker-compose.dev.yaml build

# Build specific service
docker compose -f docker-compose.yaml -f docker-compose.dev.yaml build backend
docker compose -f docker-compose.yaml -f docker-compose.dev.yaml build frontend
```

### Build Context

- **Backend**: Context is `../../backend/` (the backend directory)
- **Postgres**: Context is `./postgres/` (the postgres subdirectory)
- **Frontend**: Context is `../..` (the repository root), with `dockerfile: frontend/Dockerfile`. The wider context is required because the `production` stage copies `nginx/frontend.conf` from `infrastructure/docker/nginx/`, which lives outside the `frontend/` folder. All `COPY` instructions in the frontend Dockerfile are written relative to the repo root accordingly (e.g. `COPY frontend/package*.json ./`).
- **OpenAPI tooling**: Context is `../../tooling/openapi/`. Used by `openapi-build`; `openapi-docs` uses the stock `swaggerapi/swagger-ui` image with no build step of its own.

## Health Checks

Only the PostgreSQL service implements health checks:

```yaml
healthcheck:
  test: ['CMD-SHELL', 'pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}']
  interval: 10s
  timeout: 5s
  retries: 5
```

The backend waits for PostgreSQL to be healthy before starting:

```yaml
depends_on:
  postgres:
    condition: service_healthy
```

This ensures the database is ready before the application attempts to connect. The frontend does not depend on any health check (see the Frontend Service section above).

## Troubleshooting

### Container fails to start

**Problem**: Backend container exits immediately

**Solution**:

1. Check logs: `make dev-logs`
2. Verify database connectivity: `make shell-db`
3. Ensure environment variables are set: if the log shows lines like `JWT_SECRET: ...` or `PORT: ...`, the environment validation failed. Compare `.env.dev` with `.env.example` (see [Variables](#variables)) and recreate the container
4. Check Prisma migrations: `make migrate`

### Frontend build fails with "file not found" on package.json

**Problem**: `COPY frontend/package*.json ./` (or similar) fails during `docker compose build frontend`

**Solution**:

1. Confirm the frontend service's `build.context` is set to the repo root (`../..`), not `frontend/`
2. Confirm every `COPY` in `frontend/Dockerfile` is written relative to the repo root, not to `frontend/` itself

### Frontend not reachable at localhost:5173

**Problem**: Browser can't connect even though the container is running

**Solution**:

1. Confirm `vite.config.ts` has `server.host: '0.0.0.0'` — without it, Vite only listens inside the container's own loopback interface
2. Confirm the port mapping `"5173:5173"` is present in `docker-compose.dev.yaml`

### Database connection refused

**Problem**: `Error: connect ECONNREFUSED postgres:5432`

**Solution**:

1. Verify PostgreSQL container is running: `make ps`
2. Wait for health check to pass (may take 30-60 seconds)
3. Check PostgreSQL logs: `docker compose -f docker-compose.yaml -f docker-compose.dev.yaml logs postgres`

### Port already in use

**Problem**: `Error: bind: address already in use`

**Solution**:

1. Stop other containers: `docker compose down` (all projects)
2. Change the host side of the mapping in `docker-compose.dev.yaml` (e.g. `"3001:3000"` or `"5433:5432"`). Do not change `PORT` in `.env.dev`: the healthcheck and Nginx expect the backend on 3000 inside the network
3. List port usage: `lsof -i :3000` (macOS/Linux) or `netstat -ano | findstr :3000` (Windows)

### Data persistence issues

**Problem**: Data is lost after `docker compose down`

**Solution**:

- Use `make dev-down` instead of `make dev-down-v`
- `dev-down-v` removes volumes (intentional reset)
- To backup data: `docker volume inspect <volume-name>`

### Slow performance (Windows/Mac)

**Problem**: Slow file system performance with mounted volumes

**Solution**:

1. Use named volumes instead of bind mounts (production does this)
2. Exclude large directories from mounts (node_modules is already excluded)
3. Check Docker Desktop resource allocation

### Swagger UI cannot load the contract

**Problem**: `http://localhost:8081` opens but shows an error loading the spec.

**Solution**:

1. Check on the host that `build/openapi.yaml` exists. If it does not, run `make openapi-docs-build` and read its output: a lint error in the contract stops the bundle.
2. Check `make openapi-docs-logs`.

### Swagger "Try it out" fails

**Problem**: requests from Swagger UI fail.

**Solution**:

1. CORS error in the browser console (F12): `ALLOWED_ORIGINS` in `.env.dev` must include `http://localhost:8081`. Recreate the backend container after changing it.
2. `404` with a NestJS error body: the request reached the backend, but the path is wrong. The `servers` URL in `openapi.yaml` must be `http://localhost:3000`, without `/api` (that prefix only exists in Nginx).

## Docker Compose Commands Reference

Common docker compose commands (these are wrapped in the Makefile):

```bash
# Compose with development configuration
docker compose \
  -f docker-compose.yaml \
  -f docker-compose.dev.yaml \
  --env-file .env.dev \
  <command>

# Compose with production configuration
docker compose \
  -f docker-compose.yaml \
  -f docker-compose.prod.yaml \
  --env-file .env.prod \
  <command>
```

## Environment Variable Expansion

Docker Compose supports environment variable substitution in compose files:

- `${VAR_NAME}`: Expands to the value from the file passed with `--env-file` (`.env.dev`, `.env.prod` or `.env.test`)
- `$${VAR_NAME}`: Escapes to literal `${VAR_NAME}` (used in shell scripts)

Example in docker-compose.yaml:

```yaml
healthcheck:
  test: ['CMD-SHELL', 'pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}']
```

The double `$$` ensures the variable is passed to the container instead of being expanded by Compose.

This same substitution mechanism (single `$`) is what builds `DATABASE_URL` from the `POSTGRES_*` variables in the `x-database-url` anchor of `docker-compose.yaml`.

## Pending / Next Steps

- **Reverse proxy** (Nginx, separate from the frontend's static-serving Nginx): will sit in front of both `frontend` and `backend`, be the only service exposing ports to the host in production, and handle TLS termination. Its Dockerfile and config will live under `infrastructure/docker/nginx/` as well, in a separate file from `frontend.conf`.
- Confirm final CPU value for the frontend's `deploy.resources` in `docker-compose.prod.yaml`.
- MinIO, Postgres backup scripts, and Terraform scaffolding remain pending per the broader Sprint 2 roadmap.

## Related Documentation

- [Setup Guide](../../docs/SETUP.md) - Initial project setup and configuration
- [Makefile](../../Makefile) - Docker commands and shortcuts
- [Backend Dockerfile](../../backend/Dockerfile) - Application build configuration
- [Frontend Dockerfile](../../frontend/Dockerfile) - Application build configuration
- [Contributing Guide](../../docs/CONTRIBUTING.MD) - Team conventions and standards
