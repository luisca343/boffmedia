#!/usr/bin/env bash
set -euo pipefail
FIXTURE=${1:-default}
cd "$(dirname "$0")/../../../apps/api"
DATABASE_URL="$AGENT_DATABASE_URL" tsx src/seed/$FIXTURE.ts
