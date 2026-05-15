#!/usr/bin/env bash
REPO_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
[ -f "$REPO_ROOT/.env.agent" ] && set -a && source "$REPO_ROOT/.env.agent" && set +a

set -euo pipefail
FIXTURE=${1:-default}
cd "$(dirname "$0")/../../../apps/api"
DATABASE_URL="$AGENT_DATABASE_URL" tsx src/seed/$FIXTURE.ts
