# ─────────────────────────────
# 0. Base
# ─────────────────────────────

FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

# ─────────────────────────────
# 1. Development
# ─────────────────────────────

FROM base AS development
ENV NODE_ENV=development
RUN npm ci
COPY . .
RUN npx prisma generate
EXPOSE 3000
CMD ["npm", "run", "start:dev"]

# ─────────────────────────────
# 2. Build
# ─────────────────────────────

FROM base AS build
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# ─────────────────────────────
# 3. Production
# ─────────────────────────────

FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
RUN npx prisma generate
EXPOSE 3000
CMD ["node", "dist/main.js"]
