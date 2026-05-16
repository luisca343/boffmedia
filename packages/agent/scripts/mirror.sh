#!/usr/bin/env bash
set -euo pipefail

BRANCH=${1:?Usage: mirror.sh <branch>}

# Push to GitLab (primary)
git push gitlab "$BRANCH"

# Push to GitHub (mirror) — non-fatal if it fails
git push github "$BRANCH" || echo "⚠ GitHub mirror push failed — continuing"
