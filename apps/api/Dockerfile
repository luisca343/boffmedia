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

# ---- FVX build stage ----
# Builds FVX randomizer from source (commit d9700e2dd668f19e1392b8d5e8f370dd484245b3)
# with --seed flag patch, plus compiles SettingsShim jar
FROM eclipse-temurin:21-jdk AS fvx-build

RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /build

# Clone the FVX repo and check out the pinned commit
RUN git clone https://github.com/upr-fvx/universal-pokemon-randomizer-fvx.git fvx && \
    cd fvx && \
    git checkout d9700e2dd668f19e1392b8d5e8f370dd484245b3 || exit 1

# Copy and apply the --seed flag patch
COPY apps/api/docker/fvx/seed-flag.patch /build/fvx/
WORKDIR /build/fvx
RUN git apply --verbose seed-flag.patch || (echo "Patch application failed" && exit 1)

# Build the fat jar with Gradle (requires Java 21 + preview flag)
RUN ./gradlew jar -x test --no-daemon && \
    mkdir -p /opt/fvx && \
    cp random/build/libs/UPR-FVX.jar /opt/fvx/fvx.jar

# Compile SettingsShim against the built FVX jar
COPY apps/api/docker/fvx/SettingsShim.java /build/SettingsShim.java
RUN mkdir -p /build/shim-out && \
    javac --release 21 --enable-preview -cp /opt/fvx/fvx.jar -d /build/shim-out /build/SettingsShim.java && \
    cd /build/shim-out && \
    jar cf /opt/fvx/settings-shim.jar . || exit 1

# ---- JRE stage ----
# Extract Java 21 runtime for the runner image
FROM eclipse-temurin:21-jre AS jre

# ---- Production image ----
# node:20-slim (Debian) is required — Playwright does not support Alpine.
FROM node:20-slim AS runner
WORKDIR /app

# Install runtime system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    calibre \
    && rm -rf /var/lib/apt/lists/*

# Copy Java 21 runtime from jre stage
ENV JAVA_HOME=/opt/java/openjdk
COPY --from=jre $JAVA_HOME $JAVA_HOME
ENV PATH=$JAVA_HOME/bin:$PATH

# Copy FVX jars from fvx-build stage
COPY --from=fvx-build /opt/fvx /opt/fvx

# Create scratch directory for randomizer operations
# Recommended: run with --tmpfs /tmp/randomizer:size=512m to avoid disk I/O
RUN mkdir -p /tmp/randomizer

# Set randomizer environment variables
ENV RANDOMIZER_JAR="/opt/fvx/fvx.jar"
ENV RANDOMIZER_SHIM_JAR="/opt/fvx/settings-shim.jar"
ENV RANDOMIZER_JAVA="java"
ENV RANDOMIZER_SCRATCH_DIR="/tmp/randomizer"
ENV RANDOMIZER_MAX_CONCURRENCY="3"
ENV RANDOMIZER_TIMEOUT_MS="180000"

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

