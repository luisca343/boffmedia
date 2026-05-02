# Component Architecture Refactor

**Date:** April 2026
**Scope:** `apps/web/src`
**Branch:** `boffmedia-2.0`

This document details all structural changes made to the component architecture as part of a refactor to improve consistency, scalability, and long-term maintainability.

---

## Summary of Changes

| # | Category | Description |
|---|---|---|
| 1 | **Naming** | Renamed `BotonNav.tsx` → `NavButton.tsx` and all Spanish exports to English |
| 2 | **Naming** | Fixed typo and renamed `BreadbrumbNav.tsx` → `BreadcrumbNav.tsx` |
| 3 | **Naming** | Renamed export `HerramientasMenu` → `ToolsMenu` in `ToolsMenu.tsx` |
| 4 | **Naming** | Renamed internal variable `HERRAMIENTAS_MENU` → `TOOLS_MENU` |
| 5 | **Namespace** | Moved `BreadcrumbNav.tsx` from `components/ui/navigation/` to `components/smartrotom/` |
| 6 | **Rename dir** | Renamed `components/common/` → `components/shared/` (31 files updated) |
| 7 | **New dir** | Created `src/features/` and migrated `components/boffmedia/` into it |
| 8 | **New dir** | Migrated `components/smartrotom/ficusai/` to `features/ficusai/` with internal restructure |
| 9 | **Namespace** | Moved boffmedia navigation files out of `components/ui/navigation/` into `features/boffmedia/navigation/` |
| 10 | **Namespace** | Moved `RotomNav.tsx` from `components/ui/navigation/` to `components/smartrotom/` |

---

## 1. `BotonNav.tsx` → `NavButton.tsx`

### What changed
The file `src/components/ui/navigation/BotonNav.tsx` was renamed to `NavButton.tsx`. All exported function names were translated from Spanish to English.

### Renamed exports

| Old name | New name |
|---|---|
| `BotonNav` | `NavButton` |
| `BotonPrev` | `PrevButton` |
| `BotonNext` | `NextButton` |
| `BotonReload` | `ReloadButton` |
| `BotonNotification` | `NotificationButton` |
| `BotonAjustes` | `SettingsButton` |
| `BotonIA` | `AIButton` |

### Files updated
- `src/components/ui/navigation/RotomNav.tsx` — import source updated from `"./BotonNav"` to `"./NavButton"`, all JSX usages renamed to English.
- A private internal `BotonNav` function defined inside `RotomNav.tsx` (dead code, never called externally) was renamed to `NavButton` for consistency.

### Files deleted
- `src/components/ui/navigation/BotonNav.tsx`

---

## 2. `BreadbrumbNav.tsx` → `BreadcrumbNav.tsx`

### What changed
The file `src/components/ui/navigation/BreadbrumbNav.tsx` had a typo in its filename (`Brumb` instead of `Crumb`). The file was renamed to `BreadcrumbNav.tsx`.

The exported default function was already named `BreadcrumbNav` correctly — only the filename was wrong.

### Files updated
- `src/components/ui/navigation/RotomNav.tsx` — import updated from `"./BreadbrumbNav"` to `"./BreadcrumbNav"` (the file was subsequently moved; see change #5).

### Files deleted
- `src/components/ui/navigation/BreadbrumbNav.tsx`

---

## 3 & 4. `HerramientasMenu` → `ToolsMenu`

### What changed
Inside `src/features/boffmedia/navigation/ToolsMenu.tsx` (moved as part of change #9):

- The exported function `HerramientasMenu` was renamed to `ToolsMenu`.
- The internal config object `HERRAMIENTAS_MENU` was renamed to `TOOLS_MENU`.

### Files updated
- `src/features/boffmedia/navigation/FicusNav.tsx` — import updated from `{ HerramientasMenu }` to `{ ToolsMenu }`, and JSX usage updated from `<HerramientasMenu />` to `<ToolsMenu />`.

---

## 5. `BreadcrumbNav.tsx` moved to `components/smartrotom/`

### Reason
`BreadcrumbNav` is a smartrotom-specific breadcrumb component — it hardcodes URLs relative to the `/smartrotom/` path, uses the SmartRotom-branded `SmartRotomBadge`, and is consumed exclusively by `RotomNav`. Placing it in `components/ui/navigation/` created a cross-namespace import (a `ui/navigation/` file importing from `smartrotom/ui/`).

### What changed
- File moved from `components/ui/navigation/BreadcrumbNav.tsx` → `components/smartrotom/BreadcrumbNav.tsx`
- Internal import updated: `"../../smartrotom/ui/badge"` → `"./ui/badge"` (now a clean local relative import)
- Unused import `Badge` from `@/components/ui/primitives/badge` removed (it was imported but never used in the original file)
- Internal Spanish variable names `nombre` → `label`, `texto` → `text`, `navegar` → `navigate` were standardized to English

### Files updated
- `src/components/ui/navigation/RotomNav.tsx` — import updated from `"./BreadcrumbNav"` to `"../../smartrotom/BreadcrumbNav"`, later converted to `@/components/smartrotom/BreadcrumbNav` (see change #10).

### Files deleted
- `src/components/ui/navigation/BreadcrumbNav.tsx` (the one in `navigation/`)

---

## 6. `components/common/` → `components/shared/`

### Reason
`common` is too generic and semantically ambiguous. `shared` communicates the purpose — these are app-generic utilities that don't belong to any specific domain and are shared across all sections.

### Files moved (directory renamed)

All files under `src/components/common/` were moved to `src/components/shared/`, preserving subdirectory structure:

```
components/shared/
├── Construction.tsx
├── PlayOnMountAudio.tsx
├── PlayOnUnmountAudio.tsx
├── book/
│   ├── book.css
│   └── book.tsx
├── ckeditor/
│   ├── TestEditor.tsx
│   ├── ckeditor.d.ts
│   ├── ckeditor.js
│   ├── ckeditor.js.map
│   └── styles.css
├── map/
│   ├── BaseMarker.tsx
│   └── StandardizedMap.tsx
└── pokemon/
    ├── PokemonItemImage.tsx
    └── PokemonTypeIcon.tsx
```

### Import paths updated (31 files)

All imports from `@/components/common/` and `@components/common/` were updated to `@/components/shared/` across 31 consumer files, including:

- `src/app/(boffmedia)/community/page.tsx`
- `src/app/smartrotom/furrettoday/editar/[id]/page.tsx`
- `src/app/smartrotom/furrettoday/editar/_components/NewsContent.tsx`
- `src/app/smartrotom/furrettoday/leer/[id]/page.tsx`
- `src/app/smartrotom/notas/_components/DocumentsList.tsx`
- `src/app/smartrotom/pasaporte/page.tsx`
- `src/app/smartrotom/pasaporte/_components/Badges.tsx`
- `src/app/smartrotom/pasaporte/_components/IndexPage.tsx`
- `src/app/smartrotom/pc/page.tsx` (used the `@components/` alias variant)
- `src/app/smartrotom/pc/components/box/PokemonSlot.tsx`
- `src/app/smartrotom/pc/components/details/PokemonCard.tsx`
- `src/app/smartrotom/pc/components/details/PokemonMoves.tsx`
- `src/app/smartrotom/pc/components/details/PokemonTypeEffectiveness.tsx`
- `src/app/smartrotom/pc/components/filter/FilterPanel.tsx`
- `src/app/smartrotom/pc/components/team/BattleTeamSlot.tsx`
- `src/app/smartrotom/pc/components/team/TeamSlot.tsx`
- `src/app/smartrotom/taxi/components/ListView.tsx`
- `src/app/smartrotom/taxi/components/map/MapControlPanel.tsx`
- `src/app/smartrotom/taxi/components/map/MapHeader.tsx`
- `src/app/smartrotom/taxi/components/map/OffscreenIndicator.tsx`
- `src/app/smartrotom/taxi/components/map/PlayerMarker.tsx`
- `src/app/smartrotom/taxi/components/map/TaxiStopMarker.tsx`
- `src/app/smartrotom/taxi/components/map/TrajectoryLine.tsx`
- `src/app/smartrotom/taxi/components/MapView.tsx`
- `src/app/smartrotom/taxi/hooks/useMapInteractions.ts`
- `src/app/smartrotom/taxi/hooks/useMapState.ts`
- `src/app/smartrotom/taxi/hooks/useStopPositions.ts`
- `src/app/smartrotom/taxi/utils/constants.ts`
- `src/app/smartrotom/taxi/utils/coordinate-utils.ts`
- `src/app/wingull/pueblos/[pueblo]/_components/map/MapMarkers.tsx`
- `src/app/wingull/pueblos/[pueblo]/_components/map/TownMap.tsx`

### Files deleted
- `src/components/common/` (entire directory)

---

## 7. `components/boffmedia/` → `features/boffmedia/`

### Reason
`components/boffmedia/` held domain-specific components (event cards, leaderboards, section UI, game tool layouts) that are consumed across multiple boffmedia routes but carry boffmedia domain knowledge. These are not globally reusable design system components — they belong in the `features/` layer.

### Files moved

```
features/boffmedia/
├── BoffCard.tsx
├── event/
│   ├── AchievementBadge.tsx
│   ├── EventCard.tsx
│   ├── EventStatusChip.tsx
│   └── rarityTokens.ts
├── layouts/
│   └── GameToolsLayout/
│       ├── DesktopSidebar.tsx
│       ├── MobileHeader.tsx
│       ├── MobileSidebar.tsx
│       └── index.tsx
├── leaderboard/
│   ├── LeaderboardCard.tsx
│   ├── LeaderboardEmptyState.tsx
│   └── LeaderboardList.tsx
├── sections/
│   ├── SectionEmpty.tsx
│   ├── SectionError.tsx
│   ├── SectionFilters.tsx
│   ├── SectionHeader.tsx
│   ├── SectionLoading.tsx
│   └── index.ts
└── tools/
    ├── BoffButton.tsx
    ├── BoffContainer.tsx
    ├── ExternalResources.tsx
    ├── FeaturedTool.tsx
    ├── GameToolsPage.tsx
    ├── PageHeader.tsx
    ├── ToolSectionHeader.tsx
    ├── ToolsGrid.tsx
    ├── ToolsPageLayout.tsx
    └── utils/
        ├── boffVariants.ts
        └── getBoffStyle.ts
```

### Import paths updated

All imports using `@/components/boffmedia/` and `@components/boffmedia/` were updated to `@/features/boffmedia/` across all consumer files, including:

- `src/app/(boffmedia)/(eventos)/clasificacion/page.tsx`
- `src/app/(boffmedia)/(eventos)/clasificacion/_components/leaderboard/AchievementsLeaderboard.tsx`
- `src/app/(boffmedia)/(eventos)/clasificacion/_components/leaderboard/GeneralLeaderboard.tsx`
- `src/app/(boffmedia)/(eventos)/clasificacion/_components/leaderboard/MedalsLeaderboard.tsx`
- `src/app/(boffmedia)/(eventos)/eventos/page.tsx`
- `src/app/(boffmedia)/(eventos)/eventos/sugerir/page.tsx`
- `src/app/(boffmedia)/(eventos)/eventos/[id]/logros/page.tsx`
- `src/app/(boffmedia)/(eventos)/eventos/[id]/_components/AchievementsSection.tsx`
- `src/app/(boffmedia)/(eventos)/eventos/[id]/_components/EventHero.tsx`
- `src/app/(boffmedia)/(eventos)/eventos/[id]/_components/Leaderboard.tsx`
- `src/app/(boffmedia)/(eventos)/eventos/_components/EventCard.tsx`
- `src/app/(boffmedia)/(eventos)/index.ts`
- `src/app/(boffmedia)/(eventos)/juegos/page.tsx`
- `src/app/(boffmedia)/(eventos)/juegos/[id]/page.tsx`
- `src/app/(boffmedia)/(eventos)/juegos/[id]/_components/GameEvents.tsx`
- `src/app/(boffmedia)/(herramientas)/layout.tsx`
- `src/app/(boffmedia)/(herramientas)/mhwilds/page.tsx`
- `src/app/(boffmedia)/(herramientas)/otros/page.tsx`
- `src/app/(boffmedia)/(herramientas)/otros/sorteos/page.tsx`
- `src/app/(boffmedia)/(herramientas)/pokemon/page.tsx`
- `src/app/(boffmedia)/(politicas)/_components/PolicyShell.tsx`
- `src/app/(boffmedia)/admin/events/_components/events/EventCard.tsx`
- `src/app/(boffmedia)/_components/sections/EventsSection.tsx`
- `src/app/(boffmedia)/_components/UserProfile.tsx`
- `src/tools/pmd-sky/_components/Header.tsx`
- `src/tools/pmd-sky/_components/LocationSection.tsx`
- `src/tools/pmd-sky/_components/PokemonSection.tsx`
- `src/tools/pmd-sky/_components/QuestConfigurationSection.tsx`
- `src/tools/pmd-sky/_components/RewardSection.tsx`
- `src/tools/pmd-sky/_components/SettingsSection.tsx`
- `src/tools/pmd-sky/_components/SkyForm.tsx`

### Files deleted
- `src/components/boffmedia/` (entire directory)

---

## 8. `components/smartrotom/ficusai/` → `features/ficusai/`

### Reason
The `ficusai/` slice already had internal structure resembling a feature (its own hook, types, README, and multiple components). It was placed in `components/smartrotom/` but is logically a self-contained AI feature, not a shared component. It gets promoted to `features/` with a proper layered structure.

### Internal restructure

The flat structure was reorganized into explicit subfolders:

**Before:**
```
components/smartrotom/ficusai/
├── BiomeListCard.tsx
├── ChatHeader.tsx
├── ChatInput.tsx
├── ChatMessages.tsx
├── CompletePokemonCard.tsx
├── FicusAI.tsx
├── MessageBubble.tsx
├── PokemonHabitatCard.tsx
├── PokemonMovesCard.tsx
├── PokemonStatsCard.tsx
├── PokemonTypesCard.tsx
├── README.md
├── index.ts
├── types.ts       ← type definitions mixed in with component files
└── useFicusChat.ts ← hook mixed in with component files
```

**After:**
```
features/ficusai/
├── components/
│   ├── BiomeListCard.tsx
│   ├── ChatHeader.tsx
│   ├── ChatInput.tsx
│   ├── ChatMessages.tsx
│   ├── CompletePokemonCard.tsx
│   ├── FicusAI.tsx
│   ├── MessageBubble.tsx
│   ├── PokemonHabitatCard.tsx
│   ├── PokemonMovesCard.tsx
│   ├── PokemonStatsCard.tsx
│   └── PokemonTypesCard.tsx
├── hooks/
│   └── useFicusChat.ts    ← extracted to hooks/
├── types.ts               ← promoted to feature root
├── index.ts               ← updated re-exports
└── README.md
```

### Internal import path updates

Inside `features/ficusai/components/`, all references to sibling type and hook files were updated:

- `from "./types"` → `from "../types"` (in `ChatMessages.tsx`, `CompletePokemonCard.tsx`, `MessageBubble.tsx`, `PokemonStatsCard.tsx`)
- `from "./useFicusChat"` → `from "../hooks/useFicusChat"` (in `FicusAI.tsx`)

Inside `features/ficusai/hooks/`:

- `from "./types"` → `from "../types"` (in `useFicusChat.ts`)

### `index.ts` updated

Re-exports were updated to reflect the new subfolder paths:

```ts
// Before
export { default as FicusAI } from './FicusAI';
export { useFicusChat } from './useFicusChat';
export * from './types';

// After
export { default as FicusAI } from './components/FicusAI';
export { useFicusChat } from './hooks/useFicusChat';
export * from './types';
```

### External consumer updated

- `src/components/ui/navigation/RotomNav.tsx` — import updated from `"../../smartrotom/ficusai/FicusAI"` to `"@/features/ficusai/components/FicusAI"`.

### Files deleted
- `src/components/smartrotom/ficusai/` (entire directory)

---

## 9. Boffmedia navigation moved to `features/boffmedia/navigation/`

### Reason
`FicusNav`, `ToolsMenu`, `WingullMenu`, `NotificationPopover`, and `DropdownMenu` are all boffmedia-section-specific. None of them are used outside `app/(boffmedia)/`. Placing them in the global `components/ui/navigation/` namespace implied they were globally reusable design system components, which they are not.

### Files moved

| From | To |
|---|---|
| `components/ui/navigation/FicusNav.tsx` | `features/boffmedia/navigation/FicusNav.tsx` |
| `components/ui/navigation/ToolsMenu.tsx` | `features/boffmedia/navigation/ToolsMenu.tsx` |
| `components/ui/navigation/WingullMenu.tsx` | `features/boffmedia/navigation/WingullMenu.tsx` |
| `components/ui/navigation/NotificationPopover.tsx` | `features/boffmedia/navigation/NotificationPopover.tsx` |
| `components/ui/navigation/DropdownMenu.tsx` | `features/boffmedia/navigation/DropdownMenu.tsx` |

### Import path updates in `FicusNav.tsx`

After the move, `FicusNav.tsx` still referenced globally-shared navigation components via relative paths. These were converted to `@/` aliases:

| Relative import (old) | Absolute import (new) |
|---|---|
| `"./Link"` | `"@/components/ui/navigation/Link"` |
| `"./LanguageSwitcher"` | `"@/components/ui/navigation/LanguageSwitcher"` |
| `import("./UserAuthSection")` | `import("@/components/ui/navigation/UserAuthSection")` |
| `{ HerramientasMenu } from "./ToolsMenu"` | `{ ToolsMenu } from "./ToolsMenu"` |

Cross-directory imports (`./WingullMenu`, `./DropdownMenu`, `./NotificationPopover`) remained as-is since all five files moved together.

### Consumer updated

- `src/app/(boffmedia)/layout.tsx` — import updated from `@/components/ui/navigation/FicusNav` to `@/features/boffmedia/navigation/FicusNav`.

### `components/ui/navigation/` after cleanup

Only 4 truly global navigation files remain, all of which are used across multiple sections:

```
components/ui/navigation/
├── LanguageSwitcher.tsx    ← used by FicusNav, RotomNav, and others
├── Link.tsx                ← used project-wide (InternalLink)
├── NavButton.tsx           ← used by RotomNav
└── UserAuthSection.tsx     ← used by FicusNav and smartrotom routes
```

### Files deleted from `components/ui/navigation/`
- `FicusNav.tsx`
- `ToolsMenu.tsx`
- `WingullMenu.tsx`
- `NotificationPopover.tsx`
- `DropdownMenu.tsx`

---

## 10. `RotomNav.tsx` moved to `components/smartrotom/`

### Reason
`RotomNav` is the navigation bar for the smartrotom section. It is only consumed by `AppWrapper.tsx` and `404.tsx`, both of which already live in `components/smartrotom/`. Having it in `components/ui/navigation/` was incorrect — it carries smartrotom-specific domain logic (socket status, FicusAI integration, Minecraft functions, breadcrumb navigation).

### File moved

| From | To |
|---|---|
| `components/ui/navigation/RotomNav.tsx` | `components/smartrotom/RotomNav.tsx` |

### Import changes inside `RotomNav.tsx`

Before moving, all relative imports in the file were converted to `@/` aliases so the file is location-independent:

| Relative import (old) | Absolute import (new) |
|---|---|
| `"../Hora"` | `"@/components/ui/Hora"` |
| `"../primitives/badge"` | `"@/components/ui/primitives/badge"` |
| `"../../smartrotom/BreadcrumbNav"` | `"@/components/smartrotom/BreadcrumbNav"` |
| `"../../smartrotom/Settings"` | `"@/components/smartrotom/Settings"` |
| `"../primitives/popover"` | `"@/components/ui/primitives/popover"` |
| `"../../smartrotom/MinecraftFunctions"` | `"@/components/smartrotom/MinecraftFunctions"` |
| `"./NavButton"` | `"@/components/ui/navigation/NavButton"` |
| `"./LanguageSwitcher"` | `"@/components/ui/navigation/LanguageSwitcher"` |

### Consumer files updated

- `src/components/smartrotom/AppWrapper.tsx` — import updated from `"../ui/navigation/RotomNav"` to `"./RotomNav"`.
- `src/components/smartrotom/404.tsx` — import updated from `"../ui/navigation/RotomNav"` to `"./RotomNav"`.

### Files deleted from `components/ui/navigation/`
- `RotomNav.tsx`

---

## What was explicitly NOT changed

### `smartrotom/ui/badge.tsx` and `smartrotom/ui/button.tsx`

Despite sharing names with `components/ui/primitives/badge.tsx` and `components/ui/primitives/button.tsx`, these were **not** removed. They are distinct implementations:

- `SmartRotomBadge` uses a custom neobrutalism variant system with `"button"`, `"neutral"`, and `"default"` variants — incompatible with the global `Badge`.
- `SmartRotomButton` uses a different shadow/hover motion variant system (`"furret"`, `"noShadow"`, `"reverse"` etc.) — incompatible with the global `Button`.

These remain at `components/smartrotom/ui/` as the SmartRotom design system layer.

### `eventos/[id]/_components/LoadingSpinner.tsx`

Despite sharing a name with `components/ui/display/LoadingSpinner.tsx`, these are two different components:

- The one in `_components/` is a full-page branded spinner with Orbitron font, dual-ring animation, and a default label — specific to boffmedia event loading states.
- The global one is a compact inline spinner using Lucide's `Loader2` icon with platform-specific theming (YouTube/Twitch).

No deduplication was performed. Both remain in their respective locations.

### `app/**/_components/` directories (~60 total)

The co-location convention was confirmed as correct and left untouched. `_components/` directories hold route-private components that do not need to be promoted. This is the recommended Next.js App Router pattern.

---

## Resulting `src/features/` structure

```
src/features/
├── authOptions.ts           ← pre-existing (not part of this refactor)
├── boffmedia/
│   ├── BoffCard.tsx
│   ├── event/
│   │   ├── AchievementBadge.tsx
│   │   ├── EventCard.tsx
│   │   ├── EventStatusChip.tsx
│   │   └── rarityTokens.ts
│   ├── layouts/
│   │   └── GameToolsLayout/
│   ├── leaderboard/
│   │   ├── LeaderboardCard.tsx
│   │   ├── LeaderboardEmptyState.tsx
│   │   └── LeaderboardList.tsx
│   ├── navigation/
│   │   ├── DropdownMenu.tsx
│   │   ├── FicusNav.tsx
│   │   ├── NotificationPopover.tsx
│   │   ├── ToolsMenu.tsx
│   │   └── WingullMenu.tsx
│   ├── sections/
│   │   ├── SectionEmpty.tsx
│   │   ├── SectionError.tsx
│   │   ├── SectionFilters.tsx
│   │   ├── SectionHeader.tsx
│   │   ├── SectionLoading.tsx
│   │   └── index.ts
│   └── tools/
│       ├── BoffButton.tsx
│       ├── BoffContainer.tsx
│       ├── ExternalResources.tsx
│       ├── FeaturedTool.tsx
│       ├── GameToolsPage.tsx
│       ├── PageHeader.tsx
│       ├── ToolSectionHeader.tsx
│       ├── ToolsGrid.tsx
│       ├── ToolsPageLayout.tsx
│       └── utils/
│           ├── boffVariants.ts
│           └── getBoffStyle.ts
└── ficusai/
    ├── components/
    │   ├── BiomeListCard.tsx
    │   ├── ChatHeader.tsx
    │   ├── ChatInput.tsx
    │   ├── ChatMessages.tsx
    │   ├── CompletePokemonCard.tsx
    │   ├── FicusAI.tsx
    │   ├── MessageBubble.tsx
    │   ├── PokemonHabitatCard.tsx
    │   ├── PokemonMovesCard.tsx
    │   ├── PokemonStatsCard.tsx
    │   └── PokemonTypesCard.tsx
    ├── hooks/
    │   └── useFicusChat.ts
    ├── index.ts
    ├── types.ts
    └── README.md
```

---

## Component placement rules (going forward)

| Layer | Location | Rule |
|---|---|---|
| **Primitives** | `components/ui/primitives/` | Pure shadcn/radix elements. No business logic, no domain knowledge. |
| **Display utilities** | `components/ui/display/` | Generic display components used in 3+ unrelated routes. No business logic. |
| **Interactive utilities** | `components/ui/interactive/` | Generic interactive components. No business logic. |
| **Form utilities** | `components/ui/form/` | Generic form components. No business logic. |
| **Global navigation** | `components/ui/navigation/` | Navigation components used across multiple sections (Link, LanguageSwitcher, UserAuthSection). |
| **Shared utilities** | `components/shared/` | Technical utilities (audio, maps, editors, etc.) with no domain models. |
| **Feature components** | `features/{domain}/` | Uses domain types. Used by 2+ routes in the same domain. |
| **Route-private** | `app/**/_components/` | Used by exactly one route or sub-tree. **Default location for new components.** |

**Promotion path:** `_components/` → `features/` → `components/` as usage expands. Never skip levels.

---

## Second Pass — `_components/` Audit (April 2026)

A second-pass audit of all 64 `_components` directories in `src/app/` was performed. Seven categories of improvements were identified and executed.

### Summary

| # | Action | Files affected |
|---|---|---|
| P1 | Delete 7 stale draft/copy files | 7 files deleted |
| P2 | Promote `TypeBadge` to `components/shared/pokemon/` | 14 imports updated |
| P3 | Extract `biblioteca` shared files to `otros/_components/` | 3 files moved, 2 files updated |
| P4 | Promote `EventRegistrationButton` to `(eventos)/_components/` | 1 file moved, 1 import updated |
| P5 | Move non-component files out of `_components/` | 5 files moved, 1 import updated |
| P6 | Restructure `chatapp/_components/` into subfolders | 18 files moved, 10 imports updated |
| P7 | Restructure `mhwilds/builds/planner/_components/` into subfolders | 15 files moved, 25+ imports updated |

---

### P1. Delete stale draft files

Seven backup/copy files committed by accident were deleted. These had no importers and were never referenced from any route.

---

## API Services — Shared Types Migration

**Date:** May 2026  
**Scope:** `apps/web/src/services/api/**` and `apps/api/src/api/**`

All handwritten local interface/type definitions in client-side API service wrappers were replaced with type aliases pointing to the auto-generated `@boffmedia/shared` types. Each migration follows the same pattern:

1. Add `@ApiResponse({ type: EntityClass })` to the NestJS controller endpoint
2. Create any missing response entity class in `apps/api/src/api/**/entities/`
3. Run `pnpm run --filter api generate:shared` (API must be running on port 34301)
4. In the web service file: import the generated type, remove the local interface, and export a backward-compatible type alias

### Migrated services

| Service file | Local types removed | Shared types used |
|---|---|---|
| `services/api/boffmedia/vgcService.ts` | `VgcPokemonUsage`, `VgcMetaResponse`, `VgcSpeedTier`, etc. | `PokemonUsageEntry`, `PokemonUsageDetail`, `SpeedTierEntry`, etc. |
| `services/api/boffmedia/vgcTrackerService.ts` | `TrackerSession`, `TrackerMatch`, `TrackerSeries`, etc. | `Session`, `Match`, `Series`, `TrackerPreset`, etc. |
| `services/api/boffmedia/usersService.ts` | `BatchUsersRequest`, `UsersPaginatedResponse`, `UserRolesResponse`, `UserValidationResponse` | `BatchUsersDto`, `UsersPaginatedResponseEntity`, `UserRolesResponseEntity`, `UserValidationResponseEntity` |
| `services/api/smartrotom/wingullService.ts` | `ServerRegion`, `PixelmonPlayerStats` | `Region`, `PlayerStats` |
| `services/api/smartrotom/smartrotomService.ts` | `ArceuSpeak` | `ArceuSpeakEntity` |
| `services/api/smartrotom/ficusAiService.ts` | `UserStats`, `HealthStatus` | `FicusAiUserStatsEntity`, `FicusAiHealthEntity` |
| `services/api/smartrotom/playerService.ts` | `Pokemon` | `PokemonW` |

### New server entities created

| Entity file | Used by |
|---|---|
| `api/boffmedia/users/entities/users-paginated-response.entity.ts` | `GET /users` |
| `api/boffmedia/users/entities/user-roles-response.entity.ts` | `GET /users/:id/roles` |
| `api/boffmedia/users/entities/user-validation-response.entity.ts` | `GET /users/validate/:type/:identifier` |
| `api/boffmedia/users/dto/batch-users.dto.ts` | `POST /users/batch` |
| `api/smartrotom/_main/entities/arceuspeak.entity.ts` | `GET /smartrotom/arceuspeak` |
| `api/smartrotom/ficusai/entities/ficusai-user-stats.entity.ts` | `GET /smartrotom/ficusai/stats` |
| `api/smartrotom/ficusai/entities/ficusai-health.entity.ts` | `GET /smartrotom/ficusai/health` |

### Stable roles subpath export

To prevent `generate:shared` from overwriting the `UserRole` enum re-export that many files depend on, a stable subpath was added to `packages/shared/package.json`:
- `exports["./roles"] = "./src/roles.ts"`
- All `UserRole` imports across the codebase now use `@boffmedia/shared/roles` instead of `@boffmedia/shared`

### Known exceptions (intentionally local)

| Service | Local type | Reason |
|---|---|---|
| `ficusAiService.ts` | `MessagePart`, `FicusMessageContent` | Frontend-only union refinements of `FicusMessageContentDto` — not an API contract |
| `playerService.ts` | `MinecraftStats` | Raw Wingull external API response shape (outer `{ stats: {...} }` wrapper); the player module returns raw axios `res.data` unlike the wingull repository which extracts `response.data.data` |
| `ligaService.ts` | `ReplayResponse = any` | No server-side liga module exists yet |
| `scrapeService.ts`, `mangaService.ts` | SSE event types | Frontend-composed SSE event shapes, not REST response contracts |

**Files deleted:**
- `(herramientas)/pokemon/tcgpocket/_components/CardItem copy.tsx`
- `battlesim/_components/BattleCanvas copy.tsx`
- `battlesim/replay/_components/Game copy 2.txt`
- `battlesim/replay/_components/Game copy.txt`
- `battlesim/replay/_components/Game original.txt`
- `battlesim/replay/_components/Game-Good.txt`
- `battlesim/replay/_components/battle.txt`

---

### P2. Promote `TypeBadge` → `components/shared/pokemon/`

`TypeBadge` and `TypeBadgeSmall` were defined in `smartrotom/pokedex/entrada/[[...params]]/_components/TypeBadge.tsx` — a deeply-nested route-private directory. However, they were directly imported by 14 files across 5 different sections: `smartrotom/pokedex/tipos`, `smartrotom/pokedex/movimientos`, `smartrotom/pc`, `features/ficusai`, and `battlesim`.

The component also exports the `colors` map (used for styling by `PokemonCard` and `PokemonTypeEffectiveness`) and was the only shared Pokemon type utility in the codebase.

**File moved:**
- `app/smartrotom/pokedex/entrada/[[...params]]/_components/TypeBadge.tsx`
  → `components/shared/pokemon/TypeBadge.tsx`

**All 14 consumers updated** to import from `@/components/shared/pokemon/TypeBadge`.

---

### P3. Extract `biblioteca` shared files to `otros/_components/`

`ConsolePicker.tsx`, `RegionFilter.tsx`, and `consoles.ts` lived in `biblioteca/_components/` but were also imported directly by the sibling `myrient/_components/MyrientDownloader.tsx`. This was a cross-sibling `_components` import — a violation of the co-location rule.

Since both `biblioteca` and `myrient` are children of `(herramientas)/otros/`, the three shared files were promoted to `otros/_components/`.

**Files moved:**
- `otros/biblioteca/_components/consoles.ts` → `otros/_components/consoles.ts`
- `otros/biblioteca/_components/ConsolePicker.tsx` → `otros/_components/ConsolePicker.tsx`
- `otros/biblioteca/_components/RegionFilter.tsx` → `otros/_components/RegionFilter.tsx`

**Files updated:**
- `otros/myrient/_components/MyrientDownloader.tsx` — imports updated from `'../../biblioteca/_components/X'` to `'../../_components/X'`
- `otros/biblioteca/_components/LocalLibrary.tsx` — imports updated from `'./X'` to `'../../_components/X'`

---

### P4. Promote `EventRegistrationButton` to `(eventos)/_components/`

`EventRegistrationButton.tsx` was in `(eventos)/eventos/_components/` (route-scoped to the `/eventos` listing). But it was imported by `EventHero.tsx` in the sibling route `(eventos)/eventos/[id]/_components/` — a cross-sibling import.

Since it spans multiple routes under `(eventos)/`, it was promoted to `(eventos)/_components/` (the shared parent scope).

**File moved:**
- `(eventos)/eventos/_components/EventRegistrationButton.tsx`
  → `(eventos)/_components/EventRegistrationButton.tsx`

**File updated:**
- `(eventos)/eventos/[id]/_components/EventHero.tsx` — import updated from `"../../_components/EventRegistrationButton"` to `"../../../_components/EventRegistrationButton"`.

---

### P5. Move non-component files out of `_components/`

Six non-component files were found inside `_components/` directories. These were moved to their route's root level.

**TypeScript type/config files:**
- `smartrotom/arcade/voltorb/_components/types.ts` → `voltorb/types.ts`
- `smartrotom/arcade/voltorb/_components/config.ts` → `voltorb/config.ts`
- All 4 consumers inside `voltorb/_components/` updated: `'./types'` → `'../types'`, `'./config'` → `'../config'`
- `battlesim/replay/_components/types.ts` — confirmed unused (consumers already used `battlesim/types.ts`). Deleted.

**Asset files:**
- `smartrotom/starbank/_components/protruding-squares.svg` → `starbank/protruding-squares.svg` (not imported anywhere, just moved)
- `battlesim/_components/test.css` → `battlesim/test.css`. Consumer `PokemonStatus.tsx` updated from `'./test.css'` to `'../test.css'`.
- `smartrotom/pasaporte/_components/index.css` → `pasaporte/index.css` (not imported anywhere, just moved)

---

### P6. Restructure `chatapp/_components/` (21 files → 3+11+7)

The `chatapp/_components/` directory had 21 flat files with two clear semantic groups that were only used within `_components` itself. These were reorganized into subfolders.

**New structure:**
```
chatapp/_components/
├── Chat.tsx          ← kept at root (imported by page.tsx)
├── Contact.tsx       ← kept at root
├── CreateGroup.tsx   ← kept at root
├── messages/
│   ├── Message.tsx
│   ├── CallMessage.tsx
│   ├── ChatBubble.tsx
│   ├── DocumentMessage.tsx
│   ├── EmojiMessage.tsx
│   ├── ImageMessage.tsx
│   ├── StickerMessage.tsx
│   ├── SystemMessage.tsx
│   ├── TextMessage.tsx
│   ├── VideoMessage.tsx
│   └── WaypointMessage.tsx
└── pickers/
    ├── AttachmentMenu.tsx
    ├── DocumentPicker.tsx
    ├── EmojiPicker.tsx
    ├── EmojiStickerMenu.tsx
    ├── ImageGalleryPicker.tsx
    ├── StickerPicker.tsx
    └── WaypointPicker.tsx
```

**Import changes:**
- `Chat.tsx`: `"./Message"` → `"./messages/Message"`, `"./AttachmentMenu"` → `"./pickers/AttachmentMenu"`, `"./EmojiStickerMenu"` → `"./pickers/EmojiStickerMenu"`
- All 9 files in `messages/` that imported `from "../_types/Chat"`: updated to `from "../../_types/Chat"` (one extra `../` due to subfolder depth)
- Internal same-folder imports (`Message.tsx` → `./SystemMessage` etc., `AttachmentMenu.tsx` → `./ImageGalleryPicker` etc.) required no changes.

---

### P7. Restructure `mhwilds/builds/planner/_components/` (18 files → 3+4+7+4)

The flat directory of 18 files was reorganized into `build/`, `equipment/`, and `stats/` subfolders. Shared utilities (`MHWildsPanel.tsx`, `equipment-utils.ts`, `utils.ts`) remain at the root of `_components/` since they are imported by files across all three subfolders.

**New structure:**
```
planner/_components/
├── MHWildsPanel.tsx      ← shared panel component (root)
├── equipment-utils.ts    ← shared utilities (root)
├── utils.ts              ← shared utilities (root)
├── build/
│   ├── BuildDisplay.tsx
│   ├── BuildHeader.tsx
│   ├── BuildImport.tsx
│   └── SavedBuildsManager.tsx
├── equipment/
│   ├── CharmSelector.tsx
│   ├── ComponentSlot.tsx
│   ├── CurrentEquipment.tsx
│   ├── DecorationSelector.tsx
│   ├── EquipmentFilters.tsx
│   ├── EquipmentItem.tsx
│   └── EquipmentSelector.tsx
└── stats/
    ├── ElementalResistances.tsx
    ├── SharpnessBar.tsx
    ├── SkillsList.tsx
    └── StatsDisplay.tsx
```

**Import changes (per-file):**
- `build/BuildDisplay.tsx`: `./utils` → `../utils`, `./ComponentSlot` → `../equipment/ComponentSlot`, `./equipment-utils` → `../equipment-utils`, `./MHWildsPanel` → `../MHWildsPanel`
- `build/BuildHeader.tsx` + `build/SavedBuildsManager.tsx`: `"../_utils/buildUtils"` → `"../../_utils/buildUtils"`
- `build/BuildImport.tsx` + all `equipment/` and `stats/` files importing external types: `"../../../../../../../types/tools/mhwilds"` → `"@/types/tools/mhwilds"` (alias, avoids fragile deep paths)
- All equipment files: `./equipment-utils` → `../equipment-utils`, `./MHWildsPanel` → `../MHWildsPanel`
- All stats files: `./equipment-utils` → `../equipment-utils`, `./MHWildsPanel` → `../MHWildsPanel`
- `planner/page.tsx`: all 8 `_components/X` imports updated to point at the correct subfolder.

---

### What was confirmed NOT worth restructuring (second pass)

- **`mewtube/` vs `mewtwitch/` components** — appeared similar (`History`, `VideoDetails`, `VideoStats`) but are completely different implementations with different APIs, props, and platforms (YouTube vs Twitch). Not duplicates.
- **`BackgroundDecorations.tsx`** in `wingull/` vs `wingull/pueblos/` — different implementations: one uses `next/image` with gradient/overlay, the other uses `FloatingOrb` components with color props. Not duplicates.
