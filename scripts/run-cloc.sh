#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/run-cloc.sh [output_dir]
OUTDIR=${1:-output}
EXCLUDE_LANG="JSON,HTML,CSS,SCSS,Sass,Markdown,SVG,XML,YAML,TOML,CSV,Text,Properties"
NOT_MATCH='(battle_animations\.ts|battle-animations-moves\.ts)$|(^|[\\/])src[\\/]app[\\/]battlesim[\\/]mods[\\/]teras[\\/]pokedex\.ts$'
# Use fullpath-based directory exclusion via regex (cloc requires --fullpath with --not-match-d)
NOT_MATCH_DIR='(^|[\\/])\.next([\\/]|$)|(^|[\\/])node_modules([\\/]|$)|(^|[\\/])src[\\/]ckeditor5([\\/]|$)|(^|[\\/])src[\\/]generated([\\/]|$)|(^|[\\/])tests-examples([\\/]|$)'

mkdir -p "$OUTDIR"
cloc . --json --report-file="$OUTDIR/cloc-output.json" \
  --exclude-lang="$EXCLUDE_LANG" \
  --fullpath \
  --not-match-d="$NOT_MATCH_DIR" \
  --not-match-f="$NOT_MATCH"
