# Boffmedia Component Tree

## `components/boffmedia/` — Current design system (in progress)

Graphite/steel/orange design. Tailwind-first, consuming the global tokens
(`--bg`, `--panel`, `--line`, `--accent`, `--text`/`--muted`/`--dim`, `--cut`,
display/body/mono fonts) defined in `app/globals.css`. Replaces the `boffmedia-v2`
tree page-by-page.

**Conventions** (full detail in `docs/BOFFMEDIA_V3.md` → "System conventions"):
import primitives from the barrel (`@/components/boffmedia/primitives`); mark v3
page roots with `data-ds="boffmedia"` to get the base heading treatment for free;
use the `cut`/`cut-corner`/`cut-tag`/`wrap`/`mono-label` classes instead of raw
clip-path/container utility stacks; fire notifications with the `toast()` primitive
(never react-toastify inside Boffmedia routes); JS hooks are `data-*` attributes,
never marker classes.

### `primitives/`

| File | Exports |
|---|---|
| `icon.tsx` | Icon, ICON_NAMES |
| `button.tsx` | Button |
| `icon-button.tsx` | IconButton |
| `avatar.tsx` | Avatar, AvatarGroup |
| `badge.tsx` | Badge |
| `chip.tsx` | Chip |
| `kicker.tsx` | Kicker |
| `stat.tsx` | Stats |
| `third.tsx` | Third |
| `rank-row.tsx` | Rank, RankRow |
| `ticker.tsx` | Ticker |
| `clock.tsx` | Clock |
| `count-up.tsx` | CountUp |
| `input.tsx` | Input, Textarea, INPUT_BASE |
| `field.tsx` | Field |
| `select.tsx` | Select |
| `toggle.tsx` | Toggle |
| `checkbox.tsx` | Checkbox |
| `radio-group.tsx` | RadioGroup |
| `slider.tsx` | Slider |
| `kbd.tsx` | Kbd |
| `banner.tsx` | Banner |
| `divider.tsx` | Divider |
| `icon-box.tsx` | IconBox |
| `skeleton.tsx` | Skeleton |
| `progress.tsx` | Progress |
| `ring.tsx` | Ring |
| `tooltip.tsx` | Tooltip |
| `pagination.tsx` | Pagination |
| `tabs.tsx` | Tabs |
| `seg.tsx` | Seg |
| `panel.tsx` | Panel |
| `data-list.tsx` | DataList |
| `chip-group.tsx` | ChipGroup |
| `option-group.tsx` | OptionGroup, OptionCard |
| `disclosure.tsx` | Disclosure |
| `empty.tsx` | Empty |
| `ph.tsx` | Ph |
| `code-block.tsx` | CodeBlock |
| `search-input.tsx` | SearchInput |
| `crumbs.tsx` | Crumbs |
| `table.tsx` | Table |
| `menu.tsx` | Menu, Dropdown |
| `toast.tsx` | ToastStack, toast (+ `toast.success/error/warn/info`) |
| `modal.tsx` | Modal |
| `popover.tsx` | Popover |
| `spinner.tsx` | Spinner |
| `auth-provider-btn.tsx` | AuthProviderBtn — OAuth provider button (brand fill for Discord/Steam, neutral Google; `soon` = muted-but-clickable) |
| `password-field.tsx` | PasswordField — Input with show/hide eye toggle (`aria-pressed`) |
| `index.ts` | barrel — `import { Button, Panel, … } from "@/components/boffmedia/primitives"` |

### `ui/`

| File | Exports |
|---|---|
| `layout/TopBar.tsx` | TopBar |
| `layout/Footer.tsx` | Footer |
| `layout/Marquee.tsx` | Marquee |
| `layout/SectionHead.tsx` | SectionHead |
| `navigation/Navbar.tsx` | Navbar |
| `navigation/NavDropdown.tsx` | NavDropdown |
| `navigation/LangSwitcher.tsx` | LangSwitcher |
| `navigation/NotifMenu.tsx` | NotifMenu |
| `navigation/AccountNav.tsx` | AccountNav (desktop) + MobileAccount — session-aware auth slot: account menu (avatar + `/perfil` + `signOut`) when signed in via `useBoffSession`, login/register buttons otherwise |
| `navigation/nav-data.ts` | PRIMARY_NAV, buildToolsSections (derived from `@/data/games` — single source of truth with the hub/sidebar), buildComunidadSections, FOOTER_COLS, FOOTER_SOCIAL (labels are `nav.v3.*` i18n keys) |
| `landing/LandingPage.tsx` | LandingPage — active home page (`(boffmedia)/page.tsx`), «Travesía» concept, orchestrator only |
| `landing/landing-data.ts` | TV3_ZONES, TV3_STOPS, TV3_HUD, TV3_TOOLS, TV3_FEATS, TV3_EVENT(_TS), TV3_GAMES, TV3_FEED, DISCORD |
| `landing/landing-shared.tsx` | PRI_GLOW, GLARE, HUD_FRAME, LINE_MASK, LINE_INNER, BEAMS, CTA_ROW, CTA_MONO, Grain, tvGoTo, TvCountdown |
| `landing/landing-hooks.ts` | useTvMouseVar, useTvParallax, useJourney |
| `landing/TvHero.tsx` | TvHero |
| `landing/TvCP.tsx` | TvCP — journey checkpoint shell |
| `landing/TvMinimap.tsx` | TvMinimap |
| `landing/TvMeta.tsx` | TvMeta — final CTA |
| `landing/stops/*.tsx` | TvTools, TvSmartRotom, TvTorneos, TvJuegos, TvComunidad — one file per checkpoint |
| `landing/travesia-fx.tsx` | FxProgress, Scan, Decode, FxParticles, FxCursor, useSignalFX |
| `tools/tools-data.ts` | HUB_SLUGS, buildHubGame(s), buildCategory, hueColorOf, hueStyle, HubGame/ToolCardData/CategoryData/ExtLinkData types — adapter merging `@/data/games` + `@/data/hub` + i18n (namespaces come from `hubConfig.toolNs/extNs/headerNs`, no slug special-casing) |
| `tools/ArtImage.tsx` | ArtImage — key-art/icon `next/image` with graceful fallback (owns the broken-image behavior) |
| `tools/GameLogo.tsx` | GameLogo — game seal in its hue |
| `tools/ToolCard.tsx` | ToolCard — «fila» tool card (hue rail, icon, title/desc, badges) |
| `tools/ToolGrid.tsx` | ToolGrid — responsive card grid shared by hub + category landings |
| `tools/TxSection.tsx` | TxSection — accent-barred section block with mono count (wraps on mobile) |
| `tools/VideoHero.tsx` | VideoHero — hub hero with looping bg video + scanlines + scrim (`motion-reduce` falls back to poster/surface) |
| `tools/ToolShell.tsx` | ToolShell + Bleed — v3 tool-page shell: collapsible+pinnable `SideRail` (72px→264px, hover/focus overlay, hue-active) with `GameSwitch` header, mobile off-canvas drawer. Mounted by per-game server layouts (`(herramientas)/<game>/layout.tsx`); full-bleed routes come from `ToolEntry.bleed` in `@/data/games`. Owns the `--pad-x`/`--pad-y` content padding; `Bleed` escapes it (no-op outside the shell). |
| `tools/CategoryLanding.tsx` | CategoryLanding + `GameBanner` (real key-art), `FeaturedTool` (real art), `ExtLinks` (all three now **exported** for the showcase) — the `/pokemon /minecraft /mhwilds /otros` landing body, rendered inside ToolShell |
| `tools/index.ts` | barrel for the above |
| `auth/AuthScreen.tsx` | AuthScreen — `/entrar` login/register screen (grid-glow stage + card), wired to NextAuth (credentials `boffmedia` + Google; Discord/Steam disabled); `?mode=register` + in-card toggle |
| `auth/CredentialsForm.tsx` | CredentialsForm — RHF+zod email/password form (keyed per mode); register → `UsersService.createUser`, login → `signIn` |
| `auth/index.ts` | barrel for `ui/auth` |
| `profile/ProfileHero.tsx` | ProfileHero — cover band + lower-third identity (avatar w/ upload buttons, name, handle, tags, optional quick metrics, `live` flag) |
| `profile/AccountForm.tsx` | AccountForm — controlled name/email(/bio) grid (`useTranslations`) |
| `profile/LinkedAccounts.tsx` | LinkedAccounts, LinkedAccountRow — linked-account rows w/ brand hue + linked/unlinked states |
| `profile/StatTile.tsx` · `RankInsignia.tsx` · `RankStrip.tsx` | career stat tiles + rank insignia (showcase-only; no per-user stats API) |
| `profile/TrophyCase.tsx` · `ActivityFeed.tsx` · `TourLive.tsx` · `ProfileNote.tsx` | trophy case, activity timeline, live-tournament banner, public-view note (showcase-only; no API — see `docs/BOFFMEDIA_V3_DEFERRED.md`) |
| `profile/profile-data.tsx` | DEMO_STATS/RANK/TROPHIES/ACTIVITY/TOUR + types — showcase demo data only |
| `profile/index.ts` | barrel for `ui/profile` |
| `events/EventCard.tsx` | EventCard — event card, **rebuilt to handoff** (grid + `layout="list"`; hue rail + type watermark, status chip, kind, countdown, seal, participant count, organizer row); links to `/eventos/[id]`. Deferred: `participants`/`organizer`/`hue` |
| `events/Countdown.tsx` | Countdown — live D/H/M countdown to a date (`compact`); used by EventCard/EventBanner |
| `events/EventOrganizer.tsx` | EventOrganizer — who runs the event (boffmedia · coorg · platform, dual seal); `inline` for cards, `block` for the detail aside |
| `events/GameCard.tsx` | GameCard — game card, **rebuilt to handoff `JuegoCard`** (hue tint + scanlines + glyph + seal + short + events/players stats); links to `/juegos/[id]`. Deferred: `hue`/`short`/`events`/`players` |
| `events/GameHero.tsx` | GameHero — full-bleed game header, **rebuilt to `ev-hero`** (art bg + scan + glyph + seal/short/badge flags + stats bar), `children` for actions; **extracted from `GameDetailView`**. Deferred: `hue`/`short`/`players`/`liveCount` |
| `events/EventBanner.tsx` | EventBanner — full-bleed event header, **rebuilt to `ev-banner`** (art bg + scan + glyph + status/countdown/seal/organizer flags), `children` for join/share; **extracted from `EventDetailView`**. Deferred: `organizer`/`hue` |
| `events/EventStatusChip.tsx` | EventStatusChip — active/upcoming/completed status pill |
| `events/AchievementItem.tsx` | AchievementItem — achievement/medal row w/ rarity colour (shared by event detail + `/logros`) |
| `events/events-util.ts` | eventStatus, formatEventDate, dayMonth, EventLike/EventStatus types |
| `events/index.ts` | barrel for `ui/events` |
| `legal/LegalDoc.tsx` | LegalDoc — legal document: sticky scroll-spy TOC + numbered sections (paragraphs + bullet lists) |
| `legal/index.ts` | barrel for `ui/legal` |

### `hooks/`

| File | Exports |
|---|---|
| `use-reveal.ts` | useReveal |
| `use-dismiss.ts` | useDismiss — shared outside-click + Escape dismissal (Popover, Menu, NotifMenu, GameSwitch) |

**Status:** Foundation (tokens/fonts/Tailwind) ✅ · System conventions (base heading styles via `data-ds`, `cut*`/`wrap`/`mono-label` classes, primitives barrel, unified `toast()`) ✅ · App shell (Navbar + Footer, wired into `(boffmedia)/layout.tsx`) ✅ · Landing home page — «Travesía», split into per-section files ✅ · Base component kit (49 primitives above incl. Modal/Popover/Spinner + auth kit) + component showcase ✅ — routed at `styles/components/page.tsx` (`/styles/components`, linked from footer «Componentes»), covering the **Sistema** domain across five chapters: **Bases** (color/tipografía/geometría), **Primitivas** (botones · chips y badges · formularios · **acceso** · selección y rango · navegación · dropdown de nav · sesión e idioma · pie de página · menús y avisos · anillo y carga · tooltip y teclas · scrollbar), **Patrones** (paneles · datos · estados), **Movimiento** (niveles de FX · marquesina · contador y decode · cursor e imán), **Perfil** (identidad · rango y stats · vitrina · actividad · cuenta y enlaces · torneo en curso).
The showcase demos Modal + Popover (menús y avisos) and Spinner (anillo y carga); the nav/shell pieces via real components (`NavDropdown` with a new `demoOpen` prop, `LangSwitcher`, `NotifMenu`, `Footer`); the scrollbar via the global `--sb-*` tokens + `bm-scroll`; and the FX layer (`Marquee`, `CountUp`, `Decode`, `useSignalFX` glare/tilt/magnet). It is fully responsive: the `230px 1fr` index/main shell collapses to one column below `lg` (index becomes a bounded, non-sticky block), the chapter pager wraps, and wide specimens (spacing scale, `Stats`, `Table`, the open `NavDropdown` panel) scroll in their own `overflow-x-auto` containers. Two primitives gained shrink fixes that also benefit real pages: `Third` (added `min-w-0` so its title truncates in constrained grids) and `Table` (now wrapped in an `overflow-x-auto` container with `min-w-[420px]`). The superseded demo routes `styles/components_v2`, `styles/showcase_v2`, `styles/colors` were removed.
**Showcase mirror to the handoff (shared batch, 2026-07-08):** the showcase index now follows the handoff `SC3_SECTIONS` order across **three domains / nine chapters**: **Sistema** (Bases · Primitivas · Patrones · Movimiento), **Herramientas** (Hub de herramientas · Datos en vivo) and **Plataforma** (Juegos y Eventos · Perfil · Legal). Order drift fixed: `acceso` moved after `pie` (matching the handoff), `Perfil` moved out of Sistema into **Plataforma** (after Juegos y Eventos). New chapters demo the already-built **shared** kits: **Hub de herramientas** (`TxSection`/`ToolCard`/`ToolGrid`/`GameLogo`/`VideoHero`/`GameBanner`/`FeaturedTool`/`ExtLinks` via `buildCategory("pokemon")` + a framed live `ToolShell`), **Datos en vivo** (the `datakit`: `DkApp`/`DkBar`/`DkBody`/`DkTitle` chassis + `DkSprite`/`DkTeam`/`DkTable`/`DkSeg`/`DkSearch`/`DkSelect`/`DkChip`/`DkStat`/`DkSplit`/`DkBarList`/`DkType`/`DkCopy`/`DkTrend`/`DkHeat`/`DkEmpty`/`DkSkel`/`DkSkelList`), **Juegos y Eventos** (`GameCard`/`GameHero`/`EventCard`/`EventStatusChip`/`GameLogo` seal/`EventBanner`/`AchievementItem` + `RankRow`/`Rank` podium — `GameHero`+`EventBanner` newly **extracted** from the detail views) and **Legal** (`LegalDoc`, framed). Fixed the missing `pokemon.tools.battlesim.*` i18n (es+en) that errored on the real `/pokemon` too. Still not showcased (route-local kits, next batch): Calculadora · Battlesim `bx-kit` · Sorteo rápido · Claves `kv-kit` · Schematic `sch-kit` · TCG Pocket `tcgp-kit` · Wonder Mail `wm-kit` · Planificador MH `mh-kit`.
**Phase 3 (in progress):** ✅ auth — v3 auth kit (`AuthProviderBtn`/`PasswordField`, `steam`+`camera` icons) + `/entrar` login/register wired to NextAuth, session-aware `AccountNav`. ✅ profile — `/perfil` rebuilt on v3 (real identity/avatar-upload/account-form/linked-accounts), full profile set demoed in the showcase **Perfil** chapter; deferred no-API sections in `docs/BOFFMEDIA_V3_DEFERRED.md`. ✅ ranking — `/clasificacion` global leaderboard from real `useGetLeaderboards`. ✅ events — `/eventos` + `/eventos/[id]` (real `useGetEvents`/achievements/leaderboard/join) via shared `ui/events/` kit; `/logros` global achievements catalogue; `/juegos` + `/juegos/[id]`; `/calendario` agenda; `/eventos/sugerir` v3 suggest-event form (real `useGetGames` on the game field; client-side submit — no suggest endpoint yet, see deferred doc). **The whole `(eventos)` group is now on v3.** ✅ community — `/community` real-data hub (nav re-pointed from `/eventos`). ✅ legal — `/privacidad /terminos /cookies` via `ui/legal/LegalDoc`. ✅ landing — `TvTorneos` next-event wired to real `useGetEvents`. Remaining Phase 3: none blocking — leftover no-API items (community forum, landing HUD/FEED, notifications, tournament brackets, suggest-event submission) tracked in `docs/BOFFMEDIA_V3_DEFERRED.md`.

**Phase 4 (tool migrations, in progress):** ✅ **VGC damage calculator** (`pokemon/vgc/damage-calculator`) — full rebuild. Route-local extracted UI kit `_components/ui/` (16 components porting `calc.css` → Tailwind, wired to real data: `TypeBadge`/`PokemonSprite`/`Combobox`/`NumberStepper`/`controls`/`TogglePill`/`KoVerdict`/`DamageBar`/`HpGauge`/`StatEditor`/`MiniCard`/`RoleTag`/`Callout`/`CopyButton`/`SideDrawer` + `theme`) + views `_components/` (`CombatView`/`MatrixView`/`SpeedView`/`TypesView` + `PokemonPanel`/`FieldPanel`/`MoveRow`/`VersusStrip`/`FieldBar`/`TeamSlots`/`MatrixGrid`/`SavedDrawer`); the calculator is the tool page (full-height shell + `Tabs`). Real engine only (`calculatorStore`/`smogonAdapter`/`useLegalPokemon`/`useGameData`/`calcStat`); shared `_lib/typeChart.ts`+`speedCalc.ts`. All v2 calc components deleted. ✅ **VGC tracker** (`pokemon/vgc/tracker`) — full rebuild on the new shared **`ui/tools/datakit/`** kit (see above). 5 views on the full-height dk-app shell (`bleed: true`), wired to the **real** IndexedDB CRUD (`useVgcDb`/`computeSessionStats`/`usePokemonSearch`/`parseShowdownPaste`/export-import/CSV): home, session detail (matches/stats tabs + tournament series/round filter), stats dashboard (8 handoff sections), and the match + BO3-series **editing** workspaces. Tracker-local kit `_components/ui/tr-ui.tsx` (`TrResult`/`TrBrought`/`TrSprite`/`TrPanel`); editing panels (`TeamPanel` pool/assignment editor, `SpeedTierWidget`, `NotesPanel`, `PokemonAutocomplete`, `SeriesNotesPanel`) + CRUD dialogs (`NewSessionDialog`/`PresetManager`/`DuplicateSessionDialog`/`ExportImportDialog`) restyled to v3; 11 recharts-era stats sub-components deleted. Session-comparison + regulation-meta stats panels deferred. ✅ **VGC meta** (`pokemon/vgc/meta`) — full rebuild on the datakit (`bleed: true`), master–detail over the **real** data layer (Smogon ladder `useSmogonUsage` + Limitless tournament `useLimitlessUsage`/`useLimitlessPlayers`/`useDivergence`, on-demand team fetch, `useSpeciesTeams`); URL-state + auto-nav preserved (`useMetaNavigation`, drill-in ≤980). Route-local `_components/`: `VgcToolbar` (DkBar) / `VgcSubbar` (DkSub) / `MvList` (usage ranking) / `MvDetail` (species card grid: base stats · moves · items · abilities/teras · partners · EV spreads · featured teams) / `MvTeams` (`MvTeamGrid`+`MvTeamRow`) / `MvPlayers` (standings) / `MvDivergence` + `MvBits` (`MvType`/`MvSpread`/`MvBaseStats`/`MvCard`); shared VM in `_lib/meta-types.ts`. The whole v2 `boffmedia-v2/ui/vgc/meta/` folder deleted. Strings localized (`vgc.meta.*`, es+en). ✅ **VGC speed** (`pokemon/vgc/speed`) — full rebuild on the datakit (`bleed: true`), no handoff (migrated for family consistency). Tiers + Matchup tabs behind a `DkSeg`; route-local kit `_components/SpdKit.tsx` (`SpdPanel`/`SpdInput`/`SpdMonSearch`/`SpdModifiers` + zone helpers); `SpeedTiersTab` (sortable `DkTable`, zone colouring, expandable EV breakdown, send-to-matchup) + `SpeedMatchupTab` (opponent vs editable team, per-member mods, result badges). Real engine (`speedCalc.ts`, Champions speed-tiers API) untouched; framer-motion + v2 primitives dropped, orphan `ModifierPanel` deleted (`SpeedFlagChips` kept for the tracker). ✅ **TCG Pocket** (`pokemon/tcgpocket`) — full rebuild on a route-local kit `_components/tcgp-kit.tsx` (`TcgTypePip`/`TcgRarityMarks`/`TcgCardFace` (real card art + CSS-placeholder fallback)/`TcgCardGrid`/`TcgSetProgress`/`TcgPackTile`/`TcgStatTile`/`TcgRing`/`TcgBar`/`TcgOddsTable`/`TcgCardDrawer`) under one shell `TcgpApp` (brand header + icon tabs + global search + drawer), with `_lib/` data hooks (`useTcgpCards` memoized card DB · `useCollection` session-user editable / username read-only · `useBestPack` · `tcgp-maps`). Four views `_components/`: `PanelView` (collection ring + stat tiles + progress-by-set + gallery search + activity), `CartasView` (multi-filter browser + pagination + drawer), `ColeccionView` (collapsible per-set editor groups + save bar + best-pack odds table + activity), `SobresView` (per-set pack tiles → real per-booster card grids). `bleed: true`; the four rail entries mirror the tabs. Wired to the **real** `PtcgpService` (grouped cards, per-user collections add/update/remove, `/best-pack`, recent-updates) + real card/pack art. Legacy `galeria*` routes redirect to `coleccion`; whole v2 component set + `useGalleryData` deleted, framer-motion dropped. **Combates deferred** (no backend) → localized "coming soon" route. Strings `tcgpocket.app.*` (es+en). ✅ **BattleSim** (`pokemon/battlesim`, `bleed: true`) — **Phase A (Foundation + Lobby)** landed: `_components/BsimApp.tsx` (chassis reusing the datakit `DkApp`/`DkBar`/`DkBody`/`DkTitle`/`DkBack`/`DkSeg` with in-app Lobby·Equipos·Repeticiones nav) + `_components/LobbyView.tsx` (Tailwind port of the handoff console: mode pills IA/PvP/Showdown + real AI random-battle format `DkSelect` + launch, quick-access tiles) + `_lib/bsim-data.ts`. Launches **real** battles by navigating to the existing `/battlesim/{play,pvp,showdown}` routes (interim until Phase B) + `/clasificacion`; Equipos/Repeticiones show localized placeholders. Old `/battlesim` hub → 307 redirect. The real engine/sockets/DB stay untouched. **Phase B1 (Bx HUD kit)** landed: route-local `_components/ui/bx-kit.tsx` (18 components — `BxType`/`BxTypeRow`/`BxCat`/`BxStatus`/`BxBoost`/`BxTera`/`BxHp`/`BxPlate`/`BxKey`/`BxBench`/`BxTeraBtn`/`BxRing`/`BxTick`/`BxLog`/`BxScore`/`BxOrder`/`BxField`/`BxSpark`/`BxKbd`), a Tailwind port of the handoff `bx-*` primitives consuming the **real** `useBSXLayout`/`toBSXMon` shapes 1:1 (no adapter); helpers in `_lib/bx-helpers.ts`; sprites via shared `spriteUrl`/`DkSprite`; keyframes `bm-hitflash`/`bm-blink`. **Phase B2 (wire the HUD)** landed: the shared battle HUD under `app/battlesim/_components/` (`BattleHeader`/`BattleStage`/`BattleActionDock`/`BattleLogPanel` + `MovePanel`/`SwitchPanel`/`MechanicToggles`, consumed by play/pvp/showdown/replay) now renders the `Bx*` kit against the live `useBSXLayout` output — **public prop signatures unchanged, so the four routes were untouched**. `BSXScorePlate`→`BxScore`, `BSXOrderRail`→`BxOrder`, `BSXKey`→`BxKey`, `BSXBenchChip`→`BxBench`, `BSXTeraBtn`→`BxTeraBtn`, `BSXTick`→`BxTick`, `BSXRing`→`BxRing`, `BSXPlanChip`→inline v3 chip; `BoffActionBar`/`Segmented` → v3 flex bar / `DkSeg`; v2 tokens + `bsx-focus`/`bsx-dock-in` → v3 tokens/`cut`-polys/`bm-*` motion; mega/dyna/Z toggles restyled to the tera-button idiom. Mechanics/aiming/hotkeys/choice-strings preserved. Added `fullscreen`/`exitFullscreen` to the v3 `Icon` set. The kit stays route-local (cross-imported by the still-`/battlesim/*` routes — interim seam until B3). Strings `battlesim.app.*` (es+en). **Phase B3 (relocate + field)** landed: all four battle surfaces now live **under `/pokemon/battlesim/*` inside the ToolShell** on a new v3 `BattleShell` (`_components/BattleShell.tsx`, replacing the v2 `GameStageLayout`): `play` (single-click `?format=` auto-launch), `pvp` + `pvp/battle/[roomid]`, `showdown` + `showdown/battle/[roomid]`, `replay` + `replay/[name]`. Socket/session logic unchanged (pages import shared `_components`/`_hooks`/`_utils` from `@/app/battlesim/_*`); `GameStageLayout`→`BattleShell`, internal hrefs → `/pokemon/battlesim/*`, lobby launch wired via `BSIM_MODES`. **PvP + Showdown lobbies rebuilt on v3 primitives** (Panel/Button/Input/Select/Badge/Spinner, localized `pvp.*`/`showdown.*`). **Field restyled**: `BattleCanvas` `BSXPlate`→`BxPlate` (+`aimed` prop on the kit), turn chip/choice-panel/connecting to v3; `BattleConnectionState`+`LogChatRail` v3. Old `/battlesim/{play,pvp,showdown,replay,…}` → 307 redirects (query + replay-share links preserved). **Phase C (team builder) deferred**: `BattleTeam`/Wingull is an existing SmartRotom Pixelmon feature (`/smartrotom/pc`) — rebuilding it would duplicate it + cross design systems, so the chassis «Equipos» tab links out to `/smartrotom/pc` instead. **Phase D (replays) landed**: the «Repeticiones» tab renders `_components/ReplaysView.tsx` — a v3 list of real DB replays via new `LigaService.getRecentReplays`/`getPlayerReplays` over the existing `/liga/replays/*` endpoints (DkSearch + DkSeg Recientes/Mías, rows → `/pokemon/battlesim/replay/{id}`); the replay **viewer** (`replay/_components/Game`/`ReplayControls`/`ReplayControlsButton`/`ReplayLoader`) restyled to v3 (reuses the v3 `BattleCanvas`/`BattleLogPanel`; added `pause`/`swap` icons). Strings `battlesim.replays.*` (es+en). **Phase E (retire) landed — BattleSim migration complete**: `/battlesim/calc` → 307 `/pokemon/vgc/damage-calculator`, `/battlesim/dex` → 307 `/smartrotom/pokedex` (impl subtrees deleted); the 24 now-unused `boffmedia-v2` v2 render primitives (`BSX*` ×10 + `BS*` ×14) deleted (barrel pruned; only `bsx-data` `BSXMon`/data + `bs-data` `hpColor` kept for the sim engine). ✅ **PMD Sky / Wonder Mail** (`pokemon/pmdsky`, `bleed: true`) — full rebuild on the **v3 «Señal»** spec (`v3/styles/wml.css` `wm-*` design). Full-bleed: sticky title bar (Kicker + display title + `Seg` región US-JP/EU + Aleatorio/Reiniciar) over a centered `1fr / 340–400px` grid — mission builder left, live result ticket right. Route-local kit `_components/ui/wm-kit.tsx` (`WmCombo` searchable combo (port of the calc `cx-combo`) / `WmStars` / `WmSection` numbered card / `WmPokePicker` framed PMD-portrait + combo/lock / `WmTicket` cut-corner result w/ empty·loading·ready via the `CodeBlock` primitive) + data hook `_lib/useWmV3.ts` (status machine · validation issues · summary · randomize/reset). Builder uses `OptionGroup` (quest picker, per-type icons) · `Select`/`Field`/`Disclosure`/`Banner`/`Toggle` primitives. Wired to the **real** engine untouched (`@/tools/pmd-sky/` `store`/`generateWonderMail`/`useSkyFormHandlers` + real quest/dungeon/item/Pokémon data + PMD portrait sprites via `rotomGET`); the handoff's *mock* generator was **not** used. Subtype gate corrected to `hasSubtypes`. Whole v2 UI (`SkyGenerator` + `_components/` sections) deleted; framer-motion/heroicons/boffmedia-old dropped. Brand-accent (orange) identity. Strings `pmdsky.app.*` (es+en). ✅ **Steam Keys** (`otros/keys`, non-bleed `wrap` page inside ToolShell) — full rebuild on the **v3 «Señal»** spec (`v3/styles/keys.css` `kv-*` design). Header (Kicker + display title + total/disponibles/entregadas stat chips) · toolbar (`SearchInput` + `Seg` Disponibles/Todas + sort `Select`) · `kv-card` grid (steam art w/ diagonal-stripe fallback · status + via chips · stock count) · route-local detail **modal** (accent-topped, `Seg` Info/Precio/Media tabs). Route-local kit `_components/ui/kv-kit.tsx` (`KvArt`/`KvStatus`/`KvVia`/`KvCard`/`KvInfo`/`KvPrice`/`KvGallery`/`KeyModal`) + VM `_lib/useKeysV3.ts` (aggregates duplicate keys → stock, search/filter/sort, counts, modal state). Wired to the **real** data layer untouched (`useGetKeys` → Google-sheet `/steamkeys`; `useFetchSteamData` → Steam appdetails `/steamdata/:id`) — the handoff's *mock* KV_KEYS + fabricated review/metacritic were **not** used; the card only shows sheet-backed fields (art/status/via/stock), rich info/price/media appear on open. Whole v2 UI (`KeysTable`/`KeysHeader`/`KeysControls`/`KeysDataTable`/`KeyRow`/`SteamDialog`/`Instructions` + `FloatingSection`) deleted; framer-motion/lucide/shadcn-dialog dropped. Strings `otros.keysApp.*` (es+en). ✅ **Schematic Compat** (`minecraft/schematic-compat`, `bleed: true`) — full rebuild on the **v3 «Señal»** spec (`v3/styles/schematic.css` + `v3/js/v3-schematic*.jsx`, the `sch-*` design). App bar (brand glyph + `Stepper`) over a 3-column body (Setup rail · Diff · 3D preview) + export footer; `data-ds` root, `--nav-h` height. Route-local kit `_components/ui/sch-kit.tsx` ports every `sch-*` piece to v3 tokens: `Stepper`/`CompatMeter` (new «N de M resueltos» readiness ring)/`ScanCard` (env capture)/`DropZone`/`FilterChips`/`ReplaceSelect` (fixed-popover searchable block combo)/`MappingCard`/`AxisSlider`/`BulkRulesSheet`/`ExportBar` + `AssetThumb` + status meta/types. Wrappers restyled to v3 (`SchematicCompatTool` shell, `SetupPanel` via `Disclosure`/`Button`/`Banner`, `EnvPicker`/`FilePicker`/`DiffPanel`/`BlockThumb`/`PreviewPanel`/`ExportBar`). The whole engine is **untouched** — real Comlink worker + parsers/loaders/exporters + rules engine + R3F WebGL `SchematicViewer3D` + Zustand store/`useToolActions`; the handoff's *mock* diff/registry data was **not** used. `CompatMeter` wired to real readiness (safe + auto/manual-resolved over total). Added `cube`/`folder`/`upload` to the v3 `Icon` set. Whole v2 `boffmedia-v2/ui/schematic` primitive set (14 files) deleted. Strings extended (`meter.*`, es+en). **With this the last Minecraft tool is on v3.** ✅ **Sorteos** (`otros/sorteos`, non-bleed page inside ToolShell) — v3 «Señal» shell (`sorteos-rapido.css` `srtq-` picker), **spin animation keeps the original v2 `SpinnerAnimation` as-is** (user decision — old spinner + its tick/win sound preferred; **v3 restyle deferred**, see `docs/BOFFMEDIA_V3_DEFERRED.md`). Header (participants/rondas chips) over a `388px / 1fr` layout: left = add panel (`Seg` Individual · Lista/CSV w/ `Name, 3`/`Name x2` weight parsing) + settings (winner-count stepper · ponderar/sin-repetir toggles) + participant list (inline rename · weight steppers · won state); right = draw stage (blank/idle ready+neon launch → **v2 `_components/spinner/SpinnerAnimation`** spin → single/multi-winner reveal + confetti). Deterministic mulberry32 PRNG + copyable seed (`SrtSeedTag`), weighted multi-winner pick + round history persisted to `localStorage`. Route-local kit `_components/ui/srt-kit.tsx` (`SrtWeight`/`SrtRow`/`SrtWinnerList`/`SrtSeedTag`/`SrtConfetti`/`SrtPanel`) + `_lib/useSorteos.ts`; restored `_components/spinner/*` + `_hooks/useGiveawayAnimation.ts` for the spin. The initial v3 draw rebuild (`SrtReel`/`SrtWheel`/`SrtSpot`/`DrawPick`/mute/`useDrawSound`/`volume`+`mute` icons/`bm-srt-spot`) was **reverted** — in git history only, as the basis for the deferred restyle. Twitch-viewers import omitted (handoff demo); starts empty (no mock names). Keyframe `bm-srt-conf` (confetti). Whole v2 tool UI (`GiveawayControls`/`WinnerDisplay`/`ParticipantsList`+tabs + `boffmedia-old` `PageHeader`/`BoffContainer`) deleted; only the spinner set kept. Strings `otros.sorteosApp.*` (es+en). ✅ **Biblioteca / Catálogo** (`otros/biblioteca`, non-bleed page inside ToolShell) — full rebuild on the **v3 «Señal»** spec (`v3/styles/catalogo.css` `ct-*` vocabulary). The handoff's Backloggd-style backlog tracker has no real backend, so the `ct-*` language was applied to the **real** tool — a server-side ROM-library search. `ct-head` header (Kicker + display title + result KPIs) · search form · manufacturer-grouped **console filter chips** (`ct-pchip`, hue dot per family) · region `Disclosure` (toggles + custom add) · per-console **collapsible result groups** (filename · size · Descargar) · idle/skeleton/empty/error states. Route-local kit `_components/ui/ct-kit.tsx` (`CtChip`/`RegionChip`/`Kpi`/`ConsoleGroup`/`FileRow`/`SkeletonGroup` + `MFR_DOT`/`MFR_ORDER`) + VM `_lib/useBiblioteca.ts`. Wired to the **real** `ScrapeService` untouched (`getLocalGames`/`searchLocalGames`/`getServeFileUrl`) + shared `CONSOLES`; nothing invented. Old v2 `LocalLibrary` deleted (framer/lucide/shadcn dropped); shared `ConsolePicker`/`RegionFilter`/`consoles.ts` kept for the deferred `myrient` tool. Strings `otros.bibliotecaApp.*` (es+en). **All three otros handoffs (keys · sorteos · catálogo) are now on v3; manga/manga-library/myrient have no handoff and are deferred (see `docs/BOFFMEDIA_V3_DEFERRED.md`).** ✅ **MH Wilds** (`mhwilds/tree` + `mhwilds/builds/planner`, both `bleed: true`) — full rebuild on the **v3 «Señal»** spec (`v3/styles/mh.css` `mh-*` design, per-game **emerald** hue reserved via `--mh*` CSS vars on the app root; orange stays for primary actions). Shared route-local kit `_components/ui/mh-kit.tsx` (`MhApp`/`MhBar`/`MhSeal`/`MhModes`/`MhSrc`/`MhPanel`/`MhLabel`/`MhRarity`/`MhElement`/`MhStat3`/`MhResistances`/`MhSharpness`/`MhSkillRow`/`MhCatLegend`/`MhSlot`/`MhDecoSocket`/`MhSlotPips`/`MhMaterial`/`MhMeter`/`MhRing`/`MhSearch`/`MhTypeChip`/`MhItem`/`MhTag`/`MhNodeCard`/`MhDrawer`) + pure `_components/mh-helpers.ts` (emerald+rarity vars, element/sharpness/skill-category metadata, `weaponAttack`/`firstSpecial`). **Weapon tree**: `tree/page.tsx` — pan/zoom canvas (SVG bézier connectors, wheel-zoom-to-cursor, drag, fit) with `MhNodeCard`, per-type chip rail + counts, search/rarity/element filters, upgrade-path highlighting, outline/list view, collection tracking (localStorage), and a detail drawer (attack/element, improves-from/to, crafting/upgrade materials + zenny, «Planificar» link). Wired to the **real** `useWeaponTreeData` (`/tools/mhwilds/weapons/tree`, node = full `WeaponEntity` + `children`). **Build planner**: `builds/planner/page.tsx` → `PlannerView` orchestrator + `PlannerBar` (editable build name + save/open/io/share/reset) + `Loadout` (progress ring + attack/defense header, 8 `MhSlot`s incl. secondary-weapon swap, `MhDecoSocket` sockets) + `Summary` (`sticky` weapon/defense/skills/forge-materials panels: MhStat3 · element · sharpness · resistances · category-tinted skill rows w/ over-allocation banner) + drawers (`EquipDrawer`/`DecoDrawer`/`SavedDrawer`/`IoDrawer`). Reuses the **real** engine untouched (`useGameData`/`useBuildState`/`calculationUtils`/`buildUtils`; `equipment-utils.ts` trimmed to pure helpers). Handoff-only mock features (monster target/bestiary, skill reverse-search, forge-path totals, compare mode) **not** built (no real API). Whole v2 planner UI (`build/`·`equipment/`·`stats/`·`MHWildsPanel`·`utils.ts`) + the old table-tree page deleted; framer-motion/lucide/react-icons dropped from the tool. Keyframes `bm-fade`/`bm-drawer-in`. Strings `mhwilds.app.*`/`mhwilds.tree.*` + new `build_planner.*` (es+en). **With this Phase 4 is complete — every migratable tool is on v3.** Next: Phase 5 (blog & admin).

**Phase 5 (blog & admin):** ✅ **`/admin` panel on v3** (2026-07-08) — the v2 `boffmedia-v2/ui/admin` (`admin-layout` + `admin-crud`) was **deleted** and replaced by the **v3 «Señal»** admin (`admin.css` `av-*` broadcast control-room vocabulary ported to Tailwind + v3 tokens). Route-local kit `app/(boffmedia)/admin/_components/ui/`: `av-kit.tsx` (`AvSectionHead`/`AvPanel`/`AvKpis`+`AvKpi`/`AvPill`/`AvAlert`/`AvLiveDot`/`AvMetrics`+`AvMetric`) · `av-shell.tsx` (`AvShell` — sticky rail + brand seal + grouped nav + `En directo` live-dot top bar + mobile section-tab strip, `data-ds="boffmedia"` root, v3 `IconName` nav) replacing `AdminLayout` · `av-crud.tsx` (`AdminCrud` — generic CRUD on v3 `Modal`/`Button`/`SearchInput`/`Empty`/`Spinner`/`toast`, v3-styled sortable-ready table, create/edit/delete modals; same public API as the old CRUD). The **duplicate `react-toastify` ToastContainer** is gone — admin uses the app-wide v3 `<ToastStack />`. Portal sections (`games`/`events`/`teams`/`achievements`-admin) restyled to `AvSectionHead` + v3 column cells (`AvPill` statuses, `cut-seal` icon boxes); the **4 forms** (Game/Event/Team/Achievement) rebuilt on v3 `Field`/`Input`/`Select`/`Button` (react-hook-form + zod kept, shadcn `Form`/`Dialog` dropped). Admin **tools** rebuilt on the `av-*` kit: `TcgpScraper` (AvPanel + progress pills), `VgcMetaPanel` (`Seg` tabs), `VgcSmogonFetcher`/`VgcChampionsFetcher`/`VgcLimitlessFetcher` (AvPanel/AvAlert/AvPill + v3 Input/Select/Button, real `VgcMetaService`/`PtcgpService` untouched). Wired to the **real** data layer throughout (`EventsService` CRUD, `useGetGames`/`useGetEvents`/`useGetTeams`/`useGetAchievements`, VGC/TCGP services). **Localized** via `next-intl` (`locales/{es,en}/admin.json`, registered in `i18n/request.ts`; 267 keys/locale, full parity): `admin.nav`/`admin.shell`/`admin.crud`/`admin.{games,events,teams,achievements}`/`admin.form.*`/`admin.tcgp`/`admin.vgc.*`. **Manga admin panels** (`MangaDownloader`/`MangaLibrary`/`MangaConfig`/`ChapterGrid`/`MangaMetadataForm`) render as-is inside the new shell — full restyle **deferred** alongside the deferred manga tool (see `docs/BOFFMEDIA_V3_DEFERRED.md`). ⏭️ **Blog** — **deferred** (user decision): no posts, no CMS backend, nextra skeleton only (see DEFERRED). tsc clean workspace-wide.

**Phase 6 (hardening — early items):** ✅ **Showcase split** (2026-07-08) — the ~1.9K-line `app/(boffmedia)/styles/components/page.tsx` monolith is now a 285-line orchestrator + `showcase-shared.tsx` (`Sample`/`Section` + class fragments) + `showcase-data.tsx` (`CHAPTERS`/`DOMAINS`/types + `DEMO_*`) + nine `_chapters/*.tsx` components (each owns its chapter-local demo state), per convention §10. ✅ **`/mhwilds/monsters` bestiary** (2026-07-08, `bleed: true`) — real-data master–detail on the v3 «Señal» `mh-beastiary.css` design. New backend `/tools/mhwilds/monsters` endpoint (controller `@Get('monsters')` + `GetMonstersDto` + `MonsterEntity`; facade→data-service→repo `getResourceData('monsters', …)` proxying `wilds.mhdb.io` like weapons/armor). Web (hand-written service, no `generate:shared`): `MhWildsService.getMonsters` + `MhMonster` types + `useMonsters` hook. Page reuses the shared `mh-kit` chassis (`MhApp`/`MhBar`/`MhBody`/`MhSeal`/`MhSearch`/`MhPanel`) + route-local `_components/bst-kit.tsx` (`MonsterCard`/`MonsterRow`/`WeakCell`/`VulnRow`/`Tag2`/pips) + `_hooks/useMonsters`. Roster (search · grid/list · name/health sort · class + elemental-weakness filters) ↔ detail (overview · elemental weaknesses · status vulns · resistances · ailments · locations · reward drop table). Handoff-only mock features (hitzones, breakable parts, danger moves, threat/tempered, related gear) not built — see DEFERRED. Registry `bestiary` un-hidden; strings `mhwilds.bestiary.*` + `games.mhwilds.tools.bestiary` (es+en). tsc clean (web+api).

**Pending:** showcase — «palabra cinética» (`Kinetic`) not extracted. Phase 5 admin is on v3; **blog is deferred** and manga admin panels await the deferred manga tool. Then Phase 6: move `data-ds="boffmedia"` from page roots up to `(boffmedia)/layout.tsx` once every route is on v3, delete `boffmedia-v2/`, prune legacy tokens.

---

## `components/boffmedia-v2/` — Previous design system (being replaced)

### `primitives/` (78 files)

Design-system primitives and domain components for Boffmedia. Organized into sub-sections by concern.

#### Generic UI atoms (39 files)

No business logic. Reusable across all Boffmedia sections.

| File | Exports |
|---|---|
| `alert.tsx` | BoffAlert |
| `avatar.tsx` | BoffAvatar, BoffAvatarGroup |
| `badge.tsx` | BoffBadge |
| `breadcrumb.tsx` | Breadcrumb |
| `button.tsx` | BoffButton |
| `callout.tsx` | Callout |
| `card.tsx` | BoffCard |
| `checkbox.tsx` | BoffCheckbox |
| `code-block.tsx` | CodeBlock |
| `copy-button.tsx` | CopyButton |
| `dialog.tsx` | BoffModal |
| `doc-toc.tsx` | DocTOC |
| `empty-state.tsx` | EmptyState |
| `expandable-card.tsx` | ExpandableCard |
| `field.tsx` | Field |
| `hp-bar.tsx` | HpBar |
| `icon-box.tsx` | IconBox |
| `icon.tsx` | Icon |
| `input.tsx` | BoffInput |
| `kicker.tsx` | Kicker |
| `pagination.tsx` | Pagination |
| `picker.tsx` | Picker |
| `popover.tsx` | BoffPopover |
| `progress.tsx` | BoffProgress, BoffRing |
| `radio-group.tsx` | RadioGroup |
| `search-input.tsx` | SearchInput |
| `searchable-list.tsx` | SearchableList |
| `seg-tabs.tsx` | SegTabs |
| `segmented.tsx` | Segmented |
| `skeleton.tsx` | BoffSkeleton |
| `slider.tsx` | BoffSlider |
| `spinner.tsx` | BoffSpinner |
| `stat.tsx` | Stat |
| `switch.tsx` | BoffSwitch |
| `tabs.tsx` | BoffTabs |
| `tag.tsx` | Tag |
| `toast-provider.tsx` | ToastProvider, useToast |
| `tooltip.tsx` | BoffTooltip |
| `action-bar.tsx` | BoffActionBar |

#### `bs-*` — Battlesim v1 primitives (16 files)

Battle simulation building blocks. Pokemon-type-aware, use battlesim design tokens.

| File | Exports | Description |
|---|---|---|
| `bs-data.ts` | TYPES, tyVar, effMult, effLabel, hpColor, aniF, aniB | Type/effectiveness data helpers |
| `bs-type.tsx` | BSType, BSTypeRow, BSCat | Pokemon type badge + row |
| `bs-status-chip.tsx` | BSStatusChip | Status condition chip (burn, poison, etc.) |
| `bs-boost.tsx` | BSBoost | Stat boost/minus indicator |
| `bs-tera.tsx` | BSTera | Terastallize type indicator |
| `bs-poke-chip.tsx` | BSPokeChip | Compact pokemon chip with sprite |
| `bs-move.tsx` | BSMove | Move display with type/category/PP |
| `bs-log-event.tsx` | BSLogEvent, BSChatRow | Battle log event row |
| `bs-mon-card.tsx` | BSMonCard | Pokemon battle card |
| `bs-field-cond.tsx` | BSFieldCond | Field condition chip (weather, terrain, rooms) |
| `bs-hp-meter.tsx` | BSHpMeter | HP bar with type row, status, boosts |
| `bs-tracker.tsx` | BSTracker | Team tracker (row of poke chips) |
| `bs-tray-slot.tsx` | BSTraySlot | Selectable pokemon tray slot with HP bar |
| `bs-win-prob.tsx` | BSWinProb | Win probability bar (spectator mode) |
| `bs-timer.tsx` | BSTimer | Turn/game timer display |

#### `bsx-*` — Battlesim v2 primitives (12 files)

Next-gen battle simulation components.

| File | Exports | Description |
|---|---|---|
| `bsx-data.ts` | MOVESETS, MON_DATA, freshMon, calcRange, koLabel, speedOrder | V2 data helpers |
| `bsx-ring.tsx` | BSXRing | Battle ring visualization |
| `bsx-plate.tsx` | BSXPlate | Battle plate display |
| `bsx-key.tsx` | BSXKey | Key info display |
| `bsx-order-rail.tsx` | BSXOrderRail | Speed/order rail |
| `bsx-plan-chip.tsx` | BSXPlanChip | Plan chip |
| `bsx-bench-chip.tsx` | BSXBenchChip | Bench pokemon chip |
| `bsx-tera-btn.tsx` | BSXTeraBtn | Terastallize button |
| `bsx-tick.tsx` | BSXTick | Tick/check indicator |
| `bsx-spark.tsx` | BSXSpark | Spark effect |
| `bsx-score-plate.tsx` | BSXScorePlate | Player score plate with team preview |

#### Tool-kit components (11 files)

Domain components for gaming tools. Should eventually move to `ui/tools/`.

| File | Exports |
|---|---|
| `result-badge.tsx` | ResultBadge |
| `stat-tile.tsx` | StatTile |
| `split-bar.tsx` | SplitBar |
| `trend-chart.tsx` | TrendChart |
| `heat-grid.tsx` | HeatGrid |
| `tag-pills.tsx` | TagPills |
| `tool-app.tsx` | ToolApp |
| `tool-panel.tsx` | ToolPanel |
| `tool-select.tsx` | ToolSelect |
| `tool-stat-bars.tsx` | ToolStatBars |
| `tool-table.tsx` | ToolTable |

#### Other (1 file)

| File | Exports | Notes |
|---|---|---|
| `game-panel.tsx` | GamePanel | Generic game panel with title/actions/footer |

---

### `layouts/` — Layout shells

| File | Exports | Notes |
|---|---|---|
| `GameStageLayout.tsx` | GameStageLayout | Fullscreen-capable game stage with header/rail/dock/statusBar/footer slots |

---

### `ui/games/` — Game-related components
| File | Exports | Notes |
|---|---|---|
| `game-card.tsx` | GameCard, GameData | Game selection card with neon glow |
| `game-header.tsx` | GameHeader | Game page hero header (internal) |
| `game-hero-banner.tsx` | GameHeroBanner | Full-width hero banner for game pages |
| `game-page.tsx` | GamePage | Full game landing page template |
| `game-switcher.tsx` | GameSwitcher | Game context switcher dropdown |
| `game-tools-layout/` | GameToolsLayout (default) | Layout shell for game tool pages |
| `├─ index.tsx` | | Main layout with responsive sidebar |
| `├─ DesktopSidebar.tsx` | DesktopSidebar | Desktop sidebar (internal) |
| `├─ MobileHeader.tsx` | MobileHeader | Sticky mobile header (internal) |
| `└─ MobileSidebar.tsx` | MobileSidebar | Slide-in mobile sheet (internal) |

### `ui/tools/` — Tool-related components
| File | Exports | Notes |
|---|---|---|
| `tool-card.tsx` | ToolCard | Tool listing card with icon and features |
| `tool-card-fav.tsx` | ToolCardFav | ToolCard with favorite overlay |
| `tool-command.tsx` | ToolCommand | Command palette (Cmd+K) tool search |
| `tool-row.tsx` | ToolRow | Tool listing as card-style row |
| `tool-tile.tsx` | ToolTile | Compact tool tile with hue-aware icon |
| `tool-type-badge.tsx` | ToolsTypeBadge | Pokemon type badge (Spanish) |
| `featured-tool.tsx` | FeaturedTool | Featured tool hero section |
| `tools-store.ts` | useFavorites, useRecent | Zustand store for favorites/recents |
| `fav-star.tsx` | FavStar | Favorite toggle star button |
| `featured-button.tsx` | FeaturedButton | CTA button variant for featured tools |

#### `ui/tools/datakit/` — shared v3 data-tool kit (`dk-*`)
The v3 chassis for data tools (VGC Tracker + Meta today; Speed / Torneos next) — the intended v3 home for the legacy `boffmedia-v2` tool-kit primitives (`trend-chart`/`heat-grid`/`split-bar`/`stat-tile`/…). Import from the `datakit` barrel. Built with Tailwind + tokens only (no CSS port); `DkTrend`/`DkHeat` are inline-SVG (client, `ResizeObserver`-measured).
| File | Exports | Notes |
|---|---|---|
| `DkShell.tsx` | DkApp, DkBar, DkSub, DkSubNote, DkBody, DkDivider, DkSpacer, DkTitle, DkBack | Full-height tool chassis (sticky bar + sub-bar + own-scroll body), tool title/back, `--dk-pad` gutter |
| `DkControls.tsx` | DkSeg, DkSearch, DkChip | Segmented control (+count/size), search field, mono chip — all with the datakit bottom-right cut |
| `DkStat.tsx` | DkStat, DkSplit | KPI card (tone pos/neg/accent) + win/draw/loss ratio bar |
| `DkCharts.tsx` | DkTrend, DkHeat | Multi-line progression sparkline (dashed baseline + result dots) + activity heatmap |
| `DkFeedback.tsx` | DkEmpty, DkSkel, DkSkelList | Dashed empty box + single / list shimmer skeletons |
| `DkSelect.tsx` | DkSelect | Compact mono `dk-sel` native select (CSS caret, cut) |
| `DkTable.tsx` | DkTable, DkColumn | Sortable data table (sticky head, `is-click`/`mono` cell hooks) — child-selector styled so callers write plain `<tr>/<td>` |
| `DkBarList.tsx` | DkBarList, DkBarItem | Ranked labelled bars (moves/items/partners…), peak-relative, optional lead sprite + onClick |
| `DkType.tsx` | DkType, TYPE_COLORS, typeColor | Pokémon type badge in canonical colour |
| `DkTeam.tsx` | DkTeam, DkTeamSlot | Compact row of team sprites |
| `DkCopy.tsx` | DkCopy | Copy-to-clipboard button with confirm |
| `DkSprite.tsx` | DkSprite | Game-agnostic sprite chip (caller owns URL + onError) |
| `hooks.ts` | useDkNarrow, useDkLoad | Narrow-viewport (drill-in) + context-switch loading pulse |
| `utils.ts` | cssVars, DkTone, DK_CUT | CSS-var cast helper + shared 8px cut clip-path |

### `ui/profile/` — User profile components
| File | Exports | Notes |
|---|---|---|
| `achievement-tile.tsx` | AchievementTile | Single achievement badge tile |
| `activity-item.tsx` | ActivityItem | Activity feed row |
| `card-title.tsx` | CardTitle | Card section heading with icon |
| `linked-row.tsx` | LinkedRow | Linked account row (Discord/MC/Steam) |
| `metric.tsx` | Metric | Key metric display (value + label) |
| `stat-card.tsx` | StatCard | Stat card with icon, large value, label |

### `ui/leaderboard/` — Leaderboard components
| File | Exports | Notes |
|---|---|---|
| `leaderboard.tsx` | Leaderboard | Full leaderboard card with ranked rows |
| `leader-row.tsx` | LeaderRow | Single leaderboard row |

### `ui/events/` — Event components
| File | Exports | Notes |
|---|---|---|
| `event-card.tsx` | EventCard | Event listing card with date block |

### `ui/layout/` — Shared layout / chrome
| File | Exports | Notes |
|---|---|---|
| `footer.tsx` | Footer | Site footer with brand, links, newsletter |
| `marquee.tsx` | Marquee | Auto-scrolling marquee text banner |
| `icon-button.tsx` | IconButton | Small square icon-only button |

### `ui/navigation/` — Navigation and menus
| File | Exports | Notes |
|---|---|---|
| `FicusNav.tsx` | FicusNav | Main site navigation bar |
| `DropdownMenu.tsx` | DropdownMenu | Generic dropdown menu |
| `NotificationPopover.tsx` | NotificationPopover | Notification bell with popover |
| `ToolsMenu.tsx` | ToolsMenu | Tools section dropdown menu |
| `WingullMenu.tsx` | WingullMenu | User menu (profile, settings, logout) |

### `ui/system-states/` — System state screens
Full-page utility screens for loading, errors, offline, etc. Built on `SystemStateShell` + `SystemFloatBg`. Demo-only (showcased in Design System Hub).

| File | Exports | Notes |
|---|---|---|
| `index.ts` | barrel | Re-exports all system state components |
| `system-float-bg.tsx` | SystemFloatBg | Ambient orb background (warm/accent/cool) |
| `system-state-shell.tsx` | SystemStateShell | Shared page shell with grid centering |
| `system-loading.tsx` | SystemLoading | Splash with logo, spinner, progress bar |
| `system-error.tsx` | SystemError | Crash page with collapsible trace + tracking ID |
| `system-not-found.tsx` | SystemNotFound | 404 with navigation fallbacks |
| `system-offline.tsx` | SystemOffline | Network loss with auto-reconnect |
| `system-maintenance.tsx` | SystemMaintenance | Scheduled downtime with ETA |
| `system-forbidden.tsx` | SystemForbidden | 403 with login prompt |
| `system-coming-soon.tsx` | SystemComingSoon | Waitlist with email capture |
| `system-states-demo-empty.tsx` | SystemStatesDemoEmpty | Empty state presets demo |
| `system-states-demo-skeleton.tsx` | SystemStatesDemoSkeleton | Skeleton loading demo |
| `system-states-demo-toasts.tsx` | SystemStatesDemoToasts | Toast notification demo |

### `ui/admin/` — Admin panel components (removed)
The v2 admin shell + CRUD (`admin-layout` + `admin-crud`) were **deleted (Phase 5,
2026-07-08)** and replaced by the v3 «Señal» admin under
`app/(boffmedia)/admin/_components/ui/` (`av-kit`/`av-shell`/`av-crud`). See the
Phase 5 note in the boffmedia-v3 progress section above.

---

## `components/shared/pokemon/` — Shared Pokemon UI

Pokemon-specific components. Shared across Boffmedia and SmartRotom.

| File | Exports | Notes |
|---|---|---|
| `BaseStatBars.tsx` | BaseStatBars | Pokemon base stat bars with BST total |
| `PokeSprite.tsx` | PokeSprite | Pokemon sprite from PokeAPI |
| `TeamSprites.tsx` | TeamSprites | Row of up to 6 Pokemon sprites |
| `TypeBadge.tsx` | TypeBadge | Pokemon type badge |
| `PokemonTypeIcon.tsx` | PokemonTypeIcon | Pokemon type icon |
| `PokemonItemImage.tsx` | PokemonItemImage | Pokemon item image |

---

## Usage Notes

- **Most used primitive:** `Icon` (8+ external consumers across nav, layout, profile)
- **Production consumers:** `UserProfile.tsx`, `BoffFooter.tsx`, `herramientas/page.tsx`, `pokemon/page.tsx`, `mhwilds/page.tsx`, `(herramientas)/layout.tsx`
- **Showcase-only:** ~50 components exist only in `showcase/page.tsx` with no other production usage (includes all `ui/system-states/`, battlesim `bs-*`/`bsx-*`, and tool-kit pieces like `ResultBadge`, `StatTile`, etc.)
- **Internal-only:** `game-header.tsx`, `DesktopSidebar.tsx`, `MobileHeader.tsx`, `MobileSidebar.tsx` (used only within their parent modules)
- **Tool-kit in primitives:** `result-badge`, `stat-tile`, `split-bar`, `trend-chart`, `heat-grid`, `tag-pills`, `tool-app`, `tool-panel`, `tool-select`, `tool-stat-bars`, `tool-table` live in `primitives/` but are tool-domain. They should eventually move to `ui/tools/`.
- **GamePanel in primitives:** `game-panel.tsx` is game-domain. Should eventually move to `ui/games/`.
- **`boffmedia-old/`:** Contains a copy of `GameStageLayout.tsx` and `GameToolsLayout/` from a previous reorganization. Can be cleaned up.
