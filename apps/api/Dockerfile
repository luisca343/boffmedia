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
# pack-schema is copied WHOLE at this stage, not just its package.json: its
# `prepare` script compiles the package on install, and with only a manifest
# present that tsc invocation fails and takes the whole install down.
COPY packages/pack-schema ./packages/pack-schema
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
COPY --from=builder /app/apps/api/data ./data
COPY --from=builder /app/apps/api/package.json ./
# Writable runtime cache (imageCache.json lives here, not in public/)
RUN mkdir -p var/cache

# NOTE: mount your Google service-account JSON at runtime, e.g.:
#   docker run -v /etc/boffmedia/boffmedia-b6e4f721c326.json:/app/boffmedia-b6e4f721c326.json ...

EXPOSE 34301
ENV NODE_OPTIONS="--max-old-space-size=4096"

CMD ["node", "dist/main.js"]

