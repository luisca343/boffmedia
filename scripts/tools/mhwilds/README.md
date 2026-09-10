# Monster Hunter Wilds tool

This folder documents the local game-asset pipeline used by the MH Wilds
bestiary. The extraction, decoding, normalization and asset-build scripts all
live together in `scripts/tools/mhwilds/`; the root package commands are just
short entry points into this folder.

## What the pipeline produces

The pipeline reads a local Steam installation and writes three layers:

1. `laboon/tool-sources/mhwilds/extracted/bestiary/`
   - Complete ignored extraction workspace.
   - Raw `.tex.241106027`, `.user.3`, `.msg.23`, `.pfb.18` files.
   - Converted PNGs, `index.json`, and normalized `bestiary-data.json`.
2. `public/boffmedia/tools/mhwilds/bestiary/`
   - Runtime tree served by the web app and consumed by the desktop asset
     protocol.
   - Contains only normalized/provenance JSON and PNGs needed by the bestiary.
   - The version manifest is at `public/boffmedia/tools/mhwilds/manifest.json`.
3. `laboon/tool-sources/mhwilds/mhdb-wilds-data/`
   - Ignored local RE_RSZ-compatible decoder checkout, copied inputs, and
     temporary decoded JSON.

The application joins the API's localized monster records with the local game
data using the game's `fixedId`. This gives the bestiary the existing API
features (weaknesses, locations, rewards) plus the extracted icon, anatomy
diagram, part hitzones, break stages, break metadata, and game-owned elemental
weakness flags.

## Initial setup

The following local prerequisites are already prepared on the development
machine. They are intentionally ignored and must not be committed:

- Steam game: `C:\Program Files (x86)\Steam\steamapps\common\MonsterHunterWilds`
- File list: `laboon/tool-sources/mhwilds/filelists/MHWs_STM_Release.list`
- REToolCustom: `laboon/tool-sources/mhwilds/extractor/REToolCustom-1.0/REtool.exe`
- DirectXTex: `laboon/tool-sources/mhwilds/converter/texconv.exe`
- Python 3: used by `scripts/tools/mhwilds/decode-item-thumbnails.py` for the
  game's DirectStorage GDeflate item thumbnails
- Decoder checkout: `laboon/tool-sources/mhwilds/mhdb-wilds-data`
- Decoder layout: `laboon/tool-sources/mhwilds/mhdb-wilds-data/rszmhwilds.json`
- Built parser: `tools/extractor/target/release/extractor.exe` inside the
  decoder checkout.

If the game is installed elsewhere, pass `--game` to the extraction command.
If the decoder is rebuilt or moved, pass `--decoder` to the decode command.

## Update workflow

Run the canonical update command from the repository root after a game patch
or after refreshing the file list:

```powershell
pnpm.cmd update:mhwilds-bestiary
pnpm.cmd pack:tool-assets mhwilds
```

The update command extracts the relevant game files, converts the game icons and
anatomy textures to PNG, decodes the structured game data, regenerates
`bestiary-data.json`, builds the runtime tree, and prints a `NEW additions`
summary. The final command creates the optional versioned desktop pack. The web
app only needs the runtime tree; use the pack command when publishing or
updating the offline desktop pack.

The updater snapshots the previous normalized catalog before `--clean` and
reports new game monster IDs, variants, and asset links. It audits every
variant with a decoded Hunter's Manual report, rather than maintaining a list
of DLC names. A `MISSING` line is a failed content update, not a cosmetic
warning.

### Update and DLC monster visuals

The upstream `MHWs_STM_Release.list` is a useful baseline, but it can lag
behind the PAKs installed by Steam. The canonical updater handles that in two
passes:

1. Ask RETool to inspect every current patch PAK for the stable `_00`
   `tex_emanatomy`/`tex_emicon` path family across the full `em0000`–`em9999`
   range. This discovers a newly shipped DLC ID even if the upstream list does
   not know it yet, then extracts and decodes the shared game tables.
2. Use the decoded report IDs to run a focused scan over every visual filename
   shape known by the release list, then extract/decode those additional
   variants before building the runtime tree. The updater carries the paths
   found by the broad scan into this pass, so a visual discovered before its
   report data is decoded is retained in the final index as well.

This is why no monster-specific exception is needed for DLC. The current
installation, for example, stores the real manual pages for Lagiacrus and
Seregios in `re_chunk_000.pak.sub_000.pak.patch_006.pak`, Gogmazios in
`...patch_012.pak`, and Omega Planetes in `...patch_010.pak`. Mizutsune's page
is also part of the same extracted manual set. The exact paths are recorded in
the ignored `index.json`/`manifest.json` provenance files after extraction.

Run the normal command after a game patch or DLC release:

```powershell
pnpm.cmd update:mhwilds-bestiary
pnpm.cmd pack:tool-assets mhwilds
```

The extractor's standalone mode also performs visual discovery. Use
`--monster emNNNN` for a focused scan, or `--discover-id emNNNN` to limit only
the PAK discovery while retaining the normal selection. `--no-discover` is
intended only for debugging or when a compatible RETool listing executable is
not available; the updater's final roster audit will report any missing manual
asset.

The broad scan is intentionally ID-agnostic; do not add a new monster ID to
the extractor or app. The app joins local assets to API monsters through
`fixedId` -> `gameId`, and the updater audits the icon, manual page, and fixed
ID for every decoded report variant. If a future game changes the visual
filename shape itself, pass the exact archive path from RETool with `--path`
for an immediate recovery, then extend the discovery template family in
`extract-mhwilds-assets.mjs`.

The app joins local assets to API monsters through `fixedId` → `gameId`. If
the icon is present locally but still does not appear, check that those IDs
match and that the API has a record for the new monster. The local extraction
and public asset trees are git-ignored, so the full workflow must be rerun on
any machine or deployment that serves the bestiary.

### Weakness maps and future DLC

Elemental weaknesses come from the game table
`EnemyWeakAttrData.user.3`. The decoder writes it to
`output/user/monsters/EnemyWeakAttrData.json`; the normalizer joins its
`_EnumValue` to `EmID._FixedID`, then stores the result in
`variant.report.elementalWeaknesses`. This is an ID-based join, not a list of
monster names, so a newly added monster is picked up automatically when the
updated game table and its `EmID` record are extracted.

The API remains authoritative when it already provides the same weakness row.
The local game row fills missing rows, which covers newly released monsters
before the API dataset has caught up. If the game has no static elemental flag,
the normalizer also decodes `EnemyReportBossData._RecoAttributeBit` into
`variant.report.recommendedElements` and the app uses it only when no
elemental weakness exists. For example, Gogmazios' report bitmask `34` becomes
Fire + Dragon, preserving the game's contextual recommendation without a
Gogmazios-specific branch.

When a future patch or DLC adds a monster, use the complete update workflow
above and verify the normalized output with this check:

```powershell
$data = Get-Content -Raw .\\laboon\\tool-sources\\mhwilds\\extracted\\bestiary\\bestiary-data.json | ConvertFrom-Json
$data.monsters | ForEach-Object { $_.variants } | Where-Object { $_.report.elementalWeaknesses.Count -gt 0 -or $_.report.recommendedElements.Count -gt 0 } | Measure-Object
```

Do not add a new monster ID to the app for a weakness update. If the count or
the new monster is missing, check that the extractor selected
`natives/stm/gamedesign/enemy/commondata/data/enemyweakattrdata.user.3`, that
the decoder config still includes `Enemy/CommonData/Data/EnemyWeakAttrData.user.3`,
and that the monster's `EmID._FixedID` matches its report row. The same
fixed-ID rule should be used for future weakness-related tables instead of
adding per-DLC exceptions.

For a different Steam location:

```powershell
pnpm.cmd extract:mhwilds-assets -- --game "D:\Games\Monster Hunter Wilds" --convert --clean
pnpm.cmd decode:mhwilds-bestiary
pnpm.cmd build:mhwilds-assets -- --clean
pnpm.cmd pack:tool-assets mhwilds
```

Use `--monster em0001` only for a focused inspection. It limits the normalized
JSON output, so always run the full workflow afterwards to restore the complete
bestiary dataset.

## Runtime paths

The package builds root-relative paths through its asset helper:

```text
/boffmedia/tools/mhwilds/bestiary/bestiary-data.json
/boffmedia/tools/mhwilds/bestiary/natives/.../tex_emicon_*.png
/boffmedia/tools/mhwilds/bestiary/natives/.../tex_emanatomy_*.png
/boffmedia/tools/mhwilds/bestiary/item-icons/<kind>-<color>.svg
```

The game supplies two relevant bestiary visuals. `tex_emicon` is the coloured
monster illustration used for list/header identity. `tex_emanatomy` is the
actual Hunter's Manual anatomical page used by the placing tool. The old
`tex_emsketch` family is deliberately excluded from extraction and publication;
it is not a valid replacement for the in-game manual page.
The game does not provide a separate raster image for each named part; the
part names, break targets and hitzones come from the report and monster data,
while the anatomy texture supplies the visual reference.

The anatomy report assigns each visible part to one of ten fixed edge slots and
carries `ArrowSize` plus `ArrowRot`. The game does not serialize a literal
`targetX`/`targetY`; it projects that vector onto the report board. The
normalizer reproduces that projection for every slot and checks the endpoint
against the alpha channel of that monster's extracted `tex_emanatomy` PNG,
moving it onto the illustrated part when the authored endpoint falls in
transparent margin. The resulting `callout.anchor` and `callout.target` are
stored in `bestiary-data.json`; the app only has the same deterministic vector
fallback for older packs. The generated pack contains no hardcoded
monster-ID coordinate overrides. Admin corrections are stored separately by
the game's `fixedId` plus `variantId`, then applied at runtime, so regenerating
the pack never erases a manual correction and localized names cannot break it.

The admin editor is available at `/admin` under `MH Wilds anatomy` for users
with the Boffmedia admin role. It shows the actual extracted
`tex_emanatomy` Hunter's Manual page, lets an administrator drag each numbered
callout target or enter its normalized X/Y values, and saves the result to the API. `Restore`
deletes the override and returns that monster to generated coordinates. The
editor's monster list is limited to variants with a decoded anatomy report,
which is the game's large-monster signal; it is not a hardcoded ID list, so
future large monsters and DLC remain eligible automatically. Rows use the
extracted `tex_emicon` art for identification and show whether the anatomy
page is available.
public bestiary reads `GET /tools/mhwilds/anatomy-overrides`; the editor writes
through the protected admin PATCH/DELETE routes. These rows are keyed by game
identity rather than a display name and survive future extraction/DLC updates.

The editor's storage table is included in the generated Drizzle migration. On
an environment that has not received it yet, apply the normal API migration
before using `Save`:

```powershell
pnpm.cmd --filter api migrate
```

Do not put saved coordinates in the generated JSON or in a monster-specific
source-code branch. The JSON is the reproducible game-data baseline; the
database is the durable editorial layer.

After an update, inspect the normalizer summary for
`anatomy-callouts=<number> missing=0 anatomy-unknown-slots=0`, and confirm that
`anatomy-alpha-images` covers every variant whose anatomy panel is rendered.
A non-zero `missing` value means a report row has a new/invalid arrow field; a
non-zero `unknown-slots` value means a game update changed the report schema;
an `anatomy-alpha-images` shortfall means the anatomy PNG was not extracted.
Fix the extraction/decoder input and extend the shared slot table before adding
any app-side coordinates.

For the current installation, a successful full refresh should report
`anatomy-alpha-images=34 missing=0` and the updater should finish with
`Hunter's Manual audit: ... missing=0`. The exact count can increase with DLC;
the invariant is that every variant with `report.anatomyLayout` has both a PNG
icon and the real `tex_emanatomy` page. Never manufacture a sketch or fallback
coordinate page when that invariant fails.

The item thumbnail family under `tex_thumbnail/item` is not a material-icon
family. It contains equipment/weapon renders. In the game's item data,
`icon.id` is an enum (`47` means the Tail icon kind), not the `0047` part of a
texture filename. The extractor keeps this family under `itemThumbnails` for
audits and future gear UI, but the bestiary must not use it for reward rows.

The current Wilds file list does not expose a standalone raster atlas for the
generic material glyphs. The app therefore uses the game's semantic
`item.icon.kind` and `item.icon.color`, mapped to the generic fifth-generation
glyph set in `item-icons/`. Those SVGs are a documented CC BY-SA fallback from
the community `zukan-assets` project; they are not presented as Capcom game
assets. Run the sync command once when setting up the workspace:

```powershell
pnpm.cmd sync:mhwilds-item-icons
```

When updating the game assets, keep `--convert` enabled so the `.tex` source
becomes a browser-friendly PNG, refresh the semantic item glyphs if needed,
then rebuild the publishable tree:

```powershell
pnpm.cmd extract:mhwilds-assets -- --convert
pnpm.cmd sync:mhwilds-item-icons
pnpm.cmd build:mhwilds-assets -- --clean
```

The web host serves these from `public/`. The desktop host resolves the same
paths through `boffasset://`; when a versioned MH Wilds pack is published, the
desktop launcher can install it in the background and remain usable offline.

## Safety and provenance

The Steam installation is read-only to these scripts. The scripts write only
inside the ignored `laboon/` workspace and the generated public asset tree.
Do not commit raw game files, decoder binaries, or generated public assets
without an explicit distribution/legal decision.
