# Build from the monorepo root:
#   docker build -f apps/web/Dockerfile -t boffmedia-web .

FROM node:24-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable

# ---- Install stage ----
FROM base AS deps
WORKDIR /app

# Copy workspace manifests for layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/

RUN pnpm install --frozen-lockfile

# ---- Build stage ----
FROM deps AS builder
WORKDIR /app

COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm --filter web build

# ---- Production image ----
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir -p apps/web/.next && \
    chown -R nextjs:nodejs /app

# Keep the full standalone tree as-is — pnpm traces node_modules relative to
# the monorepo root, so flattening breaks module resolution for 'next' etc.
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
# static assets must be at the path Next.js expects relative to server.js
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })"

CMD ["node", "apps/web/server.js"]