ARG DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

# ─────────────────────────────
# 0. Base
# ─────────────────────────────

FROM node:22-alpine AS base
RUN apk add --no-cache docker-cli
WORKDIR /app
COPY package*.json ./

# ─────────────────────────────
# 1. Development
# ─────────────────────────────

FROM base AS development
ENV NODE_ENV=development

RUN npm ci

COPY . .

# prisma.config needs a DATABASE_URL to load during build,
#   this variable will be overridden by docker-compose at runtime
ARG DATABASE_URL
RUN echo "DATABASE_URL=$DATABASE_URL"

RUN npx prisma generate

EXPOSE 3000
CMD ["npm", "run", "start:dev"]

# ─────────────────────────────
# 2. Build
# ─────────────────────────────

FROM base AS build
RUN npm ci

COPY . .

# prisma.config needs a DATABASE_URL to load during build,
#   this variable will be overridden by docker-compose at runtime
ARG DATABASE_URL


RUN npx prisma generate
RUN npm run build

# ─────────────────────────────
# 3. Production
# ─────────────────────────────

FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

RUN npm ci --omit=dev && npm cache clean --force

# Same as in Build image
ARG DATABASE_URL

RUN npx prisma generate

COPY --chown=node:node --from=build /app/dist ./dist

USER node

EXPOSE 3000
CMD ["node", "dist/src/main.js"]
