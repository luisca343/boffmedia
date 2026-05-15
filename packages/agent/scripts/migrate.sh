#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../../../apps/api"
DATABASE_URL="$AGENT_DATABASE_URL" pnpm drizzle-kit migrate
