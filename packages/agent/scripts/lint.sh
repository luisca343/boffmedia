#!/usr/bin/env bash
set -euo pipefail
APP=${1:-all}
REPO_ROOT="$(dirname "$0")/../../.."

export NODE_OPTIONS="--max-old-space-size=1024"

run_lint() {
  echo "Linting $1..."
  pnpm --filter "$1" lint
  pnpm --filter "$1" exec tsc --noEmit
}

cd "$REPO_ROOT"

if [[ "$APP" == "all" ]]; then
  run_lint "api"
  run_lint "web"
else
  run_lint "$APP"
fi