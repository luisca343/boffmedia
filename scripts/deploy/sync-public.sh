#!/usr/bin/env bash
#
# sync-public.sh — publish one tool's built asset tree + pack to the host.
#
# Runs on a workstation and ssh's out (unlike deploy.sh, which runs ON the
# host). Ordering is the whole point: the loose tree first, then the pack
# zip, then packs/index.json LAST — a client must never be able to read an
# index that names a zip which is not there yet.
#
#     BOFF_DEPLOY_HOST=you@host scripts/deploy/sync-public.sh mewgenics
#     BOFF_DEPLOY_HOST=you@host scripts/deploy/sync-public.sh mewgenics --dry-run
#     BOFF_DEPLOY_HOST=you@host scripts/deploy/sync-public.sh mewgenics --no-build
#
# Env:
#   BOFF_DEPLOY_HOST   required, user@host for ssh/rsync
#   BOFF_PUBLIC_ROOT    default /mnt/public — the only public root on the
#                        host (host_facts: /srv/boffmedia/public does not
#                        exist there)
#
# Options:
#   --dry-run    pass -n to every rsync and print the plan; nothing is sent
#   --no-build   skip the build + pack step; sync whatever is already at
#                public/boffmedia/tools/<tool>/ and public/boffmedia/tools/packs/
#
# Never touches a tool other than the one named on the command line: --delete
# is scoped to $ROOT/boffmedia/tools/<tool>/, and the pack zip rsync targets
# only $ROOT/boffmedia/tools/packs/<tool>-<version>.zip.
#
set -euo pipefail

TOOL="${1:?usage: sync-public.sh <tool> [--dry-run] [--no-build]}"
shift || true

DRY_RUN=0
NO_BUILD=0
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    --no-build) NO_BUILD=1 ;;
    *)
      echo "[sync-public] unknown argument: $arg" >&2
      exit 2
      ;;
  esac
done

HOST="${BOFF_DEPLOY_HOST:?BOFF_DEPLOY_HOST is required (user@host) — refusing to run without a target}"
ROOT="${BOFF_PUBLIC_ROOT:-/mnt/public}"

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$REPO_ROOT"

SRC_TREE="laboon/tool-sources/$TOOL"
BUILT_TREE="public/boffmedia/tools/$TOOL"
PACKS_DIR="public/boffmedia/tools/packs"
BUILD_SCRIPT="scripts/tools/build-${TOOL}-assets.mjs"
PACK_SCRIPT="scripts/tools/pack-tool-assets.mjs"

RSYNC_FLAGS=(-av)
if [ "$DRY_RUN" -eq 1 ]; then
  RSYNC_FLAGS+=(-n)
  echo "[sync-public] --dry-run: no rsync will actually transfer anything"
fi

if [ "$NO_BUILD" -eq 0 ]; then
  if [ ! -f "$BUILD_SCRIPT" ]; then
    echo "[sync-public] refusing: no build script at $BUILD_SCRIPT — pass --no-build if $TOOL is already built" >&2
    exit 1
  fi
  if [ ! -d "$SRC_TREE" ]; then
    echo "[sync-public] refusing: source tree not found: $SRC_TREE (a build was requested)" >&2
    exit 1
  fi
  echo "[sync-public] build: node $BUILD_SCRIPT"
  node "$BUILD_SCRIPT"
  echo "[sync-public] pack: node $PACK_SCRIPT $TOOL"
  node "$PACK_SCRIPT" "$TOOL"
fi

if [ ! -d "$BUILT_TREE" ] || [ -z "$(find "$BUILT_TREE" -type f -print -quit)" ]; then
  echo "[sync-public] refusing: built tree is empty or missing: $BUILT_TREE" >&2
  exit 1
fi

INDEX_PATH="$PACKS_DIR/index.json"
if [ ! -f "$INDEX_PATH" ]; then
  echo "[sync-public] refusing: $INDEX_PATH not found — run without --no-build, or pack the tool first" >&2
  exit 1
fi

ZIP_NAME="$(node -e '
  const fs = require("node:fs")
  const idx = JSON.parse(fs.readFileSync(process.argv[1], "utf8"))
  const entry = (idx.packs || []).find((p) => p.tool === process.argv[2])
  if (!entry) { console.error("no index.json entry for tool " + process.argv[2]); process.exit(1) }
  console.log(entry.url.split("/").pop())
' "$INDEX_PATH" "$TOOL")"
ZIP_PATH="$PACKS_DIR/$ZIP_NAME"

if [ ! -f "$ZIP_PATH" ]; then
  echo "[sync-public] refusing: $ZIP_PATH (named by index.json) does not exist locally" >&2
  exit 1
fi

echo "[sync-public] tool=$TOOL host=$HOST root=$ROOT zip=$ZIP_NAME"

# 1) loose tree — the website reads these paths directly. packs/ and the
#    gitignored build stamp are excluded even though neither lives under
#    $BUILT_TREE today, as a guard against a future tool nesting one.
rsync "${RSYNC_FLAGS[@]}" --delete \
  --exclude 'packs/' \
  --exclude '.build-stamp.toon' \
  "$BUILT_TREE/" "$HOST:$ROOT/boffmedia/tools/$TOOL/"

# 2) the pack zip — never --delete here, other tools' packs must survive.
rsync "${RSYNC_FLAGS[@]}" \
  "$ZIP_PATH" "$HOST:$ROOT/boffmedia/tools/packs/$ZIP_NAME"

# 3) index.json LAST — only after the zip it names is confirmed in place, so
#    a client can never read an index pointing at a missing zip.
rsync "${RSYNC_FLAGS[@]}" \
  "$INDEX_PATH" "$HOST:$ROOT/boffmedia/tools/packs/index.json"

if [ "$DRY_RUN" -eq 1 ]; then
  echo "[sync-public] dry run complete — nothing was transferred"
else
  echo "[sync-public] done: $TOOL synced to $HOST:$ROOT/boffmedia/tools/{$TOOL,packs}"
fi
