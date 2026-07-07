# Boffmedia Component Tree

## `components/boffmedia/` — Current design system (in progress)

Graphite/steel/orange design. Tailwind-first, consuming the global tokens
(`--bg`, `--panel`, `--line`, `--accent`, `--text`/`--muted`/`--dim`, `--cut`,
display/body/mono fonts) defined in `app/globals.css`. Replaces the `boffmedia-v2`
tree page-by-page.

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
| `navigation/nav-data.ts` | PRIMARY_NAV, TOOLS_SECTIONS, COMUNIDAD_SECTIONS, FOOTER_COLS, FOOTER_SOCIAL |
| `landing/LandingPage.tsx` | LandingPage — active home page (`(boffmedia)/page.tsx`), «Travesía» concept, Tailwind-only |
| `landing/travesia-fx.tsx` | FxProgress, Scan, Decode, FxParticles, FxCursor, useSignalFX |
| `landing/LandingHome.tsx` | LandingHome — superseded "Broadcast" concept, no longer routed |

### `hooks/`

| File | Exports |
|---|---|
| `use-reveal.ts` | useReveal |

**Status:** Foundation (tokens/fonts/Tailwind) ✅ · App shell (Navbar + Footer, wired into `(boffmedia)/layout.tsx`) ✅ · Landing home page — «Travesía» (single continuous journey) ✅
**Pending:** components showcase (`styles/components`), remaining pages/tools.

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

### `ui/vgc/meta/` — VGC metagame components
| File | Exports | Notes |
|---|---|---|
| `index.ts` | barrel | |
| `divergence-view.tsx` | DivergenceView | Usage divergence chart panel |
| `meta-data.ts` | MetaData helpers | Data utilities for meta stats |
| `pokemon-detail.tsx` | PokemonDetail | Detailed pokemon analysis panel |
| `spread.tsx` | Spread | Usage spread visualization |
| `standings-view.tsx` | StandingsView | Tournament standings table |
| `team-row.tsx` | TeamRow | Team preview row component |
| `usage-sidebar.tsx` | UsageSidebar | Sidebar with usage filters |

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
