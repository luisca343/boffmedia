# Boffmedia Component Tree

## `components/boffmedia/` — Unified Boffmedia tree

### `primitives/` (39 files)
Design-system primitives for Boffmedia. Generic UI atoms with no business logic.

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
| `empty-state.tsx` | EmptyState |
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
| `seg-tabs.tsx` | SegTabs |
| `segmented.tsx` | Segmented |
| `skeleton.tsx` | BoffSkeleton |
| `slider.tsx` | BoffSlider |
| `stat.tsx` | Stat |
| `switch.tsx` | BoffSwitch |
| `tabs.tsx` | BoffTabs |
| `tag.tsx` | Tag |
| `toast-provider.tsx` | ToastProvider, useToast |
| `tool-app.tsx` | ToolApp |
| `tool-panel.tsx` | ToolPanel |
| `tool-select.tsx` | ToolSelect |
| `tool-stat-bars.tsx` | ToolStatBars |
| `tool-table.tsx` | ToolTable |
| `tooltip.tsx` | BoffTooltip |
| `index.ts` | barrel exports |

---

### `ui/games/` — Game-related components
| File | Exports | Notes |
|---|---|---|
| `game-card.tsx` | GameCard, GameData | Game selection card with neon glow |
| `game-header.tsx` | GameHeader | Game page hero header (internal) |
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
- **Showcase-only:** ~40 components exist only in `showcase/page.tsx` with no other production usage
- **Internal-only:** `game-header.tsx`, `DesktopSidebar.tsx`, `MobileHeader.tsx`, `MobileSidebar.tsx` (used only within their parent modules)
