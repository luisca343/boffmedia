param(
  [string]$OutDir = "output"
)

$excludeLang = "JSON,HTML,CSS,SCSS,Sass,Markdown,SVG,XML,YAML,TOML,CSV,Text,Properties"
$notMatchDir = '(^|[\\/])\.next([\\/]|$)|(^|[\\/])node_modules([\\/]|$)|(^|[\\/])src[\\/]ckeditor5([\\/]|$)|(^|[\\/])src[\\/]generated([\\/]|$)|(^|[\\/])tests-examples([\\/]|$)'
$notMatch = '(battle_animations\.ts|battle-animations-moves\.ts)$|(^|[\\/])src[\\/]app[\\/]battlesim[\\/]mods[\\/]teras[\\/]pokedex\.ts$'

if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir | Out-Null }

$byfile = Join-Path $OutDir "cloc-by-file.json"
$csvOut = Join-Path $OutDir "cloc-files-sorted.csv"
$txtOut = Join-Path $OutDir "cloc-files-sorted.txt"

Write-Host "Running cloc (by-file, json) ..."
cloc . --by-file --json --report-file "$byfile" --exclude-lang $excludeLang --fullpath --not-match-d $notMatchDir --not-match-f $notMatch

# Parse cloc output JSON and produce CSV + preview
try {
  $raw = Get-Content -Raw -Path $byfile
  $obj = $raw | ConvertFrom-Json
} catch {
  Write-Error "Failed to read or parse $byfile : $_"
  exit 1
}

$list = @()
foreach ($p in $obj.PSObject.Properties) {
  if ($p.Name -in @('header','SUM')) { continue }
  $v = $p.Value
  $list += [PSCustomObject]@{
    file = $p.Name
    language = $v.language
    code = [int]($v.code -as [int])
    blank = [int]($v.blank -as [int])
    comment = [int]($v.comment -as [int])
  }
}

$sorted = $list | Sort-Object -Property code -Descending
$sorted | Export-Csv -Path $csvOut -NoTypeInformation

# Create a readable preview
$lines = $sorted | ForEach-Object { ($_.code.ToString().PadLeft(10)) + ' | ' + ($_.language) + ' | ' + ($_.file) }
$header = @("Top files by lines of code","(code | language | file)")
if ($lines.Count -gt 0) {
  $end = [math]::Min(199, $lines.Count - 1)
  $slice = $lines[0..$end]
} else {
  $slice = @()
}
$header + $slice | Out-File -FilePath $txtOut -Encoding utf8

Write-Host "Wrote: $byfile, $csvOut, $txtOut"
