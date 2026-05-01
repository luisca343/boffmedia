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
| 2026-04-27 | Admin Champions panel | Added `VgcChampionsFetcher` component to `/admin?section=vgc-meta`: shows all configured regulations with import status (green dot = has data), "Importar CSV" button per regulation triggers `POST /champions/refresh`, reload-safe feedback; rendered below `VgcSmogonFetcher` with a divider in the VGC Meta admin section |
| 2026-04-27 | CSV parser fix | Replaced line-split + per-line parser with a full RFC-4180 `parseCsv()` that handles multi-line quoted fields. Root cause: the header row contains `"Replica Code\n(Click text for image)"` — a cell with an embedded newline — which broke `split('\n')` into two incomplete lines, causing header detection to fail. Added team-ID validation guard (`/^[A-Za-z0-9]+$/`, max 16 chars) to skip stray header-repeat rows at the end of the sheet. Actual column order confirmed: Team ID @ col 0, Full Name @ col 3, Pokepaste @ col 24, Date Shared/Tournament/Rank @ cols 29–31, Pokemon Text for Copypasta @ col 37, species @ cols 38–43, Team ID repeated @ col 44. |
| 2026-04-27 | Phase 2 implemented | `VgcPastesService.refreshRegulation()` fetches Google Sheets CSV, detects header row by "Team ID" column, parses quoted CSV, upserts all teams via `vgcPastesRepository`; `VgcPastesService.getUsageList()` aggregates species counts + computes teammate co-occurrence matrix, returns `PokemonUsageDetail[]` with base stats/types from `@pkmn/sim` and empty moves/items/abilities/spreads; `GET /champions/available` endpoint lists regulations with imported data; guard removed from `POST /champions/refresh`; Champions tab added to meta page (Ladder ↔ Champions toggle in FormatBar); regulation pills in Champions mode; Refresh button triggers CSV re-import; detail panel sections guarded by `.length > 0` so empty arrays don't render; `useChampionsRegulations` + `useChampionsUsage` hooks extracted to `_hooks/` |
| 2026-04-27 | Champions Preview label | Added amber `Preview` badge to Champions tab button in `FormatBar`; thin info banner rendered below FormatBar when Champions tab is active; two new i18n keys (`tabs.previewBadge`, `tabs.championsPreviewNotice`) added to EN + ES locale files. Champions data is temporary (VGCPastes CSV) until Smogon adds the Champions format. |
| 2026-04-27 | Navigation hook extraction | Extracted `useMetaNavigation` into `meta/_hooks/useMetaNavigation.ts`; encapsulates `buildUrl`, URL-state parsing, all three auto-navigation `useEffect`s, `detail` derivation, and all five `useCallback` handlers. `MetaLayoutClient` reduced to pure composition: reads URL params inline only to gate data hooks, then delegates all navigation logic to `useMetaNavigation`. |
| 2026-04-27 | Phase 3 implemented (partial) | `PokepasteService.fetchAndCache()` fully implemented (cache-hit + miss path via `pokepast.es/{id}/json`); `VgcPastesService.batchFetchRegulation()` processes teams in chunks of `POKEPASTE_CONCURRENCY`, auto fire-and-forget at end of `refreshRegulation()`; `VgcPastesService.getPasteDetail()` aggregates moves/items/abilities/spreads from `parsedSlots` per species; `GET /champions/:speciesId/detail` + `POST /champions/fetch-pastes` added; `useChampionsPasteDetail` hook; `MetaLayoutClient` merges paste detail over base detail via `useMemo`; "Fetch Pastes" button in `VgcChampionsFetcher`; `ChampionsPasteDetailDto`+`BatchFetchResultDto` with `@ApiProperty`, `pnpm generate:shared` run, frontend imports from `@boffmedia/shared`. SP radar chart (StatCalcService) pending. |
| 2026-04-27 | SP radar chart cancelled | SP spread → `StatCalcService` → hexagonal radar chart deferred indefinitely. Phase 3 marked complete without it. |
| 2026-04-28 | Phase 5 implemented | Full Limitless Tournament Aggregation end-to-end. Backend: `LimitlessService` with fire-and-forget `importTournament()` + `runImport()` background job; `decklistToText()` generates proper Showdown paste from structured Limitless API data; `resolveSpeciesName()` uses `entry.id` (Showdown slug) for canonical names; `getUsageList()`, `getCombinedUsage()`, `getPlayerList()`, `getPlayerTeam()` implemented; all 7 Limitless controller endpoints registered (no guards — matches pattern of all other meta admin endpoints); `LIMITLESS_RATE_LIMIT` config constant added. DB: migration `0006_married_rattler.sql` adds `placing` to `vgc_limitless_teams` and `regulation_id`, `status`, `progress`, `total`, `error_message` to `vgc_limitless_tournaments` (migration applied manually on server). Frontend: `useMetaNavigation` extended with `view` URL param + `handleViewChange`; `MetaLayoutClient` has Aggregate/Players sub-tab strip (shown only when `tab=tournament`); three new hooks (`useLimitlessTournaments`, `useLimitlessUsage`, `useLimitlessPlayers`); `StandingsView` component (standings table with lazy per-player team fetch, `<Fragment key>` fix, plain `<img>` sprites); `FormatBar` extended with `tournament` tab + regulation pills → "Combined" pill + individual tournament pills; locale keys `tournament`, `combined`, `aggregate`, `players` added (EN + ES). Admin panel `VgcLimitlessFetcher` **not yet implemented**. |
| 2026-04-28 | Tab consolidation | Removed the separate Champions tab. `tab=ladder` renamed to `tab=stats` (default, omitted from URL). VGCPastes-backed regulations now appear as amber "Preview" pills inside the Stats format bar, alongside Smogon format pills. The format bar derives source from the active `format` param: if it matches a known Smogon snapshot → Smogon hook; if it matches an available regulation → Champions/VGCPastes hook. Both lists must load before either hook fires (prevents spurious Smogon requests for Champions format IDs). Tournament tab gains regulation pills at the start of its bar and auto-selects the first regulation when none is set. Refresh button removed from the public meta page (admin-only). `tabs.ladder`/`tabs.champions` locale keys replaced with `tabs.stats`. |
| 2026-04-28 | VgcLimitlessFetcher admin panel | `VgcLimitlessFetcher` component implemented: URL input, regulation picker (5 options), optional max-players field; submit → `POST /limitless/tournament` → returns `tournamentId`; per-tournament `setInterval` polling every 3 s via `useRef<Map<number, interval>>`; progress bar inline in the table row while `status === "running"`; status icons (`Loader2` / `CheckCircle2` / `AlertCircle`); tournament list sorted by date; wired into `/admin?section=vgc-meta` below `VgcChampionsFetcher`. Phase 5 fully complete. |
| 2026-04-28 | StandingsView UX improvements | **Eager team prefetch**: all player teams now fetched concurrently on mount via a `useEffect` + `fetchedRef` Set; sprites appear without requiring a click. **Scroll-into-view**: expanding a row scrolls the detail panel into view with `scrollIntoView({ behavior: "smooth", block: "nearest" })` using a `detailRowRef`. **Copy Poképaste button**: expanded row exposes a "Copy Poképaste" button that writes `rawText` to the clipboard with a 2-second "Copied!" confirmation; backend `getPlayerTeam()` and `findTeamWithPaste()` now return `rawText`; `LimitlessPlayerTeam` type updated. **i18n**: all `StandingsView` strings moved to `vgc.meta.standings.*` keys in both EN and ES locale files. **Top-N sort fix**: `runImport()` now sorts standings by `placing` ascending before `slice(0, maxPlayers)` so `maxPlayers=16` reliably gives the actual top 16 finishers. **Sprite fix**: `floette-eternal` only exists at `sprites/dex/` — added `SPRITE_DEX_SLUGS` Set in `types.ts` to route specific slugs to the dex base URL instead of home-centered/gen5; removed wrong `floette-eternal-mega` override. |
| 2026-04-28 | FormatBar selects redesign | Replaced all format/regulation/tournament pills with `<select>` elements for a more compact and consistent UI. Stats tab: single `<select>` with `<optgroup label="Smogon">` and `<optgroup label="VGCPastes · Preview">` groups; month and cutoff also inline `<select>`s (no Apply button — change fires immediately via `onOptionsApply`). Tournament tab: regulation `<select>` + tournament `<select>` (Combined + individual entries sorted by date desc). Options popover (`Settings2` icon, `useRef`, `useState`) fully removed. `SELECT_CLS` constant for consistent styling across all selects. All tabs use the same sticky sidebar layout (`md:sticky md:top-0 md:h-screen`). |
| 2026-04-28 | Dex mod consistency fix | Fixed missing base stats for new Champions mega evolutions by making all VGC meta aggregators format-aware. `SmogonService`, `VgcPastesService`, and `LimitlessService` now resolve species through `Dex.forFormat(...)` (with Champions mod initialized via `initChampionsMod()`), instead of relying on global `Dex.species`. For `regulationId=vgc2026regma`, species/stat/type lookups now correctly use `gen9championsvgc2026regma` across Stats preview + Tournament aggregate/player flows. **Guardrail:** any future meta usage/detail aggregation must resolve species with format-specific Dex, never plain global Dex for Champions-enabled formats. |
| 2026-04-28 | SOLID refactor | Centralized all format-aware Dex logic into `meta/utils/dex-resolver.ts` (`getDexForFormat`, `resolveSpeciesId`). Removed duplicate implementations from the three services. Extracted `FORMAT_LABELS` from `MetaLayoutClient` into `meta/constants.ts` (non-component files must not live inside `_components/`). Fixed `catch (e)` unknown-type error in `VgcPastesService`. Fixed non-null assertion on `parsedSlots` in `LimitlessService` with a proper type-predicate filter. |
| 2026-04-29 | Divergence planning (deferred) | Phase 4 implementation deferred, but approach decided: (1) Divergence lives under Tournament tab as a third sub-view (`aggregate` / `players` / `divergence`), (2) reuse existing regulation + tournament selectors from FormatBar/useMetaNavigation, (3) default baseline = Smogon vs selected tournament (or Smogon vs Combined when tournament=Combined), (4) honor URL `month`/`cutoff` for Smogon baseline, (5) Global divergence is public while Personal mode remains auth-gated, (6) initial badge thresholds: Ladder trap = ladder >= 10% and tournament <= 5% and delta >= +5; Tournament staple = tournament >= 10% and ladder <= 5% and delta <= -5. |
| 2026-04-29 | UX direction (deferred) | Decided lightweight onboarding over guided tour: one-time dismissible "What am I seeing?" panel + contextual `?` tooltips for key labels (`Preview`, `Combined`, future `Divergence`). Decided mobile optimization priority = fast scan first (denser ranked list) then deep detail (full-screen detail with sticky mini-header + section jump chips). Implementation deferred to next UX slice. |
| 2026-04-29 | UX prioritization resolved (deferred) | Decided to remember last Tournament sub-view per user (`aggregate`/`players`/`divergence`), enable personal sample-size confidence indicators, ship quick actions in v1 for high-delta rows, show public data freshness metadata in meta UI, and show full section jump chips by default in mobile detail. Added a concrete deferred UX implementation checklist. |
| 2026-04-30 | Phase 4 implemented | `DivergenceService.compareLadderVsTournament()` joins Smogon ladder entries vs Limitless tournament/combined entries; badge thresholds from OQ-D4 applied (ladder-trap / tournament-staple); `GET /tools/vgc/meta/divergence` public endpoint; `useDivergence` hook; `DivergenceView` sortable table (click header to sort by Ladder %, Tourn. %, or |Δ|); amber / blue badge chips with tooltips; "Divergence" added as third sub-tab in Tournament tab alongside Aggregate and Players; EN + ES i18n keys added. |
| 2026-05-01 | Discord `/vgc` bot commands | Implemented Necord-based Discord slash commands under the `/vgc` group (`dmPermission: true`; dev guild via Necord `development` mode). Four sub-commands: `/vgc pokemon <regulation> <pokemon>` — 4-page paginated embed (Overview → Abilities & Items → Moves → Tera & Spreads) fetching full `PokemonUsageDetail`; `/vgc top <regulation> [count]` — button-paginated ranked list (10/page); `/vgc teammates <regulation> <pokemon> [pokemon2] [pokemon3]` — strict teammate intersection across 1–3 Pokémon (fallback to "most common across inputs" when intersection is empty); `/vgc regulations` — lists all active regulations with Smogon/Champions source badge. Regulation option on all commands uses `AutocompleteInterceptor` backed by `VgcMetaFacadeService.getRegulations()`. Shared `meta-paginator.ts` utility (nav row, detail pages, top pages). **Known limitation at time of writing:** `/vgc teammates` only resolved teammate data from Smogon — fixed in Phase 6 same day. |
| 2026-05-01 | Phase 6 — Unified detail layer | Verified that `VgcPastesService.getUsageList()` and `LimitlessService.getCombinedUsage()` already computed `teammates[]` via co-occurrence matrices (Phase 2 / Phase 5). The bot's failure for non-Smogon formats was purely a routing gap — no new computation needed. Added four methods to `VgcMetaFacadeService`: `getChampionsDetail()` (filters from Champions usage list, merges paste detail for moves/items/abilities/spreads), `getLimitlessDetail()` (filters from combined Limitless usage), `getUnifiedUsageList()` (routes to Champions / Smogon / Limitless by regulation flags), `getUnifiedDetail()` (same routing for full `PokemonUsageDetail`). Added `getUnifiedUsageDetailList()` (returns full `PokemonUsageDetail[]` for the entire regulation). Simplified `meta-pokemon.command.ts` to two calls. Removed `if (!reg.formatId)` guard from `meta-teammates.command.ts`. All three sources now return consistent `PokemonUsageDetail` with teammates to all callers. |
| 2026-05-02 | Divergence mega/eternal normalization | Added `toBaseFormId(speciesId, dex)` to `dex-resolver.ts`: maps `Mega`, `Mega-X`, `Mega-Y`, `Primal`, and `Eternal` formes to their base species ID. `DivergenceService.compareLadderVsTournament()` now calls `mergeToBaseForms()` on both entry lists (using the format-aware Dex) before building the join Maps, so that `"charizardmegay"` (tournament) aligns with `"charizard"` (ladder) and `"floetteeternal"`/`"floettemega"` collapse to `"floette"`. If both base form and a mega form appear in the same dataset, usage percentages and raw counts are summed and the better rank is kept. Regional/alternate formes (Rotom-Wash, Landorus-Therian, etc.) are intentionally left unchanged. |
| 2026-05-01 | Phase 8 — Coaching & Insight layer | **New commands:** `/vgc analyze <regulation> <paste>` (3-page: team overview + archetype detection, type weakness bar chart, role gap analysis). `/vgc matchup <regulation> <your> <vs>` (2-page: type matchup with STAB effectiveness labels; damage calcs using `@smogon/calc` with meta-typical sets from usage data, fallback to estimated 252/252/4 EVs; weather/terrain auto-detected from top abilities; top 4 damaging moves each direction; kochance labels). **Shared utility:** `meta-team-utils.ts` (type chart, `analyzeWeaknesses`, `detectArchetype`, `analyzeRoles`). **Removed:** `/vgc compare` (= page 1 of `/vgc pokemon` × 2), `/vgc prep` (= `/vgc top` + `/vgc core`). **Cleaned:** `/vgc teammates` dead interceptor decorator removed. **Added dep:** `@smogon/calc ^0.10.0` as direct dependency (was transitive). |
| 2026-05-01 | Phase 7 — Intelligence layer | **Pokémon autocomplete:** `MetaVgcAutocompleteInterceptor` handles both `regulation` and `pokemon`/`pokemon2`/`pokemon3` fields; results sorted by prefix-match first then usage %; backed by `MetaCacheService` so keystroke-level autocomplete doesn't hammer the DB. **Cache:** `MetaCacheService` (in-memory, 10-min TTL, `getOrFetch` pattern) shared across all commands and the autocomplete interceptor. **New commands:** `/vgc core` — finds bidirectional synergy pairs from top-30 pool (scored by average mutual teammate %, tiered 🔑/💪/⚡); `/vgc compare` — side-by-side embed for two Pokémon (rank, usage, types, top move/item/tera/teammate) *(removed in Phase 8 — overlap with `/vgc pokemon`)*; `/vgc explain` — template-based role inference (usage tier, support/pivot/setter roles from moveset, item notes, best partner). **Enhancements:** `/vgc pokemon` overview page now shows top 3 teammates inline; `/vgc teammates` shows synergy tier emojis; `/vgc top` uses `getUnifiedUsageList` (works for all sources). **Bug fix:** `getChampionsDetail()` now merges paste detail into the usage-list entry — Champions regulations no longer return empty `moves`/`items`/`abilities` in `/vgc explain` and `/vgc pokemon`. |

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
- [x] `VgcPastesService.refreshRegulation()` — fetch CSV via `VGCPASTES_SHEET_BASE + gid`, parse, upsert `vgcPasteTeams`
- [x] `VgcPastesService.getUsageList()` — aggregate `species` column, compute teammate co-occurrence, return `PokemonUsageDetail[]`
- [x] Format-aware Dex resolution guardrail (`Dex.forFormat`) for species IDs, names, types, and base stats in Champions/Limitless/Smogon meta aggregators
- [x] NestJS endpoint: `GET /tools/vgc/meta/champions?regulationId=`
- [x] `GET /tools/vgc/meta/champions/available` — lists regulations with imported data
- [x] `POST /tools/vgc/meta/champions/refresh` — no auth guard (removed); Refresh button in FormatBar Champions mode + `VgcChampionsFetcher` in admin panel
- [x] Champions tab in meta page (Ladder ↔ Champions toggle in FormatBar)
- [x] Regulation pills in Champions mode; detail panel sections guarded by `.length > 0`
- [x] `useChampionsRegulations` + `useChampionsUsage` hooks in `_hooks/`
- [ ] Tournament + date range filter UI (deferred — single regulation for now)

### Phase 3 — Full Champions Depth (Paste Fetch)
- [x] `PokepasteService.fetchAndCache()` — GET `pokepast.es/{id}/json`, parse via `parsePasteMeta()`, upsert `vgcPastes`
- [x] `VgcPastesService.batchFetchRegulation()` — process in chunks of `POKEPASTE_CONCURRENCY` (10), then `VgcPastesRepository.linkPaste()`; auto-triggered (fire-and-forget) at end of `refreshRegulation()`
- [x] NestJS endpoint: `GET /tools/vgc/meta/champions/:speciesId/detail` → `getPasteDetail()` aggregates moves/items/abilities/spreads
- [x] NestJS endpoint: `POST /tools/vgc/meta/champions/fetch-pastes` → manual batch trigger
- [x] `useChampionsPasteDetail` hook (follows existing hook pattern)
- [x] Admin: "Fetch Pastes" button in `VgcChampionsFetcher` with result feedback
- [x] `ChampionsPasteDetailDto` + `BatchFetchResultDto` with `@ApiProperty`; `pnpm generate:shared` run; frontend imports from `@boffmedia/shared`
- [x] Detail panel enriched: Champions move / item / SP spread breakdown (via `useMemo` merge in `MetaLayoutClient`)
- [x] ~~SP spread → computed stats via `StatCalcService` → hexagonal radar chart~~ _(cancelled — deferred indefinitely)_

### Phase 4 — Ladder vs Tournament Divergence _(Complete)_
- [x] Divergence score computation: `|ladder_usage - tournament_usage|`
- [x] NestJS endpoint: `GET /tools/vgc/meta/divergence?regulationId=&tournamentId=&month=&cutoff=` (public)
- [x] "Divergence" sub-tab inside Tournament tab (alongside Aggregate and Players)
- [x] Sortable divergence table (click column headers: Ladder %, Tourn. %, |Δ|)
- [x] "Ladder trap" badge (ladder ≥ 10% AND tournament ≤ 5% AND delta ≥ +5)
- [x] "Tournament staple" badge (tournament ≥ 10% AND ladder ≤ 5% AND delta ≤ -5)

### Phase 5 — Limitless Tournament Aggregation _(Complete)_

#### Backend — Admin import pipeline
- [x] `LimitlessService.importTournament(url, regulationId, maxPlayers?)` — extracts `limitlessId` from URL; upserts tournament row; spawns fire-and-forget `runImport()` background job; returns `{ tournamentId }` immediately
- [x] Import job fetches standings from `play.limitlesstcg.com/api/tournaments/{id}/standings`; for each player with a decklist: resolves canonical species names via `resolveSpeciesName(entry)` (uses `entry.id` Showdown slug via `Dex.species.get()`); generates Showdown paste text via `decklistToText()` (name @ item / Ability / Level / Tera / moves); stores via `PastesRepository.upsertPaste()`; inserts `vgc_limitless_teams` row
- [x] Rate-limit config: `LIMITLESS_RATE_LIMIT = { requests: 50, windowMs: 5 * 60 * 1000 }` in `smogon.config.ts`
- [x] Admin endpoint: `POST /tools/vgc/meta/limitless/tournament` — no auth guard (matches pattern of all other meta admin endpoints); spawns background job, returns `{ tournamentId }` immediately
- [x] Job status: `status`, `progress`, `total`, `error_message` on `vgc_limitless_tournaments`; polling endpoint `GET /tools/vgc/meta/limitless/tournament/:id/status`
- [x] `LimitlessService.getUsageList(tournamentId)` — aggregates species from `parsedSlots` across all teams for a tournament; returns `PokemonUsageDetail[]`
- [x] `LimitlessService.getCombinedUsage(regulationId)` — same aggregation across all completed tournaments for a regulation
- [x] NestJS endpoints — all implemented:
  - [x] `GET /limitless/tournaments?regulationId=` — lists imported tournaments for a regulation
  - [x] `GET /limitless` — lists all cached tournaments
  - [x] `GET /limitless/usage?tournamentId=` — per-tournament usage list
  - [x] `GET /limitless/usage/combined?regulationId=` — cross-tournament aggregate
  - [x] `GET /limitless/tournament/:id/status` — job progress polling
  - [x] `GET /limitless/:tournamentId/players` — standings list (slug, name, record, placing, parsed team)
  - [x] `GET /limitless/:tournamentId/player/:slug` — full parsed team for one player

#### DB changes
- [x] Added `status varchar(16)`, `progress int`, `total int`, `error_message text nullable` to `vgc_limitless_tournaments`
- [x] Added `regulation_id varchar(64)` to `vgc_limitless_tournaments`
- [x] Added `placing int nullable` to `vgc_limitless_teams`
- [x] Migration file `0006_married_rattler.sql` generated and applied on server

#### Frontend — Tournament tab
- [x] `tab=tournament` in `FormatBar` — third tab alongside Ladder and Champions
- [x] `FormatBar` Tournament mode: regulation pills → "Combined [Reg]" special pill (pinned) + individual tournament pills
- [x] Two sub-tabs inside Tournament: **Aggregate** (usage table + detail panel) and **Players** (standings table) — controlled by `view` URL param
- [x] `useLimitlessTournaments(regulationId)` hook — fetches tournament list for a regulation
- [x] `useLimitlessUsage(tournamentId | 'combined', regulationId)` hook — fetches usage list (per-tournament or combined)
- [x] `useLimitlessPlayers(tournamentId)` hook — fetches player standings
- [x] `useMetaNavigation` extended: `view` URL param, `handleViewChange`, `handleTournamentChange`; auto-nav to first Pokémon guarded by `view === "aggregate"`; tab/regulation switch resets `view` to `"aggregate"`
- [x] `StandingsView` component: placing · player name · record · 6 inline sprites; row click lazily fetches + caches player team; expanded detail row with sprite + item + tera + moves per slot; uses `<Fragment key>` + plain `<img>` + `spriteUrl()` + `handleSpriteError`
- [x] `MetaLayoutClient` wires all Tournament hooks; conditionally renders `StandingsView` vs sidebar+detail layout based on `view`
- [x] Locale keys `tournament`, `combined`, `aggregate`, `players` added (EN + ES)
- [x] Admin panel: `VgcLimitlessFetcher` component — URL input + regulation picker + optional max-players; submit → POST → poll status every 3 s; progress bar; list of imported tournaments with status dot

### Phase 6 — Unified Detail Layer _(Complete)_

**Goal:** All `/vgc` Discord commands (and any future consumers) work correctly regardless of whether a regulation is backed by Smogon, Champions (VGCPastes), or Limitless tournament data.

#### Root Cause (resolved)

The bot was calling `getSmogonUsageList()` and `getSmogonDetail()` for all formats, which fails for non-Smogon regulations. The assumption that teammates were missing from Champions/Limitless was wrong — both already computed `teammates[]` via co-occurrence matrices. The gap was purely a routing issue in the facade.

| Source | `teammates[]` present? | Fix applied |
|---|---|---|
| Smogon | ✅ chaos JSON pre-computed | No change needed |
| Champions (VGCPastes) | ✅ co-occurrence matrix from Phase 2 | `getChampionsDetail()` filters from `getUsageList()` |
| Limitless | ✅ co-occurrence matrix from Phase 5 | `getLimitlessDetail()` filters from `getCombinedUsage()` |

#### Changes Made

- [x] **Verified** that `VgcPastesService.getUsageList()` populates `PokemonUsageDetail.teammates[]` from the co-occurrence matrix (Phase 2).
- [x] **Verified** that `LimitlessService.getCombinedUsage()` populates `teammates[]` from the co-occurrence matrix (Phase 5).
- [x] **Added `getChampionsDetail(regulationId, speciesId)`** to facade — finds the entry in the Champions usage list (already a `PokemonUsageDetail` with teammates).
- [x] **Added `getLimitlessDetail(regulationId, speciesId)`** to facade — finds the entry in the combined Limitless usage list.
- [x] **Added `getUnifiedUsageList(regulationId)`** to facade — routes to Champions / Smogon / Limitless based on regulation flags (`vgcPastesGid` → Champions, `formatId` → Smogon, neither → Limitless combined).
- [x] **Added `getUnifiedDetail(regulationId, speciesId)`** to facade — same routing; always returns `PokemonUsageDetail`.
- [x] **Updated `meta-pokemon.command.ts`** — replaced branched detail logic with `getUnifiedUsageList()` + `getUnifiedDetail()`.
- [x] **Updated `meta-teammates.command.ts`** — removed `if (!reg.formatId)` guard; uses `getUnifiedUsageList()` + `getUnifiedDetail()`.
- [x] **Web detail panel** — existing merge logic in `MetaLayoutClient` already handles all sources correctly (Champions paste detail is still available via `useChampionsPasteDetail` for richer move/item/spread data on top of base detail).

#### Design Constraint

> `getUnifiedDetail()` returns the same `PokemonUsageDetail` interface regardless of source. Callers must never branch on source to assemble the detail — that logic lives entirely in the service layer.

---

### Phase 7 — Autocomplete + Intelligence Layer _(Complete)_

**Goal:** Transform the `/vgc` bot from a data viewer into an intelligent competitive assistant.

#### Bug Fix — Champions `moves` empty

Champions `getUsageList()` returns `PokemonUsageDetail[]` with empty `moves`/`items`/`abilities`/`spreads` (Phase 2 only tracked species counts + teammate co-occurrence from the CSV species columns). Paste-derived detail lives in a separate `getPasteDetail()` call (Phase 3). `getChampionsDetail()` now merges both: paste data wins when non-empty, usage-list entry fields are the fallback. Limitless was not affected — `aggregateSlots()` populates moves/items/abilities/teraTypes from parsed Showdown pastes.

#### Changes Made

- [x] **`MetaCacheService`** — in-memory TTL cache (`getOrFetch` pattern, 10-min default). Single instance shared across all commands and the autocomplete interceptor; first call warms the cache for all subsequent calls within the window.
- [x] **`MetaVgcAutocompleteInterceptor`** — combined interceptor handling `regulation` (existing logic), `pokemon`, `pokemon2`, `pokemon3`; sorted by prefix-match first then usage %; returns `speciesId` as value; backed by `MetaCacheService`.
- [x] **`MetaPokemonDto`** — `pokemon` field gets `autocomplete: true`; `MetaCoreDto` and `MetaCompareDto` added.
- [x] **`meta-pokemon.command.ts`** — switched to `MetaVgcAutocompleteInterceptor` + `MetaCacheService`; overview page now includes top 3 teammates.
- [x] **`meta-teammates.command.ts`** — synergy tier emojis on each result (🔑 ≥35% · 💪 ≥20% · 👍 others); uses cache; switched to combined interceptor.
- [x] **`meta-top.command.ts`** — uses `getUnifiedUsageList` (correct for all sources); uses cache.
- [x] **`/vgc core`** — finds bidirectional synergy pairs from top-30 pool: for each pair (A, B) where B is in A's teammate list AND A is in B's teammate list, score = average mutual teammate %; returns top 5 pairs with tier badges.
- [x] **`/vgc compare`** — side-by-side embed: rank, usage %, types, top move/item/tera/teammate for both Pokémon; uses cache for both detail lookups.
- [x] **`/vgc explain`** — role inference from moveset (`SUPPORT_MOVES`, `PIVOT_MOVES`, `PROTECT_MOVES` sets); usage tier label; item notes from `ITEM_NOTES` map; best partner from teammates list.
- [x] **`getChampionsDetail()` fix** — merges paste detail into usage-list entry so `moves`/`items`/`abilities`/`spreads` are populated for Champions regulations.
- [x] **`getUnifiedUsageDetailList(regulationId)`** — new facade method returning full `PokemonUsageDetail[]` for a regulation (used by `/vgc core`).

#### Architecture Note

The combined `MetaVgcAutocompleteInterceptor` replaces `MetaRegulationAutocompleteInterceptor` on all commands that have Pokémon parameters. Commands with only a `regulation` param (`/vgc top`, `/vgc core`, `/vgc regulations`) keep using the simpler single-field interceptor.

---

### Phase 8 — Coaching & Insight Layer _(Complete)_

**Goal:** Transform the `/vgc` bot into a hands-on team-building advisor — analyze user-provided teams, identify weaknesses, evaluate individual matchups, and surface prep guides.

#### Changes Made

- [x] **`meta-team-utils.ts`** — shared utility module:
  - Hardcoded defensive type chart (`DEFENSE_CHART`) for all 18 types (only non-1× values stored).
  - `getEffectiveness(atkType, defTypes)` — multiplies across dual types; returns 0 for immunities.
  - `analyzeWeaknesses(team)` — for each attacking type, counts double/quad hits across 6 Pokémon; returns sorted `WeaknessResult[]`.
  - `detectArchetype(slots)` — detects Trick Room, Tailwind, Rain, Sun, Sand, Snow (ability + move), Psyspam (≥2 Pokémon with Expanding Force / Future Sight), Hyper Offense (≥4 HO items), Balance (fallback).
  - `analyzeRoles(slots)` — returns `{ present, missing }` for Speed Control, Fake Out, Redirection, Wide Guard, Encore, Intimidate.
- [x] **`MetaVgcAutocompleteInterceptor`** — `POKEMON_FIELDS` extended with `'your'` and `'vs'` for matchup autocomplete.
- [x] **`MetaAnalyzeDto`** — `regulation` + `paste` (raw string, no autocomplete).
- [x] **`MetaMatchupDto`** — `regulation` + `your` + `vs` (all autocomplete).
- [x] **`/vgc analyze`** — `MetaAnalyzeCommand`:
  - `resolvePaste()` helper: detects `pokepast.es/{id}` URL → fetches `pokepast.es/{id}/json`, falls back to raw text.
  - `parsePasteMeta()` parses slots; each species is looked up in the regulation's usage entries for rank + types.
  - 3-page paginated embed: Team Overview (6 Pokémon with emoji types, rank, usage%, archetype), Weaknesses (bar chart style with quad-hit callouts), Roles & Gaps (present/missing role checklist).
  - Uses `MetaRegulationAutocompleteInterceptor` (paste param is free-text, not autocompleted).
- [x] **`/vgc matchup`** — `MetaMatchupCommand`:
  - `bestOffensive(atkTypes, defTypes)` — best STAB effectiveness from the attacker's types.
  - Single embed with direction labels, icon badges (🚫/🔥/✅/🛡️/➖), both Pokémon's meta rank.
  - Uses `MetaVgcAutocompleteInterceptor`.
- [x] **`discord.module.ts`** — `MetaAnalyzeCommand`, `MetaMatchupCommand` registered as providers.
- ~~`/vgc prep`~~ — removed (was a combination of `/vgc top` + `/vgc core`).

#### Design Notes

- Type weakness analysis uses hardcoded chart rather than `@pkmn/sim` `damageTaken` — avoids format-specific Dex coupling for Discord-layer analysis.
- Tera type changes are explicitly excluded from weakness analysis (noted in embed footer).
- The archetype detector is additive: a Rain + Trick Room team shows both archetypes.
- `/vgc prep` reuses the same `findTopCores()` bidirectional pair logic from `/vgc core` (copy, not extracted — keeps commands self-contained).

---

### Future — RK9 Regionals Pairings (Low Priority)
- [ ] RK9 event scrape (`rk9.gg/event/{id}`)
- [ ] RK9 pairings scrape (`rk9.gg/pairings/{id}`)
- [ ] Display upcoming tournament pairings (companion feature, not meta aggregation)

### Future — Personal Integration
- [ ] Join meta usage data with user's own tracker `opponentTeam` records
- [ ] "You vs the meta" overlays in `SessionStatsView`

### Future — UX Hardening Slice (Deferred)
- [ ] Remember last Tournament sub-view per user (`aggregate`/`players`/`divergence`) and restore on next visit
- [ ] Add personal sample-size confidence indicators (`low`/`medium`/`high`) next to personal deltas
- [ ] Add quick actions for high-delta rows in v1 (copy note / export row / open speed tools)
- [ ] Add public freshness strip in meta UI (latest Smogon month + latest tournament import timestamp)
- [ ] Show full section jump chips by default in mobile detail view

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
- Header is on **row 3**; rows 1–2 are metadata. Data starts row 4.
- The header cell `"Replica Code\n(Click text for image)"` contains an embedded newline — a full RFC-4180 parser (not line-split) is required.
- **Confirmed column layout** (0-indexed): Team ID=0, Full Name=3, Pokepaste=24, Date Shared=29, Tournament/Event=30, Rank=31, `Pokemon Text for Copypasta`=37, species 1–6 @ cols 38–43, Team ID repeated @ col 44.
- Species names come from the 6 columns **immediately after** `Pokemon Text for Copypasta` (the column itself is empty per row).
- Team ID format: alphanumeric, ≤16 chars (e.g. `PC514`). The column repeats at the end of each row — `indexOf` correctly returns the first (col 0) occurrence.

---

### Pokepaste JSON API

**URL:** `https://pokepast.es/{id}/json`  
CORS open (`*`), ~1.3 KB, no auth, no rate limiting observed.  
Fields: `{ author, notes, paste, title }` — `paste` feeds into `parsePasteMeta()`.

---

### Limitless TCG

**REST API base:** `https://play.limitlesstcg.com/api`  
**Tournaments list:** `GET /tournaments` — JSON array of all tournaments.  
**Tournament details:** `GET /tournaments/{id}/details` — name, date, format, player count.  
**Standings:** `GET /tournaments/{id}/standings` — full JSON array, no CORS issues.  

Each standing object:
```ts
{
  player: string;       // slug used in player URLs
  name: string;         // display name
  placing: number | null;
  record: { wins, losses, ties };
  drop: number | null;
  decklist: Array<{
    id: string;         // Showdown slug (e.g. "rotom-wash", "ninetales-alola") ← use this for name resolution
    name: string;       // display name (e.g. "Wash Rotom", "Alolan Ninetales") ← do NOT use for species lookup
    item: string;
    ability: string;
    attacks: string[];
    tera: string | null;
  }> | null;
}
```

**Important:** the API returns only item / ability / attacks / tera — **no EVs, natures, or levels**. The `raw_text` stored in `vgc_pastes` is a minimal Showdown paste generated by `decklistToText()` (name @ item / Ability / Level: 50 / Tera / moves).  
**Name resolution:** always use `entry.id` via `Dex.species.get(entry.id)` — NOT `entry.name`. The `id` field already follows Showdown slug conventions.  
**Rate limit:** `LIMITLESS_RATE_LIMIT = { requests: 50, windowMs: 5 * 60 * 1000 }` (confirmed from response headers).

---

### RK9 (Future — Low Priority)
`https://rk9.gg/event/pokemon-euic-2026` / `https://rk9.gg/pairings/{id}`  
Pairings companion feature only. Not meta aggregation.

---

## SOLID Conventions

These rules apply to all code inside `apps/api/.../vgc/meta/` and `apps/web/.../vgc/meta/`.

### Single Responsibility

- Each NestJS service owns one concern: `SmogonService` = Smogon fetch/parse, `VgcPastesService` = Champions CSV import + aggregation, `LimitlessService` = Limitless import + aggregation, `PokepasteService` = pokepast.es fetch/cache.
- Frontend hooks follow the same principle — one concern per file (data fetching or navigation, never both). See the hook table in the Architecture section.
- `MetaLayoutClient` is a **pure composition layer** only — no `fetch`, no `useEffect`, no business logic.

### Open/Closed

- **Format ID labels**: add new entries to `apps/web/.../meta/constants.ts` (`FORMAT_LABELS`). Components fall back to the raw ID automatically — no component change required for new formats.
- **Champions regulations**: add new entries to `champions-data.ts`. Zero other files need to change.
- **Cutoffs**: the static list `[1760, 1630, 1500, 0]` lives in `FormatBar.tsx` (`VALID_CUTOFFS`). Update there only.

### DRY — Shared Utilities

| File | Exports | Consumers |
|------|---------|-----------|
| `meta/utils/dex-resolver.ts` | `getDexForFormat(formatId?)`, `resolveSpeciesId(name, dex)`, `toBaseFormId(speciesId, dex)` | SmogonService, VgcPastesService, LimitlessService, DivergenceService |
| `meta/utils/parse-usage-txt.ts` | `parseUsageTxt(txt)` | SmogonService |
| `meta/utils/parse-moveset-txt.ts` | `parseMovesetTxt(txt)` | SmogonService |
| `meta/services/parse-paste-meta.ts` | `parsePasteMeta(paste)` | PokepasteService, LimitlessService |
| `meta/constants.ts` (frontend) | `FORMAT_LABELS` | MetaLayoutClient |

**Rules:**
- Never call `Dex.species.get()` directly in a service — always go through `resolveSpeciesId(name, dex)`.
- Never call `Dex.forFormat()` directly in a service — always go through `getDexForFormat(formatId)`.
- Never call `initChampionsMod()` directly in a service — it is owned by `dex-resolver.ts`.
- When joining species data across formats (e.g. standard VGC ladder vs Champions tournaments), always normalize with `toBaseFormId(speciesId, dex)` first. Use the format-aware Dex (not the base Dex) so that Champions-only forms like Floette-Mega are visible. Regional/alternate formes must NOT be normalized — only `Mega`, `Mega-X`, `Mega-Y`, `Primal`, and `Eternal`.

### Type Safety

- Narrow `catch (e)` blocks: `const msg = e instanceof Error ? e.message : String(e)`.
- Use type-predicate filters instead of non-null assertions after a `.filter()`:
  ```ts
  // ✅ correct
  .filter((t): t is typeof t & { parsedSlots: string } => t.parsedSlots !== null)
  // ❌ avoid
  .filter((t) => t.parsedSlots).map((t) => t.parsedSlots!)
  ```

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
│   │   └── pokemon-usage.entity.ts           ← PokemonUsageEntry, PokemonUsageDetail
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
| `useSmogonUsage(format, month, cutoff)` | `_hooks/useSmogonUsage.ts` | Fetches full detail list + builds `Map<speciesId, detail>`; skips if `format` is empty |
| `useChampionsRegulations()` | `_hooks/useChampionsRegulations.ts` | Fetches regulations that have imported CSV data |
| `useChampionsUsage(regulationId)` | `_hooks/useChampionsUsage.ts` | Fetches Champions usage list + builds `Map`; skips if `regulationId` is empty |
| `useChampionsPasteDetail(regulationId, speciesId)` | `_hooks/useChampionsPasteDetail.ts` | Fetches move/item/spread detail from paste aggregation; merged over base detail |
| `useLimitlessTournaments(regulationId)` | `_hooks/useLimitlessTournaments.ts` | Fetches tournament list for a regulation; skips if `regulationId` is empty |
| `useLimitlessUsage(tournamentId, regulationId)` | `_hooks/useLimitlessUsage.ts` | Fetches usage list (per-tournament or combined); builds `Map`; skips if no id |
| `useLimitlessPlayers(tournamentId)` | `_hooks/useLimitlessPlayers.ts` | Fetches player standings list; skips if no id |
| `useMetaNavigation({ snapshots, regulations, entries, entriesMap })` | `_hooks/useMetaNavigation.ts` | Encapsulates `buildUrl`, URL-state reading (tab, format, month, cutoff, regulation, tournamentId, view, speciesId), all auto-navigation effects, `detail` derivation, and all navigation handlers. Returns `{ speciesId, detail, view, ...handlers }`. Exports `DEFAULT_CUTOFF` constant. |

`MetaLayoutClient` is a **pure composition layer** — it reads URL params inline (5 lines via `useSearchParams`) only to gate data hooks before calling them, then delegates all navigation logic to `useMetaNavigation` and all data fetching to the four dedicated hooks. No `fetch` calls, no `useEffect`, no `useCallback` inside the component.

**Boffmedia hook convention for this section:** one concern per file — four data hooks + one navigation hook. Do not add routing logic to data hooks or data fetching to `useMetaNavigation`.

`buildUrl()` is tab-aware: Ladder tab preserves `format/month/cutoff`, Champions tab preserves `regulation`; switching tabs resets the species selection.

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
  ├── Tabs: [Stats | Tournament]  (URL: tab= — "stats" is default and omitted)
  │
  ├── Stats tab — two-pane persistent layout
  │     ├── FormatBar: single <select> with optgroups "Smogon" + "VGCPastes · Preview"
  │     │             + month <select> + cutoff <select> (Smogon formats only)
  │     ├── Preview notice banner (amber) when a VGCPastes regulation is active
  │     ├── Left pane: sticky sidebar (md:sticky md:top-0 md:h-screen)
  │     │             ranked list (sprite | rank | name | %) + search
  │     └── Right pane: panel grid per selected Pokémon
  │           Row 1: Moves · Items · Abilities
  │           Row 2: Tera Types · Teammates · EV Spreads
  │     Mobile: sidebar only (no speciesId) ↔ detail only (speciesId set) — back button navigates
  │     URL: /meta?format=gen9vgc2026regi[&month=YYYY-MM][&cutoff=1630][&species=...]
  │
  └── Tournament tab
        ├── FormatBar: regulation <select> + tournament <select> (Combined + individual, date-sorted)
        ├── Sub-tabs: [Aggregate | Players]  (URL: view=)
        ├── Aggregate view: same two-pane layout as Stats (usage list + detail panel)
        └── Players view: StandingsView — standings table with eager team prefetch,
                          expand row → sprite grid + item/tera/moves per slot + Copy Paste button
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

**OQ-D1** Divergence comparison baseline → Smogon vs selected tournament when a tournament is selected; Smogon vs Combined when Tournament selector is `Combined`.

**OQ-D2** Divergence UI placement → keep inside Tournament tab as a third sub-view (`aggregate` / `players` / `divergence`), not a top-level app tab.

**OQ-D3** Personal-vs-meta placement → merge into Divergence view with a mode toggle (`global` / `personal`) so selectors, sorting, and table UX are shared.

**OQ-D4** Initial badge thresholds → `Ladder trap`: ladder >= 10% and tournament <= 5% and delta >= +5 points. `Tournament staple`: tournament >= 10% and ladder <= 5% and delta <= -5 points.

**OQ-D5** Smogon baseline options precedence → honor URL `month`/`cutoff` when present; otherwise default to latest month + `SMOGON_DEFAULT_CUTOFF`.

**OQ-D6** Access model → Global divergence is public; Personal divergence mode requires authenticated user context.

**OQ-UX1** Onboarding model → Lightweight onboarding (one-time dismissible context panel + contextual tooltips) instead of a full guided tour.

**OQ-UX2** Mobile priority → Optimize for fast scan first (compact ranked list), then deep detail (full-screen detail flow with sticky mini-header and sectolion jumps).

**OQ-UX3** Divergence discoverability default → remember the last Tournament sub-view per user instead of forcing `aggregate` on every entry.

**OQ-UX4** Personal confidence indicators → yes; show sample-size confidence bands in Personal mode.

**OQ-UX5** Actionability scope → yes; include quick actions for high-delta rows in v1.

**OQ-UX6** Data freshness surface → yes; expose freshness metadata in the public meta UI.

**OQ-UX7** Mobile detail shortcuts → include full section jump chips by default.

---

## Open Questions

### UX / Product Prioritization

*(All resolved — none pending.)*

### Historical (Resolved)

**OQ-L1** Import scope → Admin sets `maxPlayers` per import (optional; no limit = all players).  
**OQ-L2** Background model → Background job; admin polls status in admin panel (running / done / error + progress bar). `POST` returns `{ jobId }` immediately.  
**OQ-L3** Format association → Admin manually picks the regulation when submitting the URL. No auto-detection.  
**OQ-L4** Tournament tab UI → Two sub-tabs: **Aggregate** (usage table + detail panel) and **Players** (standings + team browser).  
**OQ-L5** Tournament selector → One at a time; "Combined [Reg]" appears as a special pill pinned above individual tournament pills.  
**OQ-L6** Re-import → Always full re-scrape (idempotent). Same `player_slug` = overwrite `paste_id`.  
**OQ-L7** Record weighting → Store all players + records; aggregation uses raw usage count (no weighting). Record available for future filtering.  
