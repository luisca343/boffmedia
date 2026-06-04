# Boffmedia Component Tree

## `components/boffmedia/` — Unified Boffmedia tree

### `primitives/` (44 files)
Design-system primitives for Boffmedia (ported from `ui/primitives/boffmedia/`).

| File | Type |
|---|---|
| `alert.tsx` | BoffAlert |
| `avatar.tsx` | BoffAvatar, BoffAvatarGroup |
| `badge.tsx` | BoffBadge |
| `BaseStatBars.tsx` | BaseStatBars |
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
| `PokeSprite.tsx` | PokeSprite |
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
| `TeamSprites.tsx` | TeamSprites |
| `toast-provider.tsx` | ToastProvider, useToast |
| `tool-app.tsx` | ToolApp |
| `tool-panel.tsx` | ToolPanel |
| `tool-select.tsx` | ToolSelect |
| `tool-stat-bars.tsx` | ToolStatBars |
| `tool-table.tsx` | ToolTable |
| `tooltip.tsx` | BoffTooltip |
| `index.ts` | barrel exports |

### `ui/` (22 files)
Domain-level Boffmedia UI components (ported from `ui/boffmedia/`). One component per file.

| File | Exports |
|---|---|
| `achievement-tile.tsx` | AchievementTile |
| `activity-item.tsx` | ActivityItem |
| `card-title.tsx` | CardTitle |
| `event-card.tsx` | EventCard |
| `fav-star.tsx` | FavStar |
| `featured-tool.tsx` | FeaturedTool |
| `footer.tsx` | Footer |
| `game-card.tsx` | GameCard |
| `game-switcher.tsx` | GameSwitcher |
| `icon-button.tsx` | IconButton |
| `leader-row.tsx` | LeaderRow |
| `leaderboard.tsx` | Leaderboard |
| `linked-row.tsx` | LinkedRow |
| `marquee.tsx` | Marquee |
| `metric.tsx` | Metric |
| `stat-card.tsx` | StatCard |
| `tool-card.tsx` | ToolCard |
| `tool-card-fav.tsx` | ToolCardFav |
| `tool-command.tsx` | ToolCommand |
| `tool-row.tsx` | ToolRow |
| `tool-tile.tsx` | ToolTile |
| `tools-store.ts` | useFavorites, useRecent |
| `tools-type-badge.tsx` | ToolsTypeBadge |

---

## `components/boffmedia-old/` — Legacy Boffmedia (awaiting migration)

### `BoffCard.tsx`
Shared interactive card shell used across Boffmedia sections.

### `event/`
| File | Exports |
|---|---|
| `AchievementBadge.tsx` | AchievementBadge |
| `EventCard.tsx` | EventCard |
| `EventStatusChip.tsx` | EventStatusChip |
| `rarityTokens.ts` | getRarityTokens, RarityTokens |

### `layouts/GameToolsLayout/`
| File |
|---|
| `index.tsx` (GameToolsLayout) |
| `DesktopSidebar.tsx` |
| `MobileHeader.tsx` |
| `MobileSidebar.tsx` |

### `leaderboard/`
| File | Exports |
|---|---|
| `LeaderboardCard.tsx` | LeaderboardCard |
| `LeaderboardEmptyState.tsx` | LeaderboardEmptyState |
| `LeaderboardList.tsx` | LeaderboardList |

### `navigation/`
| File | Exports |
|---|---|
| `DropdownMenu.tsx` | DropdownMenu |
| `FicusNav.tsx` | FicusNav |
| `NotificationPopover.tsx` | NotificationPopover |
| `ToolsMenu.tsx` | ToolsMenu |
| `WingullMenu.tsx` | WingullMenu |

### `sections/`
| File | Exports |
|---|---|
| `index.ts` | barrel exports |
| `SectionHeader.tsx` | SectionHeader |
| `SectionLoading.tsx` | SectionLoading |
| `SectionEmpty.tsx` | SectionEmpty |
| `SectionError.tsx` | SectionError |
| `SectionFilters.tsx` | SectionFilters |

### `tools/`
| File | Exports |
|---|---|
| `BoffButton.tsx` | BoffButton |
| `BoffContainer.tsx` | BoffContainer |
| `ExternalResources.tsx` | ExternalResources |
| `FeaturedTool.tsx` | FeaturedTool |
| `GameToolsPage.tsx` | GameToolsPage |
| `PageHeader.tsx` | PageHeader |
| `ToolSectionHeader.tsx` | ToolSectionHeader |
| `ToolsGrid.tsx` | ToolsGrid |
| `ToolsPageLayout.tsx` | ToolsPageLayout |
| `utils/boffVariants.ts` | BOFF_VARIANTS, BoffVariant, BoffVariantTokens |
| `utils/getBoffStyle.ts` | getBoffStyle, BoffStyle |

### `primitives/` *(empty — target for migrated boffmedia-old primitives)*
### `ui/` *(empty — target for migrated boffmedia-old UI)*

---

## `components/shared/` — Cross-app shared (Boffmedia + SmartRotom)

### `pokemon/`
| File | Exports |
|---|---|
| `PokemonItemImage.tsx` | PokemonItemImage |
| `PokemonTypeIcon.tsx` | PokemonTypeIcon |
| `TypeBadge.tsx` | TypeBadge |

### Other
| File | Description |
|---|---|
| `Construction.tsx` | WIP placeholder |
| `PlayOnMountAudio.tsx` | Audio on mount |
| `PlayOnUnmountAudio.tsx` | Audio on unmount |
| `book/book.tsx` | Book component |
| `ckeditor/` | CKEditor integration |
| `map/` | BaseMarker, StandardizedMap |

---

## `components/ui/` — Global shared UI (shadcn/Radix primitives + cross-app)

### `primitives/` (shadcn — 33 files)
`accordion`, `alert-dialog`, `alert`, `avatar`, `badge`, `button`, `calendar`, `card`, `checkbox`, `collapsible`, `combobox`, `command`, `dialog`, `dropdown-menu`, `form`, `hover-card`, `image-upload`, `input`, `label`, `navigation-menu`, `popover`, `progress`, `scroll-area`, `select`, `separator`, `sheet`, `skeleton`, `slider`, `switch`, `table`, `tabs`, `textarea`, `tooltip`

### `navigation/`
| File |
|---|
| `LanguageSwitcher.tsx` |
| `Link.tsx` |
| `NavButton.tsx` |
| `UserAuthSection.tsx` |

### `display/`
| File |
|---|
| `CodeDisplay.tsx` |
| `GridBackground.tsx` |
| `LoadingSpinner.tsx` |
| `OrbitingElementsCloud.tsx` |
| `SectionPanel.tsx` |

### `form/`
| File |
|---|
| `FormField.tsx` |
| `FormSectionHeader.tsx` |

### `interactive/`
| File |
|---|
| `ActionButton.tsx` |
| `AnimatedToggle.tsx` |
| `ComboboxWithPreview.tsx` |

### Root
| File |
|---|
| `BackToTop.tsx` |
| `Hora.tsx` |
| `Markdown.tsx` |
| `ProfileImage.tsx` |

---

## `components/smartrotom/` — SmartRotom cellphone UI

Neobrutalism design system, separate from Boffmedia.

Key entry points: `RotomNav.tsx`, `AppWrapper.tsx`, `RotomErrorBoundary.tsx`, `Loading.tsx`
Subdirs: `apps/`, `calls/`, `minecraft/`, `shared/`, `themes/`, `twitch/`, `types/`, `ui/`, `youtube/`
