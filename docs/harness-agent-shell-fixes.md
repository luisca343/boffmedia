# Harness Agent — Shell Script Fixes (Windows/WSL)

> **Environment**: Windows + WSL (bash via PowerShell)  
> **Date**: 2026-05-15

---

## Issues Found

| Script | Status | Root cause |
|---|---|---|
| `docker.sh up/status` | ✅ Working | — |
| `migrate.sh` | ❌ `AGENT_DATABASE_URL: unbound variable` | `.env.agent` not loaded |
| `seed.sh` | ❌ `AGENT_DATABASE_URL: unbound variable` | `.env.agent` not loaded |
| `lint.sh` | ❌ `exec: node: not found` | WSL bash cannot reach Windows-installed Node |
| `git.sh current` | ✅ Working | — |

---

## Fix 1 — Load `.env.agent` in shell scripts

Shell scripts do not auto-load `.env` files. Add the following block at the top of every script that requires environment variables, **before** `set -euo pipefail`.

### `scripts/migrate.sh`

```bash
#!/usr/bin/env bash
REPO_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
[ -f "$REPO_ROOT/.env.agent" ] && set -a && source "$REPO_ROOT/.env.agent" && set +a

set -euo pipefail
cd "$(dirname "$0")/../../../apps/api"
DATABASE_URL="$AGENT_DATABASE_URL" pnpm drizzle-kit migrate
```

### `scripts/seed.sh`

```bash
#!/usr/bin/env bash
REPO_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
[ -f "$REPO_ROOT/.env.agent" ] && set -a && source "$REPO_ROOT/.env.agent" && set +a

set -euo pipefail
FIXTURE=${1:-default}
cd "$(dirname "$0")/../../../apps/api"
DATABASE_URL="$AGENT_DATABASE_URL" tsx src/seed/$FIXTURE.ts
```

### Apply the same block to any other script that uses env vars

The pattern is always the same — add these two lines at the very top, before `set -euo pipefail`:

```bash
REPO_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
[ -f "$REPO_ROOT/.env.agent" ] && set -a && source "$REPO_ROOT/.env.agent" && set +a
```

### How it works

- `REPO_ROOT` resolves the absolute path to the repo root regardless of where the script is called from
- `[ -f ... ]` only sources the file if it exists — scripts won't break in CI where `.env.agent` is absent and secrets come from environment variables instead
- `set -a` auto-exports every variable defined in the sourced file
- `set +a` turns auto-export off afterward so it doesn't leak into child processes

---

## Fix 2 — `lint.sh`: WSL bash cannot find Node

### Root cause

`pnpm` is installed in Windows (`C:\Users\...\AppData\Roaming\npm\pnpm`). When WSL bash executes the pnpm shim it resolves to a Windows path, but WSL cannot find the `node` binary through that path.

### Short-term fix — run lint from PowerShell directly

Until Node is installed inside WSL, run lint commands from PowerShell instead of bash:

```powershell
pnpm --filter api lint
pnpm --filter api exec tsc --noEmit
```

### Long-term fix — install Node inside WSL

This makes all bash scripts work correctly and is the recommended permanent solution.

```bash
# Run inside WSL terminal
curl -fsSL https://fnm.vercel.app/install | bash

# Restart the WSL terminal, then:
fnm install 20
fnm use 20
npm install -g pnpm
```

After this, `bash scripts/lint.sh api` will work correctly from WSL.

### Verify Node is available inside WSL

```bash
node --version   # should print v20.x.x
pnpm --version   # should print 9.x.x (or your installed version)
```

---

## Verification — re-run all scripts after fixes

Run these in order from `packages/agent/`:

```bash
# 1. Environment (already working)
bash scripts/docker.sh up
bash scripts/docker.sh status

# 2. Migrations (fixed — .env.agent now loaded)
bash scripts/migrate.sh

# 3. Seed (fixed — .env.agent now loaded)
bash scripts/seed.sh default

# 4. Lint — run from PowerShell short-term, or bash after WSL Node install
pnpm --filter api lint
pnpm --filter api exec tsc --noEmit

# 5. Git (already working)
bash scripts/git.sh current
```

All five should exit 0 with clean output before moving to Phase 2.

---

## Commit message

```
fix(agent): load .env.agent in shell scripts, document WSL Node fix

- Add .env.agent auto-loader block to migrate.sh and seed.sh
- Scripts now source repo root .env.agent before executing if present
- CI-safe: block is skipped when .env.agent does not exist
- Document short-term (PowerShell) and long-term (fnm) fix for
  lint.sh Node resolution failure in WSL environments
```
