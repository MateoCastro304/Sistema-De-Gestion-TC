# ============================================================================
# Makefile — Tornería Castro
# Shortcuts to run docker-compose commands for development and production.
# Execute `make help` to see the list of available commands.
# ============================================================================

.DEFAULT_GOAL := help

# ---- Env and Compose Paths ------------------------------------------------
COMPOSE_BASE  := infrastructure/docker/docker-compose.yaml

COMPOSE_DEV   := infrastructure/docker/docker-compose.dev.yaml
COMPOSE_PROD  := infrastructure/docker/docker-compose.prod.yaml
COMPOSE_TEST := infrastructure/docker/docker-compose.test.yaml

ENV_DEV       := infrastructure/docker/.env.dev
ENV_PROD      := infrastructure/docker/.env.prod
ENV_TEST			:= infrastructure/docker/.env.test

DC_DEV  := docker compose -f $(COMPOSE_BASE) -f $(COMPOSE_DEV)  --env-file $(ENV_DEV)
DC_PROD := docker compose -f $(COMPOSE_BASE) -f $(COMPOSE_PROD) --env-file $(ENV_PROD)
DC_TEST := docker compose -f $(COMPOSE_BASE) -f $(COMPOSE_TEST) --env-file $(ENV_TEST)

# Loads variables from .env.dev as Make variables (for targets like shell-db).
# The "-" before include prevents failure if the file doesn't exist yet.
-include $(ENV_DEV)
export

.PHONY: help \
        dev-up dev-build dev-down dev-down-v dev-logs ps clean \
        backend-restart backend-logs backend-shell backend-build \
        migrate seed test-int test-module \
        frontend-restart frontend-logs frontend-shell frontend-build \
        shell-db \
				openapi-docs-build openapi-docs-logs \
        prod-up prod-build prod-down prod-logs

help: ## Shows this list of commands
	@echo ""
	@echo "Usage: make <command>"
	@echo ""
	@grep -E '^[a-zA-Z0-9_-]+:[[:space:]]*##' Makefile | \
		sed 's/:.*##[[:space:]]*/ /' | \
		awk '{printf "  \033[36m%-20s\033[0m %s\n", $$1, substr($$0, index($$0,$$2))}'
	@echo ""

# ---- Dev Environment Wide -------------------------------------------------

dev-up: ## Starts all services in development mode (detached)
	$(DC_DEV) up -d

dev-build: ## Rebuilds images and starts development
	$(DC_DEV) up -d --build

dev-stop: ## Stops development containers
	$(DC_DEV) stop

dev-down: ## Stops development containers
	$(DC_DEV) down

dev-down-v: ## Stops development and removes volumes (complete local DB reset)
	$(DC_DEV) down -v

dev-logs: ## Follows logs from all services (dev)
	$(DC_DEV) logs -f

ps: ## Shows the status of containers (dev)
	$(DC_DEV) ps

clean: ## Stops everything, removes volumes and orphaned images/containers (dev)
	$(DC_DEV) down -v --remove-orphans

# --- Dev Backend Scoped ----------------------------------------------------

backend-restart: ## Restarts only backend (dev)
	$(DC_DEV) restart backend

backend-logs: ## Shows only the backend logs
	$(DC_DEV) logs -f backend

backend-shell: ## Opens a shell inside the backend container (dev)
	$(DC_DEV) exec backend sh

backend-build: ## Rebuild the backend image only
	$(DC_DEV) build backend

migrate-deploy: ## Runs Prisma migrations inside the backend container (deploy/prod)
	$(DC_DEV) exec backend npm run prisma:migrate-deploy

migrate-dev: ## Runs Prisma migrations inside the backend container (dev)
	$(DC_DEV) exec backend npm run prisma:migrate-dev

migrate-create: ## Create Prisma migration inside the backend container (dev)
	$(DC_DEV) exec backend npx prisma migrate dev --create-only --name $(name)

seed: ## Runs Prisma seed inside the backend container (dev)
	$(DC_DEV) exec backend npx prisma db seed

backend-test-int: ## Runs backend integration tests inside the backend container (dev)
	$(DC_DEV) exec backend npm run test:int

backend-test: ## Runs backend integration tests inside the backend container (dev)
	$(DC_DEV) exec backend npm run test

backend-test-module: ## Runs unit and integration tests for a single module (usage: make test-module name=suppliers)
	$(DC_DEV) exec backend sh -c "npm test -- $(name); npm run test:int -- $(name)"

# ---- Frontend Scoped ------------------------------------------------------

frontend-restart: ## Restarts only frontend (dev)
	$(DC_DEV) restart frontend

frontend-logs: ## Shows only the frontend logs
	$(DC_DEV) logs -f frontend

frontend-shell: ## Opens a shell inside the frontend container
	$(DC_DEV) exec frontend sh

frontend-build: ## Rebuild the frontend image only
	$(DC_DEV) build frontend

# ---- Dev Database Scoped --------------------------------------------------

shell-db: ## Opens psql inside the postgres container (dev)
	$(DC_DEV) exec postgres psql -U $(POSTGRES_USER) -d $(POSTGRES_DB)

# ---- Dev Web Scoped (Nginx) -----------------------------------------------

web-logs: ## Shows only the web logs (nginx)
	$(DC_DEV) logs -f web

# ---- Dev Docs Scoped ------------------------------------------------------

openapi-docs-build: ## Rebuild the openapi image only and serve on port 8081
	$(DC_DEV) build openapi-build openapi-docs

openapi-docs-logs: ## Shows only the openapi-docs logs
	$(DC_DEV) logs -f openapi-docs

# ---- Testing Environment Wide -----------------------------------------

test-up: ## Starts all services in development mode (detached)
	$(DC_TEST) up -d

test-build: ## Rebuilds images and starts development
	$(DC_TEST) up -d --build

test-down: ## Stops development containers
	$(DC_TEST) down

test-down-v: ## Stops development and removes volumes (complete local DB reset)
	$(DC_TEST) down -v

test-logs: ## Follows logs from all services
	$(DC_TEST) logs -f

test-ps: ## Shows the status of containers
	$(DC_TEST) ps

test-clean: ## Stops everything, removes volumes and orphaned images/containers (dev)
	$(DC_TEST) down -v --remove-orphans

# ---- Dev Production -------------------------------------------------------

prod-up: ## Starts the production environment (detached)
	$(DC_PROD) up -d

prod-build: ## Rebuilds images and starts production
	$(DC_PROD) up -d --build

prod-logs: ## Follows production logs
	$(DC_PROD) logs -f

prod-down: ## Stops production containers
	$(DC_PROD) down
