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
COPY packages/ui/package.json ./packages/ui/
COPY packages/tailwind-config/package.json ./packages/tailwind-config/
# Domain tool packages are `workspace:*` dependencies of apps/web since the
# tools extraction — without their manifests here, `pnpm install` cannot resolve
# @boffmedia/tool-kit, /tools-minecraft or /tools-mhwilds and the build dies.
COPY packages/tools/kit/package.json ./packages/tools/kit/
COPY packages/tools/minecraft/package.json ./packages/tools/minecraft/
COPY packages/tools/mhwilds/package.json ./packages/tools/mhwilds/
# Whole package: its `prepare` script builds on install (see apps/api/Dockerfile).
COPY packages/pack-schema ./packages/pack-schema
# Same reason as pack-schema above: asset-paths compiles on install.
COPY packages/asset-paths ./packages/asset-paths
COPY apps/web/package.json ./apps/web/

RUN pnpm install --no-frozen-lockfile

# ---- Build stage ----
FROM deps AS builder
WORKDIR /app

COPY packages/shared ./packages/shared
# @boffmedia/ui ships TypeScript source (transpilePackages) and
# @boffmedia/tailwind-config carries the v3 tokens AND the webfonts — without
# it the build succeeds and every page renders in a fallback typeface.
COPY packages/ui ./packages/ui
COPY packages/tailwind-config ./packages/tailwind-config
# Same deal as @boffmedia/ui: the tool packages ship TS source that Next
# transpiles, and their message catalogs are merged at request time.
COPY packages/tools ./packages/tools
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