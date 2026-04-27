# VGC Meta Analysis — Living Design Document

> **This is a living document.** Any agent working on this feature must:
> - Check off completed items as they are implemented (`- [x]`)
> - Add new questions to the **Open Questions** section whenever a decision is needed
> - Add a dated entry to the **Changelog** when making significant changes or decisions
> - Never delete answered questions — move them to **Answered** with the resolution inline

---

## Changelog

| Date | Author | Change |
|---|---|---|
| 2026-04-26 | Initial analysis | Document created from live data fetches |
| 2026-04-26 | User answers | Q1–Q19 answered; RK9 added; DB/pkmn/sim decisions recorded |
| 2026-04-26 | Architecture deep-dive | OQ1–OQ6 answered; module structure, roles, Champions SP formula documented |
| 2026-04-26 | Phase 0 implemented | Schema, RolesGuard+decorator, vgc/meta/ module scaffolded, parse-paste-meta.ts + StatCalcService written, OQ7–OQ9 resolved |
| 2026-04-26 | Naming refactor | `vgc-meta/` → `vgc/meta/`; schema file `VgcMeta.ts` → `Vgc.ts`; all table names `vgc_meta_*` → `vgc_*`; module registered inside VgcModule instead of AppModule |
| 2026-04-26 | Schema normalization | Replaced `vgcPasteDetails` + scattered paste columns with unified `vgcPastes` table; `pokepaste.repository.ts` → `pastes.repository.ts`; both `vgcPasteTeams` and `vgcLimitlessTeams` now FK into `vgcPastes.id` |
| 2026-04-26 | Phase 1 implemented | `SmogonService` fully implemented: `resolveLatestMonth()`, `getUsageList()`, `getPokemonDetail()`; Dex name resolution for items + abilities; gzip+base64 storage to avoid `max_allowed_packet` on ~9 MB chaos JSON |
| 2026-04-26 | Phase 1 frontend | `/pokemon/vgc/meta` page: format tabs, month + cutoff pickers, usage table (sprite/bar/item/move/tera), click-to-expand detail panel (abilities/items/moves/tera/teammates/spreads + RadarChart); `VgcMetaService` added to `vgcService.ts`; locale keys added (EN + ES) |
| 2026-04-27 | Pikalytics redesign | Full rewrite of meta frontend to Pikalytics-style two-pane persistent dashboard: dynamic routes `/meta/[speciesId]`, URL-persisted format/month/cutoff search params, sticky left sidebar (ranked list + search), right panel grid (Moves/Items/Abilities/Tera/Teammates/Spreads+Radar); FormatBar with options popover; mobile: list-only or detail-only full-screen; `(herramientas)/layout.tsx` updated with `noContainer`/`noMargin` for all `/vgc/meta` routes |
| 2026-04-27 | Sprite standardization | Switched sprite base from `sprites/dex/` to `sprites/home-centered/` (higher-quality HOME renders) in `features/vgc-tracker/types.ts`; substitute fallback kept on `sprites/dex/substitute.png`; added `SPRITE_SLUG_OVERRIDES` map (Urshifu-Rapid-Strike etc.); meta components now import `spriteUrl`/`handleSpriteError` from shared source instead of using inline functions |
| 2026-04-27 | VGC nav section | Added VGC category to `data/games/pokemon.ts` (4 tools: Meta, Speed Tiers, Speed Comparison, Tracker); wired 4 new `react-icons/gi` icons (`GiPodiumWinner`, `GiSpeedometer`, `GiScales`, `GiNotebook`) in `config/gameTools.ts`; added i18n keys to `tools/games.json` (EN + ES); VGC featured landing card enabled |
| 2026-04-27 | FicusNav integration | Added VGC item to `ToolsMenu.tsx` pokemon section (links to `/pokemon/vgc/meta`, `BarChart2` icon); added `nav.menus.tools.sections.pokemon.items.vgc` keys to `locales/en/nav.json` + `locales/es/nav.json`; added `categories.vgc` + `tools.vgc` blocks to `locales/{en,es}/tools/pokemon.json` for the Pokémon landing page card |
| 2026-04-27 | Smogon normalization | Replaced 9 MB chaos JSON blob with per-Pokémon normalized rows (`vgc_smogon_pokemon`); new fetch pipeline uses stats.txt + moveset.txt (~25 KB + ~500 KB); single `GET /smogon` returns full `PokemonUsageDetail[]` — frontend builds `Map<speciesId, detail>` for O(1) lookup; double-fetch eliminated by moving `MetaLayoutClient` to `meta/layout.tsx` |
| 2026-04-27 | Admin dashboard | Rewrote `/admin` as sidebar-nav dashboard (Portal: Games/Events/Teams/Achievements; Herramientas: TCG Pocket, VGC Meta); added `VgcSmogonFetcher` component with snapshot table, import form, and per-row delete (`DELETE /smogon/snapshot`); added loading guard to prevent Unauthorized flash on session init |
| 2026-04-27 | FormatBar & options fixes | FormatBar now driven by `SmogonSnapshot[]` from DB (format pills, month select); cutoff select kept as static list `[1760, 1630, 1500, 0]` so non-imported cutoffs are selectable; Options panel moved to `position:fixed` to escape `overflow-auto` stacking context in `FloatingSection` |
| 2026-04-27 | Detail panel redesign | Added `BaseStatsPanel` (HP/Atk/Def/SpA/SpD/Spe horizontal bars, stat-specific colors, BST total) as first section in the detail pane; `TeammatesPanel` shows sprite + name + % instead of a bar; removed progress bars from `StatPanel` (name + % only — bars add no signal to percentage lists); `baseStats` added to `PokemonUsageDetail` entity and resolved from `@pkmn/sim` Dex in `toDetail()` |
| 2026-04-27 | Hook extraction | Extracted `useSmogonSnapshots` and `useSmogonUsage` into `meta/_hooks/`; `MetaLayoutClient` is now a pure composition layer (routing + wiring only, no data-fetching logic inline) |
| 2026-04-27 | Detail panel enrichment | Added `rank: number` and `types: string[]` to `PokemonUsageEntry` (backend entity + `toDetail()` + frontend interface); `TypeBadgeSmall` type badges shown in detail header; `TeraTypesPanel` replaces plain `StatPanel` for Tera Types (badge per type, "Other" fallback via `vgc.meta.detail.other` i18n key); clickable teammates navigate to that Pokémon's detail; nature coloring in EV Spreads (`+Stat/-Stat` in stat-specific colors, spread formatted as `252 Spe / 4 Def`); sidebar rank shown as `#N`; Abilities + Tera Types share one grid column |
| 2026-04-27 | UI polish | Removed hexagonal radar chart (`SpreadRadarChart`) from EV Spreads section; section title color brightened (`text-surface-400`); Tera Types "Other" entry shows localized fallback text instead of a broken type badge; scroll redesigned: row div is the single `overflow-y-auto` container, sidebar is `md:sticky md:top-0 md:h-[calc(100vh-3rem)]` (FormatBar fixed at `h-12`), detail panel drives content height — eliminates the two-independent-scrolls issue |

---

## Feature Implementation Checklist

### Phase 0 — Foundation (API module + schema)
- [x] Create `Vgc.ts` schema in `apps/api/src/_db/schema/`
- [x] Create `vgc/meta/` subfolder at `apps/api/src/api/boffmedia/herramientas/pokemon/vgc/meta/`
- [x] Scaffold `meta.module.ts`, `meta.controller.ts`, `meta.facade.service.ts`
- [x] Scaffold `config/`, `dto/`, `entities/`, `repositories/`, `services/` subfolders
- [x] Implement `RolesGuard` + `@Roles()` decorator in `apps/api/src/api/_utils/guards/` + `decorators/`
- [x] Register `VgcMetaModule` inside `VgcModule` (not directly in AppModule)
- [x] Write `parse-paste-meta.ts` in `services/` (captures SP/EV spread; tracker types untouched)
- [x] Implement Champions SP stat formula in `stat-calc.service.ts` (full nature table, `isValidChampionsSpread`)
- [x] Unified `vgcPastes` table — single source of truth for all Showdown pastes regardless of origin
- [x] Extend `champions-data.ts` with `vgcPastesGid` per regulation

### Phase 1 — Ladder Meta (Smogon)
- [x] `SmogonService.resolveLatestMonth()` — probe Smogon stats index or fall back to prev month
- [x] `SmogonService.getUsageList()` — check cache; if miss, fetch chaos JSON, store, parse to `PokemonUsageEntry[]`
- [x] `SmogonService.getPokemonDetail()` — deserialize cached snapshot, return full per-Pokemon breakdown
- [x] Name resolution utility using `@pkmn/sim` Dex (species; items/moves via display names from chaos JSON)
- [x] NestJS endpoint: `GET /tools/vgc/meta/smogon?format=&month=&cutoff=`
- [x] NestJS endpoint: `GET /tools/vgc/meta/smogon/:speciesId`
- [x] `/pokemon/vgc/meta` page with Ladder tab
- [x] Regulation + month + cutoff picker UI
- [x] Usage table (sprite | name | bar | top item | top move | top tera)
- [x] Pokemon detail panel (click to expand: abilities / items / moves / tera / teammates / spreads)
- [x] Hexagonal radar chart for EV spread (Recharts `<RadarChart>`)
- [x] **Pikalytics-style two-pane redesign** — dynamic routes `/meta/[speciesId]`, URL-persisted params, persistent sidebar, panel grid, mobile full-screen modes

### Phase 2 — Champions Meta (VGCPastes CSV — basic usage)
- [ ] `VgcPastesService.refreshRegulation()` — fetch CSV via `VGCPASTES_SHEET_BASE + gid`, parse, upsert `vgcPasteTeams`
- [ ] `VgcPastesService.getUsageList()` — aggregate `species` column, return `PokemonUsageEntry[]`
- [ ] NestJS endpoint: `GET /tools/vgc/meta/champions?regulationId=`
- [ ] Admin endpoint: `POST /tools/vgc/meta/champions/refresh` (guarded by `RolesGuard + @Roles('admin')`)
- [ ] Champions tab in meta page
- [ ] Usage table from `species` column (no paste fetch needed)
- [ ] Tournament + date range filter UI

### Phase 3 — Full Champions Depth (Paste Fetch)
- [ ] `PokepasteService.fetchAndCache()` — GET `pokepast.es/{id}/json`, parse via `parsePasteMeta()`, upsert `vgcPastes`
- [ ] `PokepasteService.batchFetch()` — process in chunks of `POKEPASTE_CONCURRENCY` (10), then `VgcPastesRepository.linkPaste()`
- [ ] NestJS endpoint: `GET /tools/vgc/meta/champions/:speciesId/detail`
- [ ] Detail panel enriched: Champions move / item / SP spread breakdown
- [ ] SP spread → computed stats via `StatCalcService` → hexagonal radar chart

### Phase 4 — Ladder vs Champions Divergence
- [ ] Divergence score computation: `|ladder_usage - champions_usage|`
- [ ] NestJS endpoint: `GET /tools/vgc/meta/divergence?regulationId=`
- [ ] Compare tab in meta page
- [ ] Sortable divergence table
- [ ] "Ladder trap" badge (high ladder %, low Champions %)
- [ ] "Tournament staple" badge (low ladder %, high Champions %)

### Phase 5 — Limitless Tournament Aggregation
- [ ] `LimitlessService.importTournament()` — extract `limitlessId` from URL, scrape standings HTML, batch-scrape teamlist pages
- [ ] Paste write path: `parsePasteMeta(rawText)` → `PastesRepository.upsertPaste()` → `LimitlessRepository.linkPaste()`
- [ ] Rate-limit stagger: max 10 req/min (50 req/5 min) with retry on 429
- [ ] Admin endpoint: `POST /tools/vgc/meta/limitless/tournament` (guarded by `RolesGuard + @Roles('admin')`)
- [ ] NestJS endpoint: `GET /tools/vgc/meta/limitless/usage?tournamentId=`
- [ ] Tournament tab in meta page (admin URL input + cached tournament list)

### Future — RK9 Regionals Pairings (Low Priority)
- [ ] RK9 event scrape (`rk9.gg/event/{id}`)
- [ ] RK9 pairings scrape (`rk9.gg/pairings/{id}`)
- [ ] Display upcoming tournament pairings (companion feature, not meta aggregation)

### Future — Personal Integration
- [ ] Join meta usage data with user's own tracker `opponentTeam` records
- [ ] "You vs the meta" overlays in `SessionStatsView`

---

## Data Sources — Ground Truth

### Smogon Chaos Endpoint

**URL pattern:** `https://www.smogon.com/stats/{YYYY-MM}/chaos/{format}-{cutoff}.json`

- No CORS → NestJS API fetches only. No auth, no rate limiting.
- ~6.5 MB uncompressed; `.json.gz` variant is much smaller — prefer gzip.
- Updates monthly (~1st of following month). Latest confirmed: `2026-03`.
- `gen9vgc2026regi` exists from `2026-01` onward.
- **No Champions format in Showdown** — Smogon = regular VGC ladder only.

**Default cutoff:** `1760`. Named constant in `config/smogon.config.ts`:
```ts
export const SMOGON_DEFAULT_CUTOFF = 1760; // 0 | 1500 | 1630 | 1760
```

**Per-Pokemon fields:** `Raw count`, `usage` (float), `Abilities`, `Items`, `Spreads`, `Moves`, `Tera Types`, `Teammates`, `Checks and Counters` (always empty in VGC).

**Name resolution via `@pkmn/sim`:**
```ts
Dex.forFormat('gen9vgc2026regi').items.get('safetygoggles').name // "Safety Goggles"
Dex.forFormat('gen9championsvgc2026regma').moves.get('fakeout').name // "Fake Out"
```

---

### VGCPastes Google Sheet

**URL:** `https://docs.google.com/spreadsheets/d/1axlwmzPA49rYkqXh7zHvAtSP-TKbM0ijGYBPRflLSWw/export?format=csv&gid={GID}`

- Server-side fetch only (redirect CORS issue from browser).
- ~179 KB CSV, 476 teams (as of 2026-04-26). Champions tier only.
- **GID is per-regulation** — `791705272` = Reg M-A. Stored in `CHAMPIONS_REGULATIONS[id].vgcPastesGid`.
- `Pokemon Text for Copypasta` column = 6 species names, comma-separated → basic usage without paste fetching.

---

### Pokepaste JSON API

**URL:** `https://pokepast.es/{id}/json`  
CORS open (`*`), ~1.3 KB, no auth, no rate limiting observed.  
Fields: `{ author, notes, paste, title }` — `paste` feeds into `parsePasteMeta()`.

---

### Limitless TCG

**Standings:** `https://play.limitlesstcg.com/tournament/{id}/standings` — 497 KB HTML, no CORS.  
**Teamlist:** `https://play.limitlesstcg.com/tournament/{id}/player/{slug}/teamlist` — 14 KB HTML.  
Team paste extracted via: `` html.match(/const teamlist = `([\s\S]*?)`/) ``  
Rate limit: **50 req / 5 min** (confirmed from response headers).

---

### RK9 (Future — Low Priority)
`https://rk9.gg/event/pokemon-euic-2026` / `https://rk9.gg/pairings/{id}`  
Pairings companion feature only. Not meta aggregation.

---

## Architecture

### Module Structure

```
apps/api/src/api/boffmedia/herramientas/pokemon/vgc/
├── meta/                                     ← VgcMetaModule (registered inside VgcModule)
│   ├── meta.module.ts
│   ├── meta.controller.ts                    ← @Controller('tools/vgc/meta')
│   ├── meta.facade.service.ts
│   ├── config/
│   │   └── smogon.config.ts                  ← SMOGON_DEFAULT_CUTOFF, URL builders, rate limits
│   ├── dto/
│   │   ├── query-smogon.dto.ts
│   │   ├── query-champions.dto.ts
│   │   ├── query-limitless.dto.ts
│   │   └── add-limitless-tournament.dto.ts
│   ├── entities/
│   │   └── pokemon-usage.entity.ts           ← PokemonUsageEntry, PokemonUsageDetail, DivergenceEntry
│   ├── repositories/
│   │   ├── smogon.repository.ts              ← vgcSmogonSnapshots
│   │   ├── pastes.repository.ts              ← vgcPastes (all sources — pokepaste + limitless)
│   │   ├── vgcpastes.repository.ts           ← vgcPasteTeams (CSV metadata)
│   │   └── limitless.repository.ts           ← vgcLimitlessTournaments + vgcLimitlessTeams
│   └── services/
│       ├── smogon.service.ts                 ← fetch + parse Smogon chaos JSON [Phase 1]
│       ├── vgcpastes.service.ts              ← fetch + parse CSV [Phase 2]
│       ├── pokepaste.service.ts              ← batch pokepast.es fetch [Phase 3]
│       ├── limitless.service.ts              ← HTML scraping [Phase 5]
│       ├── stat-calc.service.ts              ← Champions SP formula (fully implemented)
│       └── parse-paste-meta.ts              ← Showdown paste parser with spread capture (fully implemented)
├── tracker/
│   └── ...
├── vgc.module.ts                             ← imports [TrackerModule, VgcMetaModule]
└── champions-data.ts                         ← CHAMPIONS_REGULATIONS with vgcPastesGid
```

### Frontend Hook Convention

Data-fetching hooks live in `meta/_hooks/`, one concern per file:

| Hook | File | Responsibility |
|---|---|---|
| `useSmogonSnapshots()` | `_hooks/useSmogonSnapshots.ts` | Fetches available snapshot list once on mount |
| `useSmogonUsage(format, month, cutoff)` | `_hooks/useSmogonUsage.ts` | Fetches full detail list + builds `Map<speciesId, detail>` |

`MetaLayoutClient` is a **composition layer only** — it reads URL params, calls hooks, handles routing side-effects (auto-navigate to first snapshot / first Pokémon), and wires props. No `fetch` calls inside the component itself.

New hooks for future tabs (Champions, Compare) should follow the same pattern in `_hooks/`.

---

### Paste Write Path (Phase 3 + 5)

All pastes — regardless of origin — flow through `PastesRepository`:

```
pokepast.es fetch     →  parsePasteMeta(paste)  →  PastesRepository.upsertPaste({ pokepasteId, rawText, parsedSlots })
                                                     └→ returns vgcPastes.id
                                                  →  VgcPastesRepository.linkPaste(teamId, pasteId)

Limitless scrape      →  parsePasteMeta(rawText) →  PastesRepository.upsertPaste({ rawText, parsedSlots })
                                                     └→ returns vgcPastes.id
                                                  →  LimitlessRepository.linkPaste(teamId, pasteId)
```

If the same pokepast.es paste appears in both VGCPastes CSV and a Limitless tournament, `upsertPaste` hits the `onDuplicateKeyUpdate` on `pokepaste_id` — one row shared by two FK references.

### Roles Guard

```ts
// apps/api/src/api/_utils/guards/roles.guard.ts  — implemented
// apps/api/src/api/_utils/decorators/roles.decorator.ts — implemented

@Post('limitless/tournament')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
importTournament(@Body() dto: AddLimitlessTournamentDto) { ... }
```

`roles` array already lives in the JWT payload (populated by `auth.service.ts`). No DB change needed.

---

## DB Schema — `Vgc.ts`

```
apps/api/src/_db/schema/Vgc.ts
```

### `vgc_smogon_snapshots`
| Column | Type | Notes |
|---|---|---|
| id | int PK autoincrement | |
| format_id | varchar(64) | e.g. `gen9vgc2026regi` |
| month | varchar(7) | e.g. `2026-03` |
| cutoff | int | 0 / 1500 / 1630 / 1760 |
| data | longtext | full chaos JSON blob (~6.5 MB) |
| fetched_at | datetime | |

Unique index on `(format_id, month, cutoff)`.

### `vgc_pastes` — unified paste store
| Column | Type | Notes |
|---|---|---|
| id | int PK autoincrement | internal stable key |
| pokepaste_id | varchar(32) UNIQUE nullable | pokepast.es ID; null for inline Limitless pastes |
| raw_text | text | source of truth — used to re-parse if logic changes |
| parsed_slots | text | JSON: `VgcMetaSlot[]` |
| author | varchar(128) nullable | |
| title | varchar(255) nullable | |
| format_id | varchar(64) nullable | |
| fetched_at | datetime | |

### `vgc_paste_teams` — VGCPastes CSV entries
| Column | Type | Notes |
|---|---|---|
| id | varchar(16) PK | e.g. `PC476` |
| paste_id | int nullable FK → `vgc_pastes.id` | null until Phase 3 fetches the paste |
| paste_url | varchar(255) nullable | |
| player_name | varchar(128) nullable | |
| tournament | varchar(255) nullable | |
| date_shared | varchar(16) nullable | `DD Mon YYYY` |
| rank | varchar(64) nullable | |
| regulation_id | varchar(64) nullable | |
| species | text | JSON: `string[]` — quick Phase 2 list, no paste needed |
| fetched_at | datetime | |

### `vgc_limitless_tournaments`
| Column | Type | Notes |
|---|---|---|
| id | int PK autoincrement | |
| limitless_id | varchar(64) UNIQUE | extracted from URL |
| name, date, format | varchar | |
| player_count | int nullable | |
| fetched_at | datetime | |

### `vgc_limitless_teams`
| Column | Type | Notes |
|---|---|---|
| id | int PK autoincrement | |
| tournament_id | int FK → `vgc_limitless_tournaments.id` CASCADE | |
| player_slug | varchar(128) | |
| player_name | varchar(128) nullable | |
| record | varchar(16) nullable | e.g. `7-2-0` |
| paste_id | int nullable FK → `vgc_pastes.id` | null until teamlist page scraped |
| fetched_at | datetime | |

---

## Champions SP Stat Formula

**Critical difference from standard Pokemon:** Champions format uses **Stat Points (SP)** instead of EVs/IVs.

### Rules
- Total SP budget: **66** per team slot
- Max SP per individual stat: **32**
- IVs do not exist in Champions — all stats derived from Base + SP only
- "Alignment" = the nature multiplier (same values as standard: x1.1, x1.0, x0.9)

### Formulas
```
HP  = Base + SP + 75
Any other stat = floor( (Base + SP + 20) x Alignment )
```

### Examples (Incineroar, base stats: 95 HP / 115 Atk / 90 Def / 45 SpA / 90 SpD / 60 Spe)

| Stat | Base | SP | Alignment | Result |
|---|---|---|---|---|
| HP | 95 | 10 | — | 95 + 10 + 75 = **180** |
| Atk (Adamant) | 115 | 32 | 1.1 | floor((115+32+20)x1.1) = **184** |
| Def (neutral) | 90 | 0 | 1.0 | floor((90+0+20)x1.0) = **110** |
| Spe (neutral) | 60 | 8 | 1.0 | floor((60+8+20)x1.0) = **88** |

### Paste Format

Champions SPs appear under the `EVs:` label in Showdown paste format (values are SPs 0–32, not EVs 0–252). Validation: all six values must sum to <= 66.

```
Incineroar @ Safety Goggles
Ability: Intimidate
EVs: 10 HP / 32 Atk / 0 Def / 0 SpA / 16 SpD / 8 Spe   <- these are SPs, not EVs
Adamant Nature
```

`parsePasteMeta()` in `services/parse-paste-meta.ts` captures this into `VgcMetaSlot.spread: StatSpread`.  
`StatCalcService.computeChampionsStats()` in `services/stat-calc.service.ts` applies the formula (full 20-nature table implemented).

> **Note:** Replace `StatCalcService` with `@pkmn/sim` native support once the Champions formula lands in the library.

---

## UI Structure

```
/pokemon/vgc/meta
  ├── Tabs: [Ladder | Champions | Compare]
  │
  ├── Ladder tab (Smogon chaos) — two-pane persistent layout
  │     ├── FormatBar: regulation pills + Options popover (month / cutoff)
  │     ├── Left pane: sticky sidebar — ranked list (sprite | rank | name | bar | %) + search
  │     └── Right pane: panel grid per selected Pokémon
  │           Row 1: Moves · Items · Abilities
  │           Row 2: Tera Types · Teammates · EV Spreads + RadarChart
  │     Mobile: sidebar only (no speciesId) ↔ detail only (speciesId set) — back button navigates
  │     URL: /meta/[speciesId]?format=gen9vgc2026regi[&month=YYYY-MM][&cutoff=1630]
  │
  ├── Champions tab (VGCPastes + Limitless)
  │     ├── Source: [VGCPastes | Limitless]
  │     ├── [VGCPastes] Regulation picker · date range · tournament filter
  │     ├── [Limitless] Tournament picker (admin URL input when no cached data)
  │     ├── Usage table (same structure as Ladder)
  │     └── Pokemon detail panel (Champions moves / items / SP spreads)
  │
  └── Compare tab
        ├── Side-by-side: Ladder % vs Champions %
        ├── Divergence table (sorted by |ladder - champions|)
        ├── "Ladder trap" badge  ·  "Tournament staple" badge
        └── Month-over-month trend sparklines (future)
```

---

## Answered Questions

**Q1** New dedicated page. → `/pokemon/vgc/meta`  
**Q2** Inside VGC section, alongside `/speed-tiers`, `/tracker`.  
**Q3** Champions tier only. GID `791705272` (Reg M-A).  
**Q4** Default `1760` cutoff. Named constant `SMOGON_DEFAULT_CUTOFF`. UI picker exposes all four.  
**Q5** Multiple months. Each stored as a separate DB snapshot. Month picker in UI.  
**Q6** No Champions in Showdown. Smogon = ladder only.  
**Q7** Admin pastes any Limitless URL.  
**Q8** Configurable threshold. Above it, admin triggers manual team-fetch job.  
**Q9** RK9 for Regionals — low-priority future feature (pairings only).  
**Q10** Persist to DB (MySQL/Drizzle).  
**Q11** Drizzle/MySQL. Schema file `Vgc.ts` (renamed from `VgcMeta.ts`).  
**Q12** Strategy A (CSV species) in Phase 2, Strategy B (lazy paste fetch) in Phase 3.  
**Q13** `@pkmn/sim` Dex for base stats. Champions SP formula in `StatCalcService` (workaround until library support).  
**Q14** Recharts `<RadarChart>`. Try it, revisit if sizing issues emerge.  
**Q15** Personal integration — future phase.  
**Q16** Both: publicly accessible meta page + future tracker-aware overlays for logged-in users.  
**Q17/Q18** `@pkmn/sim` Dex for all name resolution. Champions mod format IDs as canonical keys.  
**Q19** `vgc2026regma` / `gen9championsvgc2026regma` confirmed in `champions-data.ts`.

**OQ1** Module at `vgc/meta/` (subfolder of existing `vgc/`, parallel to `tracker/`). Registered inside `VgcModule`, not AppModule directly. Events module pattern (facade + multiple services + repositories).

**OQ2** No existing `RolesGuard`. Implemented `RolesGuard` + `@Roles()` decorator in `api/_utils/guards/` and `api/_utils/decorators/`. Roles already in JWT payload. No DB change needed.

**OQ3** Only latest month for initial DB seed. Fetch historical only if user requests via picker.

**OQ4** GID is per-regulation. Added `vgcPastesGid?: string` to `ChampionsRegulation` in `champions-data.ts`. When a new regulation ships, add a new entry there. Zero other files change.

**OQ5** Recharts `<RadarChart>`. Already a project dependency.

**OQ6** Yes, EVs (SPs) must be parsed. Separate `parse-paste-meta.ts` file; tracker types untouched.

**OQ7** Separate `parse-paste-meta.ts` in `vgc/meta/services/`. Tracker types stay clean.

**OQ8** Smogon Ladder uses standard EVs (0–252); Champions pastes use SPs (0–32). Entirely separate code paths. `StatCalcService` invoked only for Champions spreads.

**OQ9** Admin UI inside `/pokemon/vgc/meta`, hidden section visible only to `admin` role. `RolesGuard` enforces server-side.

**OQ10** Unified `vgcPastes` table for all Showdown pastes. `vgcPasteDetails` eliminated. Both `vgcPasteTeams.pasteId` and `vgcLimitlessTeams.pasteId` FK into `vgcPastes.id`. `pastes.repository.ts` (`PastesRepository`) owns all paste upserts and returns the internal ID for back-linking.

---

## Open Questions

*(All resolved — none pending.)*
