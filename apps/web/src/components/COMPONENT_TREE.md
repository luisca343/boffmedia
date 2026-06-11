# Boffmedia Component Tree

## `components/boffmedia/` — Unified Boffmedia tree

### `primitives/` (39 entries, curated subset)
Design-system primitives for Boffmedia. Generic UI atoms with no business logic. Also houses battlesim (`bs-*`, `bsx-*`) and tool-kit components (`result-badge`, `stat-tile`, etc.) that should eventually move to their own domain sections.

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
| `heat-grid.tsx` | HeatGrid |
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
| `result-badge.tsx` | ResultBadge |
| `search-input.tsx` | SearchInput |
| `searchable-list.tsx` | SearchableList |
| `seg-tabs.tsx` | SegTabs |
| `segmented.tsx` | Segmented |
| `skeleton.tsx` | BoffSkeleton |
| `slider.tsx` | BoffSlider |
| `split-bar.tsx` | SplitBar |
| `stat.tsx` | Stat |
| `stat-tile.tsx` | StatTile |
| `switch.tsx` | BoffSwitch |
| `tabs.tsx` | BoffTabs |
| `tag-pills.tsx` | TagPills |
| `tag.tsx` | Tag |
| `toast-provider.tsx` | ToastProvider, useToast |
| `tool-app.tsx` | ToolApp |
| `tool-panel.tsx` | ToolPanel |
| `tool-select.tsx` | ToolSelect |
| `tool-stat-bars.tsx` | ToolStatBars |
| `tool-table.tsx` | ToolTable |
| `tooltip.tsx` | BoffTooltip |
| `trend-chart.tsx` | TrendChart |
| `index.ts` | barrel exports |

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

Pokemon-specific components. Moved from `boffmedia/primitives/` (except TypeBadge, PokemonTypeIcon, PokemonItemImage which were already here).

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
- **Non-primitives in `primitives/`:** Battlesim (`bs-*`, `bsx-*`) and tool-kit components (`result-badge`, `stat-tile`, `split-bar`, `trend-chart`, `heat-grid`, `tag-pills`) live in `primitives/` but are domain-specific. They should eventually move to their own sections.
