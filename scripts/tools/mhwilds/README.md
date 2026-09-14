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
   - The sibling `en/` and `es/` catalog files are the runtime source for the
     weapon, armor, charm, decoration, and skill screens. The weapon tree is
     derived at runtime from the localized weapon catalog; stale checked-out
     `weapon-tree*.json` snapshots are not used or packed.
3. `laboon/tool-sources/mhwilds/mhdb-wilds-data/`
   - Ignored local RE_RSZ-compatible decoder checkout, copied inputs, and
     temporary decoded JSON.

Catalog screens read their localized records from the generated local pack, so
they do not need the MHDB API. The bestiary still joins the API's localized
monster records with local game data using the game's `fixedId`. This gives the
bestiary the existing API features (weaknesses, locations, rewards) plus the
extracted icon, anatomy diagram, part hitzones, break stages, break metadata,
and game-owned elemental weakness flags.

The ignored extraction workspace preserves the game's native archive paths for
RETool and the decoder. The publishable runtime tree renames monster visuals to
readable paths based on their English game names, for example
`bestiary/monsters/rathian/icon.png` and `bestiary/monsters/rathian/anatomy.png`.
Repeated names receive deterministic `-variant-##` suffixes; stable game ids
remain the only identity keys.

Artian and Gogmazios/Onyx weapons are standalone forge records in the game:
they are not present in a weapon `Tree` row, so the decoder correctly emits no
series, parent, or branches for them. The client treats records without an
in-catalog previous weapon as roots, which keeps these isolated weapons in the
weapon-tree view instead of inventing a progression link that the game does
not have.

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

The parser must be built with `rsz` **0.2.2 or newer**. Version 0.2.1 has an
interned-string reader bug that truncates `PlayerArmorList` and silently loses
armor package rows. In the decoder checkout, update the dependency and rebuild
the extractor before decoding:

```powershell
cargo update -p rsz --precise 0.2.2
cargo build --release --bin extractor
```

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

1. Ask RETool to inspect every usable installed PAK for the stable `_00`
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

### Element and ailment presentation resources

The extractor also selects the game's shared attribute/status resources:
`EnemyReportWeaponAttributeData.user.3`, `StatusUIData.user.3`, the attribute
and status message tables, `ift_iconfont_00.ift.7`, the keyboard/controller
iconfont textures, and `uvs_iconfont.uvs.8.x64`. They are recorded under
`index.json.attributeResources` (and `sharedData`) and decoded under
`output/user/attributes/` when the local decoder supports the corresponding
table.

Wilds does not expose one standalone PNG per element or ailment. The in-game
glyphs are entries in the shared icon font/atlas, while the attribute table
only supplies ids and message references. The extractor keeps the font's
`ift_iconfont_00`/`uvs_iconfont` mapping and the referenced
`tex000201_2_imlm4` texture (the report `tex000201_20_imlm4` atlas is retained
separately for its other UI consumers). The asset builder crops the glyphs by
the game's own names and UV order into `bestiary/attributes/`, including
`fire`, `water`, `thunder`, `ice`, `dragon`, `poison`, `paralysis`, `stun`,
`sleep`, and `blast`; blight names resolve to the matching base files rather
than duplicating identical PNGs. The game has no `ST_EXHAUST` glyph in this
font, so Exhaust deliberately falls back instead of being assigned unrelated
artwork. `MhAttributeIcon` loads those original game glyphs everywhere and
falls back to the host-neutral icon only when the local runtime pack has not
been rebuilt.
`MH_ATTRIBUTE_DEFINITIONS` remains the canonical semantic/color source, so
pages and style-guide specimens cannot drift apart.

For a different Steam location:

```powershell
pnpm.cmd extract:mhwilds-assets -- --game "D:\Games\Monster Hunter Wilds" --convert --clean
pnpm.cmd decode:mhwilds-bestiary
pnpm.cmd sync:mhwilds-armor-identities
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
/boffmedia/tools/mhwilds/bestiary/monsters/<monster-slug>/icon.png
/boffmedia/tools/mhwilds/bestiary/monsters/<monster-slug>/anatomy.png
/boffmedia/tools/mhwilds/bestiary/item-icons/<kind>-<color>.svg
/boffmedia/tools/mhwilds/bestiary/gear/weapons/<kind>/<weapon-slug>.png
/boffmedia/tools/mhwilds/bestiary/gear/armor/<armor-set-slug>/<slot>.png
/boffmedia/tools/mhwilds/bestiary/gear/armor/<armor-set-slug>/preview.png
/boffmedia/tools/mhwilds/bestiary/gear/manifest.json
```

Armor and weapon filenames are deterministic English canonical-name slugs:
lowercase kebab-case, accents removed, and `α`/`β`/`γ` written as
`alpha`/`beta`/`gamma`. Duplicate weapon names receive a `-variant-01`
suffix. The manifest still joins every asset by stable game id; paths are
presentation names and must never be used as data identity keys. The published
gear PNGs retain the game's foreground alpha mask, which removes the UI
backdrop while preserving the equipment cutout. During publication, the
builder re-encodes them as RGBA PNGs without the DirectXTex `gAMA=100000`
metadata found in the game files. Chromium interprets that invalid gamma value
as a very bright image when transparency is present, which is why a direct
copy looks washed out in the browser. Do not flatten these images: the browser
must composite them over the tool's image well so the gray game thumbnail
backdrop is not baked into the published asset.

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
texture filename. The extractor keeps the complete family under
`itemThumbnails` for audits and publishes only catalogued weapon renders under
`bestiary/gear/weapons/<kind>/<weapon-slug>.png`. Uncatalogued auxiliary
rasters stay in the ignored extraction workspace rather than becoming random
public filenames. The stable `kind` + `gameId` mapping is recorded in
`gear/manifest.json`, alongside the readable path. If the installed game has no
distinct raster for a title-update variant, the manifest records the real
neighboring/predecessor render used for that variant; the UI never needs to
know about the archive filename. These thumbnails are used for weapon
identity, never as material icons in reward rows.

Drop and crafting items use a separate generated catalogue at
`bestiary/items/manifest.json`. It is keyed by the stable `Item.json`
`game_id`, and each entry receives a readable English slug for diagnostics and
future item-specific artwork. The current asset points at the shared semantic
glyph under `item-icons/` instead of copying the same SVG into every item
directory. The manifest records `assetSource: semantic-glyph` so a later
game-owned or curated per-item raster can replace that entry without changing
the drop, crafting, or decoration consumers. The complete item catalogue is
published rather than only current monster rewards because the same items are
reused across those features.

Weapon classification uses the complete `tex_it####` stem, not only the
archive folder: `it10` also contains the `tex_it1003` kinsect family beside
`tex_it1000` insect glaives. The builder asserts that no two source files can
write the same runtime path, so auxiliary item atlases cannot overwrite a
weapon render.

The current Wilds file list exposes paired GDeflate-wrapped `character/ch02`
and `character/ch03` thumbnail families for armor previews. The decoder also
reads `ArmorSeriesData` and every `PlayerArmorList` catalog package (including
title-update catalogs such as `02_00`, `03_00`, `04_00`, and later revisions such
as `04_10`). The extractor probes that catalog naming space across every
installed PAK, so a lagging release list cannot omit a newly shipped table. The latter
is the authoritative model/slot join: a filename that happens to share a model
number is never assigned to a different armor slot. In a path such as
`tex_ch02_00_028_1_0_imlm4`, the first numeric component after the model id is
the visual style (`0` base, `1` alternate, `2` gamma when shipped), while the
final component is the thumbnail slot (`0` head, `1` chest, `2` arms, `3`
waist, `4` legs). Package sub-ids such as `300`/`500` are normalized to the
same visual style before the join.

`ArmorSeriesData._ModId` is the wearable prefab/package model, not the
character thumbnail model. Those ids live in separate game namespaces. The
checked-in `armor-thumbnail-map.json` is the explicit
`ArmorSeriesData._Index -> tex_ch02/ch03 model` crosswalk used by the builder;
there is deliberately no arithmetic fallback. If a new series is absent from
that table, the build leaves it unavailable and reports
`no-thumbnail-crosswalk` instead of borrowing a neighboring set's raster.

Special/collaboration armor can use a second visual namespace. The extractor
keeps `PlayerArmorVisualSetting*.user.3` and the decoder writes the decoded
tables under `output/user/gear/visual/`; the builder applies the reviewed
`armor-visual-overrides.json` table only for those explicit joins. For example,
ArmorID `70` (Akuma) is rendered from thumbnail model `207` via visual parts
`151`, while its catalog/model identity remains `70`. The generated manifest
records both ids and the visual-setting provenance, so a numeric collision can
never silently select another armor set.

The catalog's `armorSet.id` is a mutable catalog id; `armorSet.gameId` is the
stable identifier from the game files and is the only id used for long-lived
asset joins. The local `armor-sets.json` crosswalk supplies that game id before
the web client resolves `gear/armor/<armor-set-slug>/<slot>.png`; the generated
manifest retains the catalog id only as `apiSetId` for diagnostics. A client
with only the mutable id fails closed and renders the semantic slot fallback
instead of probing another set's URL.

The game does not ship a raster for every named piece. When its thumbnail table
has no matching family/model/style/slot, the builder leaves that slot absent in
`gear/manifest.json` rather than displaying a valid image from the wrong slot.
The numeric suffix is only interpreted for the standard armor namespace;
special namespaces must have an explicit package/visual join. The manifest
records `unavailableReason`, including `no-thumbnail-crosswalk`,
`no-extracted-thumbnail`, and `thumbnail-package-slot-mismatch`, so missing
source data is distinguishable from a rejected semantic join.
The web tool falls back to the category glyph in that case, so entries such as
the Alloy and Artian helmets remain searchable and usable without a broken
image. `availableSlots`, `missingSlots`, `packageSlots`, and `visualJoin` make
the distinction auditable after every update. Other character-thumbnail
families are not armor previews and are intentionally excluded; full 3D
extraction/rendering is outside this phase.

The current Wilds file list does not expose a standalone raster atlas for the
generic material glyphs. The app therefore uses the game's semantic
`item.icon.kind` and `item.icon.color`, mapped to the generic fifth-generation
glyph set in `item-icons/`. Those SVGs are a documented CC BY-SA fallback from
the community `zukan-assets` project; they are not presented as Capcom game
assets. Generic `skull`, `question`, and `unknown` enum values are intentionally
mapped to the colored `monster-part` family because the glyph source has no
dedicated files for them. Tool-specific enum values without a source glyph
(`ammo-*`, `capture-net`, cooking ingredients, and similar) are mapped to the
closest complete 19-colour family, so every catalog item still has a colored
fallback. Run the sync command once when setting up the workspace:

```powershell
pnpm.cmd sync:mhwilds-item-icons
```

The sync step audits every distinct raw `Item.json` icon/colour reference
after applying the same aliases used by the web resolver. It fails before
downloading if a new game enum has no complete coloured glyph mapping, so a
title update cannot quietly introduce broken reward icons.

When updating the game assets, keep `--convert` enabled so the `.tex` source
becomes a browser-friendly PNG, refresh the semantic item glyphs if needed,
then rebuild the publishable tree:

```powershell
pnpm.cmd extract:mhwilds-assets -- --convert
pnpm.cmd sync:mhwilds-item-icons
pnpm.cmd sync:mhwilds-armor-identities
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
