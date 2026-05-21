param(
  [string]$OutDir = "output"
)

$excludeLang = "JSON,HTML,CSS,SCSS,Sass,Markdown,SVG,XML,YAML,TOML,CSV,Text,Properties"
$excludeDir = "node_modules,.next,src/ckeditor5"
$notMatch = '(battle_animations\.ts|battle-animations-moves\.ts)$|(^|[\\/])src[\\/]app[\\/]battlesim[\\/]mods[\\/]teras[\\/]pokedex\.ts$'
# cloc on Windows requires --fullpath with a directory regex instead of path list
$notMatchDir = '(^|[\\/])\.next([\\/]|$)|(^|[\\/])node_modules([\\/]|$)|(^|[\\/])src[\\/]ckeditor5([\\/]|$)|(^|[\\/])src[\\/]generated([\\/]|$)|(^|[\\/])tests-examples([\\/]|$)'

if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir | Out-Null }

cloc . --json --report-file="$OutDir\cloc-output.json" --exclude-lang=$excludeLang --fullpath --not-match-d=$notMatchDir --not-match-f=$notMatch
