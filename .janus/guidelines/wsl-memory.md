---
description: WSL memory management and build tooling constraints
applyTo: "**"
---

## WSL memory management is critical

This monorepo runs on WSL and has experienced OOM crashes. Memory-safe execution is a first-class concern.

## Sequential execution

- `pnpm lint` runs ESLint on `apps/web` and `apps/api` **sequentially** with 2GB per process.
- `pnpm type-check` runs `tsc --noEmit` on both apps **sequentially** with 2GB per process.
- Never use `pnpm lint:parallel` or `pnpm type-check:parallel` unless >16GB RAM is available.

## Memory limits

- `pnpm dev:api` starts with `--max-old-space-size=3072` (3GB).
- `pnpm --filter api test` uses `--max-old-space-size=4096` (4GB).
- Lint and type-check use `--max-old-space-size=2048` (2GB).

## Pre-flight check

- Run `pnpm memory-check` before heavy operations.
- Script exits with code 1 if <4GB available memory.

## OOM protection

- `scripts/setup-oom-protection.sh` installs `earlyoom` and sets up cgroup v2 memory limits (8GB cap).
- Run with `sudo` on fresh WSL setups.

## Next.js build

- `next.config.mjs` has `ignoreBuildErrors: true` — TypeScript errors do NOT fail the build.
- Always run `pnpm type-check` separately to catch TS errors.
- `output: "standalone"` is set for Docker-optimized builds.
