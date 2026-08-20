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

# `nest build` type-checks the whole API in one pass and needs more heap than
# Node's default heuristic hands it inside a container — it dies with
# "Ineffective mark-compacts near heap limit" (exit 134) rather than a type
# error, which reads like a code failure and is not one. Stated explicitly so
# the build does not depend on how much memory the host happens to give Docker.
#
# Keep this BELOW the engine's memory limit: the value is a heap ceiling Node
# will try to reach, so setting it above what the container can supply just
# moves the failure from a V8 abort to an OOM kill.
ENV NODE_OPTIONS="--max-old-space-size=3072"

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

# Pin the Gradle toolchain to Java 21. Pristine FVX at this commit declares
# `JavaLanguageVersion.of(25)`, which this 21-jdk builder cannot provision — the
# build dies in Gradle before producing a jar. 21 is also what the determinism
# anchor (spike jar sha512 2cb5057c…) was built with, so do NOT "fix" this by
# moving the builder to a 25 JDK: that would silently produce a different jar.
RUN sed -i 's/JavaLanguageVersion.of(25)/JavaLanguageVersion.of(21)/' build.gradle.kts && \
    grep -q 'JavaLanguageVersion.of(21)' build.gradle.kts || \
    (echo "FVX toolchain pin failed — upstream build.gradle.kts changed shape" && exit 1)

# The pin above is only half the contract. This source uses unnamed variables
# (`_ ->`), which are STANDARD in the Java 25 upstream declares and a PREVIEW
# feature in the 21 we pin to — so pinning the toolchain without also enabling
# preview makes javac reject the source outright. Everything else in this system
# already carries the flag: the SettingsShim javac below, and the runtime in
# fvx-randomizer-runner.ts and fvx-settings-shim.ts.
#
# Enable it here rather than moving to a 25 JDK: preview class files are locked
# to their exact major version, the runner passes --enable-preview on 21, and the
# jar's sha512 is asserted byte-for-byte by the Phase 1 e2e test.
# `allprojects`, not a bare `tasks.withType`: the compile that fails is
# `:romio:compileJava`, and a root-scoped configuration block never reaches a
# subproject's tasks.
RUN printf '\nallprojects {\n    tasks.withType<JavaCompile>().configureEach {\n        options.compilerArgs.add("--enable-preview")\n    }\n}\n' >> build.gradle.kts && \
    grep -q 'enable-preview' build.gradle.kts || \
    (echo "FVX preview-flag injection failed" && exit 1)

# Build the fat jar with Gradle (Java 21 + preview, per the two steps above)
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

