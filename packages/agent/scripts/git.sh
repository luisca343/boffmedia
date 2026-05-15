#!/usr/bin/env bash
set -euo pipefail
ACTION=${1}

case "$ACTION" in
  branch)
    git checkout -b "agent/${2}"
    echo "Created branch: agent/${2}"
    ;;
  commit)
    git add -A
    git commit -m "${2}"
    ;;
  reset)
    git checkout -- .
    git clean -fd
    ;;
  current)
    git branch --show-current
    ;;
  *)
    echo "Usage: git.sh [branch <name>|commit <msg>|reset|current]" && exit 1 ;;
esac
