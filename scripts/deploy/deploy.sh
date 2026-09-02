#!/usr/bin/env bash
#
# Recreate a Boffmedia container from an immutable image tag, and roll back if
# the new one does not come up healthy.
#
# Install on the production host as /opt/scripts/deploy.sh (chmod +x). The
# deploy workflows call it over SSH with the run number as the tag:
#
#     /opt/scripts/deploy.sh api 412
#
# WHY THIS EXISTS RATHER THAN A COMMAND IN THE WORKFLOW
#   The run flags — volumes, env file, ports — are host facts, not repo facts,
#   so they belong here where they can be right. The previous deploy step ran
#   `docker pull … && docker restart <name>`, which cannot work: restart
#   restarts the EXISTING container from its existing image, so a freshly
#   pulled image is never picked up. The container has to be recreated.
#
# WHY IT WAITS FOR HEALTHY
#   Both images declare a HEALTHCHECK. A container whose process died or bound
#   the wrong port still reports "Up", so "docker run succeeded" proves nothing
#   — waiting for the health status is what actually proves the deploy worked.
#
set -euo pipefail

SERVICE="${1:?usage: deploy.sh <api|web> <tag>}"
TAG="${2:?usage: deploy.sh <api|web> <tag>}"

# ─── WEB BINDS CONFIRMED (docker inspect boffmedia-web, 2026-09-02) ─────────
# ─── API BINDS UNCONFIRMED — see the comment above the /srv/boffmedia/public
#     line below before using the api branch ───────────────────────────────
# Print the current flags with:
#   docker inspect boffmedia-server --format '{{json .HostConfig.Binds}} {{json .HostConfig.PortBindings}}'
case "$SERVICE" in
  api)
    NAME="boffmedia-server"
    IMAGE="luisca343/boffmedia-server2"
    RUN_FLAGS=(
      -p 34301:34301
      --env-file /etc/boffmedia/api.env
      # /srv/boffmedia/public does NOT exist on the host (confirmed 2026-09-02).
      # /mnt/public is the only public root that exists (docker inspect boffmedia-web, 2026-09-02).
      # The running boffmedia-server container must therefore carry different,
      # undeclared binds. Do NOT guess a replacement — before using this
      # branch, replace the line below with the output of:
      #   docker inspect boffmedia-server --format '{{json .HostConfig.Binds}}'
      -v /srv/boffmedia/public:/app/public:ro
      -v /srv/boffmedia/uploads:/app/var/uploads
      -v /mnt/laboon:/app/laboon
      -v /etc/boffmedia/boffmedia-b6e4f721c326.json:/app/boffmedia-b6e4f721c326.json:ro
      --restart unless-stopped
    )
    ;;
  web)
    NAME="boffmedia-web"
    IMAGE="luisca343/boffmedia-web2"
    RUN_FLAGS=(
      -p 34333:3000
      -v /mnt/public:/app/apps/web/public
      -v /mnt/public:/app/public
      -v /docker/config/boffmedia/web.env:/app/.env.local
      -v /docker/config/boffmedia/web.env:/app/apps/web/.env.local
      --restart unless-stopped
    )
    ;;
  *)
    echo "unknown service '$SERVICE' (expected api or web)" >&2
    exit 2
    ;;
esac
# ─────────────────────────────────────────────────────────────────────────────

HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-240}"

# The tag currently serving, so a failed deploy has somewhere to go back to.
PREVIOUS_IMAGE="$(docker inspect --format '{{.Config.Image}}' "$NAME" 2>/dev/null || true)"

start_container() {
  local image="$1"
  docker rm -f "$NAME" >/dev/null 2>&1 || true
  docker run -d --name "$NAME" "${RUN_FLAGS[@]}" "$image" >/dev/null
}

# Resolves to healthy/unhealthy for an image that declares a HEALTHCHECK, and to
# "none" for one that does not — in which case fall back to "is it still running",
# because there is nothing better to wait for.
wait_for_health() {
  local deadline=$(( SECONDS + HEALTH_TIMEOUT ))
  while (( SECONDS < deadline )); do
    local status
    status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$NAME" 2>/dev/null || echo missing)"
    case "$status" in
      healthy)   return 0 ;;
      unhealthy) return 1 ;;
      missing)   return 1 ;;
      none)
        [ "$(docker inspect --format '{{.State.Running}}' "$NAME" 2>/dev/null || echo false)" = "true" ] || return 1
        sleep 5
        ;;
      *) sleep 5 ;;
    esac
  done
  return 1
}

echo "[deploy] $SERVICE -> $IMAGE:$TAG  (current: ${PREVIOUS_IMAGE:-none})"
docker pull "$IMAGE:$TAG"
start_container "$IMAGE:$TAG"

if wait_for_health; then
  echo "[deploy] $NAME is healthy on $IMAGE:$TAG"
  exit 0
fi

echo "[deploy] $NAME did not become healthy within ${HEALTH_TIMEOUT}s" >&2
docker logs --tail 50 "$NAME" >&2 || true

if [ -z "$PREVIOUS_IMAGE" ]; then
  echo "[deploy] no previous image recorded — leaving the failed container up for inspection" >&2
  exit 1
fi

echo "[deploy] rolling back to $PREVIOUS_IMAGE" >&2
start_container "$PREVIOUS_IMAGE"
if wait_for_health; then
  echo "[deploy] rolled back to $PREVIOUS_IMAGE" >&2
else
  echo "[deploy] ROLLBACK ALSO UNHEALTHY — $NAME needs manual attention" >&2
fi
exit 1
