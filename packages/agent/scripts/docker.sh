#!/usr/bin/env bash
set -euo pipefail
ACTION=${1:-up}
COMPOSE_FILE="docker-compose.agent.yml"
REPO_ROOT="$(dirname "$0")/../../.."

case "$ACTION" in
  up)     docker compose -f "$REPO_ROOT/$COMPOSE_FILE" up -d --wait ;;
  down)   docker compose -f "$REPO_ROOT/$COMPOSE_FILE" down ;;
  status) docker compose -f "$REPO_ROOT/$COMPOSE_FILE" ps ;;
  *)      echo "Usage: docker.sh [up|down|status]" && exit 1 ;;
esac
