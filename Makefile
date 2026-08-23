\
# ============================================================================
# Makefile — Tornería Castro
# Shortcuts to run docker-compose commands for development and production.
# Execute `make help` to see the list of available commands.
# ============================================================================

.DEFAULT_GOAL := help

# ---- Env and Compose Paths ------------------------------------------------
COMPOSE_BASE := infrastructure/docker/docker-compose.yaml
COMPOSE_DEV  := infrastructure/docker/docker-compose.dev.yaml
COMPOSE_PROD := infrastructure/docker/docker-compose.prod.yaml
ENV_DEV      := infrastructure/docker/.env.dev
ENV_PROD     := infrastructure/docker/.env.prod

DC_DEV  := docker compose -f $(COMPOSE_BASE) -f $(COMPOSE_DEV)  --env-file $(ENV_DEV)
DC_PROD := docker compose -f $(COMPOSE_BASE) -f $(COMPOSE_PROD) --env-file $(ENV_PROD)

# Loads variables from .env.dev as Make variables (for targets like shell-db).
# The "-" before include prevents failure if the file doesn't exist yet.
-include $(ENV_DEV)
export

.PHONY: help dev dev-build dev-down dev-down-v dev-logs dev-restart ps \
        prod prod-build prod-down prod-logs \
        migrate seed shell-backend shell-db clean

help: ## Shows this list of commands
	@echo ""
	@echo "Usage: make <command>"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'
	@echo ""

# ---- Development -----------------------------------------------------------

dev-up: ## Starts backend + postgres in development mode (detached)
	$(DC_DEV) up -d

dev-build: ## Rebuilds images and starts development
	$(DC_DEV) up -d --build

dev-down: ## Stops development containers
	$(DC_DEV) down

dev-down-v: ## Stops development and removes volumes (complete local DB reset)
	$(DC_DEV) down -v

dev-logs: ## Follows logs from all services (dev)
	$(DC_DEV) logs -f

dev-restart: ## Restarts backend (dev) without touching postgres
	$(DC_DEV) restart backend

ps: ## Shows the status of containers (dev)
	$(DC_DEV) ps

# ---- Production -----------------------------------------------------------

prod: ## Starts the production environment (detached)
	$(DC_PROD) up -d

prod-build: ## Rebuilds images and starts production
	$(DC_PROD) up -d --build

prod-down: ## Stops production containers
	$(DC_PROD) down

prod-logs: ## Follows production logs
	$(DC_PROD) logs -f

# ---- Database / Prisma ---------------------------------------------------

migrate: ## Runs Prisma migrations inside the backend container (dev)
	$(DC_DEV) exec backend npx prisma migrate deploy

seed: ## Runs Prisma seed inside the backend container (dev)
	$(DC_DEV) exec backend npx prisma db seed

# ---- Utilities -----------------------------------------------------------

shell-backend: ## Opens a shell inside the backend container (dev)
	$(DC_DEV) exec backend sh

shell-db: ## Opens psql inside the postgres container (dev)
	$(DC_DEV) exec postgres psql -U $(POSTGRES_USER) -d $(POSTGRES_DB)

clean: ## Stops everything, removes volumes and orphaned images/containers (dev)
	$(DC_DEV) down -v --remove-orphans
