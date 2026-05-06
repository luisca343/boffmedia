# Build from the monorepo root:
#   docker build -f apps/api/Dockerfile -t boffmedia-api .

FROM node:20-slim AS base
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg && rm -rf /var/lib/apt/lists/*
RUN corepack enable

# ---- Install stage ----
FROM base AS deps
WORKDIR /app

# Copy workspace manifests for layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

RUN pnpm install --no-frozen-lockfile

# ---- Build stage ----
FROM deps AS builder
WORKDIR /app

COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

RUN pnpm --filter api build

# Prune to production-only deps for the API
RUN pnpm deploy --filter api --prod --legacy /app/deploy

# ---- Production image ----
# node:20-slim (Debian) is required — Playwright does not support Alpine.
FROM node:20-slim AS runner
WORKDIR /app

# Install runtime system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    calibre \
    && rm -rf /var/lib/apt/lists/*

# Copy compiled output
COPY --from=builder /app/apps/api/dist ./dist

# Copy production node_modules (from pnpm deploy)
COPY --from=builder /app/deploy/node_modules ./node_modules

# Install Playwright's Chromium browser + its OS-level dependencies
    RUN node node_modules/playwright/cli.js install --with-deps chromium
# Copy runtime assets
COPY --from=builder /app/apps/api/drizzle ./drizzle
COPY --from=builder /app/apps/api/package.json ./

# NOTE: mount your Google service-account JSON at runtime, e.g.:
#   docker run -v /etc/boffmedia/boffmedia-b6e4f721c326.json:/app/boffmedia-b6e4f721c326.json ...

EXPOSE 3000
ENV NODE_OPTIONS="--max-old-space-size=4096"

CMD ["node", "dist/main.js"]

