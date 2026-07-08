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
| `tools/CategoryLanding.tsx` | CategoryLanding + internal GameBanner (real key-art), FeaturedTool (real art), ExtLinks — the `/pokemon /minecraft /mhwilds /otros` landing body, rendered inside ToolShell |
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
| `events/EventCard.tsx` | EventCard — event grid card (hue rail, status chip, game/date), links to `/eventos/[id]` |
| `events/GameCard.tsx` | GameCard — game grid card (cover art + scrim, active badge, since-date), links to `/juegos/[id]` |
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
**Phase 3 (in progress):** ✅ auth — v3 auth kit (`AuthProviderBtn`/`PasswordField`, `steam`+`camera` icons) + `/entrar` login/register wired to NextAuth, session-aware `AccountNav`. ✅ profile — `/perfil` rebuilt on v3 (real identity/avatar-upload/account-form/linked-accounts), full profile set demoed in the showcase **Perfil** chapter; deferred no-API sections in `docs/BOFFMEDIA_V3_DEFERRED.md`. ✅ ranking — `/clasificacion` global leaderboard from real `useGetLeaderboards`. ✅ events — `/eventos` + `/eventos/[id]` (real `useGetEvents`/achievements/leaderboard/join) via shared `ui/events/` kit; `/logros` global achievements catalogue; `/juegos` + `/juegos/[id]`; `/calendario` agenda; `/eventos/sugerir` v3 suggest-event form (real `useGetGames` on the game field; client-side submit — no suggest endpoint yet, see deferred doc). **The whole `(eventos)` group is now on v3.** ✅ community — `/community` real-data hub (nav re-pointed from `/eventos`). ✅ legal — `/privacidad /terminos /cookies` via `ui/legal/LegalDoc`. ✅ landing — `TvTorneos` next-event wired to real `useGetEvents`. Remaining Phase 3: none blocking — leftover no-API items (community forum, landing HUD/FEED, notifications, tournament brackets, suggest-event submission) tracked in `docs/BOFFMEDIA_V3_DEFERRED.md`.

**Phase 4 (tool migrations, in progress):** ✅ **VGC damage calculator** (`pokemon/vgc/damage-calculator`) — full rebuild. Route-local extracted UI kit `_components/ui/` (16 components porting `calc.css` → Tailwind, wired to real data: `TypeBadge`/`PokemonSprite`/`Combobox`/`NumberStepper`/`controls`/`TogglePill`/`KoVerdict`/`DamageBar`/`HpGauge`/`StatEditor`/`MiniCard`/`RoleTag`/`Callout`/`CopyButton`/`SideDrawer` + `theme`) + views `_components/` (`CombatView`/`MatrixView`/`SpeedView`/`TypesView` + `PokemonPanel`/`FieldPanel`/`MoveRow`/`VersusStrip`/`FieldBar`/`TeamSlots`/`MatrixGrid`/`SavedDrawer`); the calculator is the tool page (full-height shell + `Tabs`). Real engine only (`calculatorStore`/`smogonAdapter`/`useLegalPokemon`/`useGameData`/`calcStat`); shared `_lib/typeChart.ts`+`speedCalc.ts`. All v2 calc components deleted. ✅ **VGC tracker** (`pokemon/vgc/tracker`) — full rebuild on the new shared **`ui/tools/datakit/`** kit (see above). 5 views on the full-height dk-app shell (`bleed: true`), wired to the **real** IndexedDB CRUD (`useVgcDb`/`computeSessionStats`/`usePokemonSearch`/`parseShowdownPaste`/export-import/CSV): home, session detail (matches/stats tabs + tournament series/round filter), stats dashboard (8 handoff sections), and the match + BO3-series **editing** workspaces. Tracker-local kit `_components/ui/tr-ui.tsx` (`TrResult`/`TrBrought`/`TrSprite`/`TrPanel`); editing panels (`TeamPanel` pool/assignment editor, `SpeedTierWidget`, `NotesPanel`, `PokemonAutocomplete`, `SeriesNotesPanel`) + CRUD dialogs (`NewSessionDialog`/`PresetManager`/`DuplicateSessionDialog`/`ExportImportDialog`) restyled to v3; 11 recharts-era stats sub-components deleted. Session-comparison + regulation-meta stats panels deferred. ✅ **VGC meta** (`pokemon/vgc/meta`) — full rebuild on the datakit (`bleed: true`), master–detail over the **real** data layer (Smogon ladder `useSmogonUsage` + Limitless tournament `useLimitlessUsage`/`useLimitlessPlayers`/`useDivergence`, on-demand team fetch, `useSpeciesTeams`); URL-state + auto-nav preserved (`useMetaNavigation`, drill-in ≤980). Route-local `_components/`: `VgcToolbar` (DkBar) / `VgcSubbar` (DkSub) / `MvList` (usage ranking) / `MvDetail` (species card grid: base stats · moves · items · abilities/teras · partners · EV spreads · featured teams) / `MvTeams` (`MvTeamGrid`+`MvTeamRow`) / `MvPlayers` (standings) / `MvDivergence` + `MvBits` (`MvType`/`MvSpread`/`MvBaseStats`/`MvCard`); shared VM in `_lib/meta-types.ts`. The whole v2 `boffmedia-v2/ui/vgc/meta/` folder deleted. Strings localized (`vgc.meta.*`, es+en). Next Phase 4 tools: VGC speed, TCG Pocket, BattleSim, PMD Sky, MH Wilds, schematic-compat, otros.

**Pending:** showcase — «palabra cinética» (`Kinetic`) not extracted. Then: remaining Phase 4 tools and their per-tool kits; Phase 5 (blog + admin); move `data-ds="boffmedia"` from page roots up to `(boffmedia)/layout.tsx` once every route is on v3.

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

### `ui/admin/` — Admin panel components
| File | Exports | Notes |
|---|---|---|
| `admin-crud.tsx` | AdminCRUD | Generic CRUD table with search, pagination, actions |
| `admin-layout.tsx` | AdminLayout | Admin panel layout shell |

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
