#!/usr/bin/env bash
set -euo pipefail

# Generate a per-file cloc report and produce a CSV sorted by code (largest first).
# Requires: cloc, jq

OUTDIR=${1:-output}
EXCLUDE_LANG="JSON,HTML,CSS,SCSS,Sass,Markdown,SVG,XML,YAML,TOML,CSV,Text,Properties"
NOT_MATCH_DIR='(^|[\\/])\.next([\\/]|$)|(^|[\\/])node_modules([\\/]|$)|(^|[\\/])src[\\/]ckeditor5([\\/]|$)|(^|[\\/])src[\\/]generated([\\/]|$)|(^|[\\/])tests-examples([\\/]|$)'
NOT_MATCH='(battle_animations\\.ts|battle-animations-moves\\.ts)$|(^|[\\/])src[\\/]app[\\/]battlesim[\\/]mods[\\/]teras[\\/]pokedex\\.ts$'

mkdir -p "$OUTDIR"

BYFILE_JSON="$OUTDIR/cloc-by-file.json"
SORTED_CSV="$OUTDIR/cloc-files-sorted.csv"
SORTED_TXT="$OUTDIR/cloc-files-sorted.txt"

echo "Running cloc (by-file, json) ..."
cloc . --by-file --json --report-file="$BYFILE_JSON" \
  --exclude-lang="$EXCLUDE_LANG" \
  --fullpath \
  --not-match-d="$NOT_MATCH_DIR" \
  --not-match-f="$NOT_MATCH"

if ! command -v jq >/dev/null 2>&1; then
  echo "jq not found — skipping CSV generation. Install jq to get sorted CSV output." >&2
  exit 0
fi

echo "Generating sorted CSV and human-readable TXT"
# Build CSV header and sorted rows using jq. Columns: file,language,code,blank,comment
jq -r '
  to_entries
  | map(select(.key != "header" and .key != "SUM"))
  | map({file: .key, language: .value.language, code: (.value.code // 0), blank: (.value.blank // 0), comment: (.value.comment // 0)})
  | sort_by(-.code)
  | ( ["file","language","code","blank","comment"] | @csv ), ( .[] | [.file, .language, .code, .blank, .comment] | @csv )
' "$BYFILE_JSON" > "$SORTED_CSV"

# Create a nicer TXT (pipe-separated) preview
{
  echo "Top files by lines of code";
  echo "(code | language | file)";
  nl -ba -w1 -s": " < /dev/null >/dev/null 2>&1 || true
  awk -F"," 'NR>1 { gsub(/^"|"$/, "", $1); gsub(/^"|"$/, "", $2); gsub(/^"|"$/, "", $3); gsub(/^"|"$/, "", $4); gsub(/^"|"$/, "", $5); printf "%10s | %s | %s\n", $3, $2, $1 }' "$SORTED_CSV" | sed -n '1,200p'
} > "$SORTED_TXT"

echo "Wrote: $BYFILE_JSON, $SORTED_CSV, $SORTED_TXT"
