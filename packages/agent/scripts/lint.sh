#!/usr/bin/env bash
set -euo pipefail
APP=${1:-all}
REPO_ROOT="$(dirname "$0")/../../.."

SAFE_NODE_OPTIONS="${AGENT_NODE_OPTIONS:---max-old-space-size=1536}"
export NODE_OPTIONS="$SAFE_NODE_OPTIONS"

run_eslint() {
  local app="$1"
  case "$app" in
    api)
      NODE_OPTIONS="$SAFE_NODE_OPTIONS" pnpm --filter api exec eslint "{src,apps,libs,test}/**/*.ts"
      ;;
    web)
      NODE_OPTIONS="$SAFE_NODE_OPTIONS" pnpm --filter web exec eslint src
      ;;
    *)
      echo "Unsupported app for lint: $app"
      return 1
      ;;
  esac
}

run_lint() {
  echo "Linting $1..."
  run_eslint "$1"
  NODE_OPTIONS="$SAFE_NODE_OPTIONS" pnpm --filter "$1" exec tsc --noEmit
}

cd "$REPO_ROOT"

if [[ "$APP" == "all" ]]; then
  run_lint "api"
  run_lint "web"
elif [[ "$APP" == *,* ]]; then
  IFS=',' read -r -a apps <<< "$APP"
  for app in "${apps[@]}"; do
    run_lint "$app"
  done
else
  run_lint "$APP"
fi