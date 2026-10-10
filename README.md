# Tornería Castro

<!--
  Section to paste into the repo's main README.md.
  Insert/replace wherever fits (e.g. right after the project description).
-->

## 🚀 Getting Started

Requirements: Docker, Docker Compose, and `make`.

```bash
# 1. Configure environment variables (see the full guide in SETUP.md)
cp infrastructure/docker/.env.example infrastructure/docker/.env.dev

# 2. Start the project
make dev-up

# 3. Confirm everything is running
make ps
```

The API is available at `http://localhost:3000`. The API contract (Swagger UI) is at `http://localhost:8081`.

See all available commands with `make help`.

📖 Full setup guide, environment variables, and troubleshooting: **[SETUP.md](./SETUP.md)**
