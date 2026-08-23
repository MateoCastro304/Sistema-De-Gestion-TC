# Docker Infrastructure

This directory contains the Docker configuration for the Tornería Castro project, including compose files, environment configurations, and database initialization scripts.

## Overview

The project uses Docker Compose to orchestrate multiple services:

- **backend**: NestJS application server
- **postgres**: PostgreSQL 16 database server

The setup supports both development and production environments with different configurations and resource constraints.

## Directory Structure

```
docker/
├── docker-compose.yaml        # Base compose configuration (shared by all environments)
├── docker-compose.dev.yaml    # Development environment overrides
├── docker-compose.prod.yaml   # Production environment overrides
├── .env.dev                   # Development environment variables
├── .env.prod                  # Production environment variables
├── .env.example               # Template for environment variables
├── postgres/
│   ├── Dockerfile             # PostgreSQL container image configuration
│   └── init/                  # Initialization scripts (executed on first container start)
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

## Environment Variables

Environment variables are loaded from `.env.dev` or `.env.prod` files depending on the environment.

### Configuration Files

| File           | Purpose                                                            |
| -------------- | ------------------------------------------------------------------ |
| `.env.example` | Template with all required variables (check-in to version control) |
| `.env.dev`     | Development environment (gitignored, local development only)       |
| `.env.prod`    | Production environment (gitignored, sensitive data)                |

### Required Variables

```bash
# Database
POSTGRES_USER=              # PostgreSQL user
POSTGRES_PASSWORD=          # PostgreSQL password
POSTGRES_DB=                # Database name
POSTGRES_PORT=              # Port to expose (usually 5432)

# Backend
PORT=                       # Backend application port (usually 3000)
NODE_ENV=                   # Environment (development or production)
DATABASE_URL=               # Connection string (constructed from other vars)
JWT_SECRET=                 # Secret for JWT token signing
JWT_REFRESH_SECRET=         # Secret for refresh tokens
```

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

### How It Works

1. **Base Configuration** (`docker-compose.yaml`):
   - Defines services and base settings
   - Uses environment variables for configuration
   - Sets up networking and health checks

2. **Development Overrides** (`docker-compose.dev.yaml`):
   - Exposes ports for local development (backend on 3000, postgres on 5432)
   - Mounts backend source code as volume for hot reload
   - Uses development build target with `npm run start:dev`
   - Creates persistent volume for database data

3. **Environment Variables** (`.env.dev`):
   - Sets NODE_ENV to `development`
   - Configures accessible ports
   - Sets database credentials

### Features

- **Hot Reload**: Backend code changes are immediately reflected without container restart
- **Database Persistence**: Data persists across container restarts in `postgres_dev_data` volume
- **Easy Shell Access**: Quick access to backend container (`make shell-backend`) and database (`make shell-db`)
- **Full Logging**: Direct access to container logs for debugging

## Production Environment Setup

### How It Works

1. **Base Configuration** (`docker-compose.yaml`):
   - Same as development

2. **Production Overrides** (`docker-compose.prod.yaml`):
   - No exposed ports (services communicate internally)
   - Uses production build target for optimized images
   - Mounts code as read-only volumes
   - Implements resource limits and reservations

3. **Environment Variables** (`.env.prod`):
   - Sets NODE_ENV to `production`
   - Disables port exposure
   - Uses production-ready configurations

### Features

- **Optimized Images**: Production builds are smaller and more efficient
- **Resource Limits**: CPU and memory constraints prevent resource exhaustion
  - CPU: Limited to 1 core
  - Memory: Limited to 512MB with 256MB reservation
- **No Port Exposure**: Services only communicate internally through named networks
- **Persistent Database**: Data persists in `postgres_prod_data` volume

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
- **Database URL** (for backend):
  ```
  postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
  ```

Services are isolated from the host network and can only be accessed through exposed ports (in development).

## Volumes

### Development

| Volume              | Mount Point                | Purpose                |
| ------------------- | -------------------------- | ---------------------- |
| `postgres_dev_data` | `/var/lib/postgresql/data` | Database persistence   |
| Host directory      | `/app` (backend)           | Source code hot reload |

### Production

| Volume               | Mount Point                | Purpose              |
| -------------------- | -------------------------- | -------------------- |
| `postgres_prod_data` | `/var/lib/postgresql/data` | Database persistence |

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
```

### Build Context

- **Backend**: Context is `../../backend/` (the backend directory)
- **Postgres**: Context is `./postgres/` (the postgres subdirectory)

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

This ensures the database is ready before the application attempts to connect.

## Troubleshooting

### Container fails to start

**Problem**: Backend container exits immediately

**Solution**:

1. Check logs: `make dev-logs`
2. Verify database connectivity: `make shell-db`
3. Ensure environment variables are set: Check `.env.dev`
4. Check Prisma migrations: `make migrate`

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
2. Change port in `.env.dev`: Set `PORT` or `POSTGRES_PORT` to different value
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

- `${VAR_NAME}`: Expands to the value from `.env` file
- `$${VAR_NAME}`: Escapes to literal `${VAR_NAME}` (used in shell scripts)

Example in docker-compose.yaml:

```yaml
healthcheck:
  test: ['CMD-SHELL', 'pg_isready -U $${POSTGRES_USER} -d $${POSTGRES_DB}']
```

The double `$$` ensures the variable is passed to the container instead of being expanded by Compose.

## Related Documentation

- [Setup Guide](../../docs/SETUP.md) - Initial project setup and configuration
- [Makefile](../../Makefile) - Docker commands and shortcuts
- [Backend Dockerfile](../../backend/Dockerfile) - Application build configuration
- [Contributing Guide](../../docs/CONTRIBUTING.MD) - Team conventions and standards
