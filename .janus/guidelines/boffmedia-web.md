---
description: Next.js Boffmedia section — pages, components, design system
applyTo:
  - "apps/web/src/app/(boffmedia)/**/*.tsx"
  - "apps/web/src/components/boffmedia/**/*.tsx"
  - "apps/web/src/services/api/boffmedia/**/*.ts"
---

## Product Context

Boffmedia is a gaming tools platform. Sections:
- `herramientas/` — Gaming tools (this is the **design system baseline**)
- `eventos/` — Events
- `admin/` — Admin panel
- `perfil/` — User profile
- `community/` — Community pages

All Boffmedia sections must stay visually consistent with `herramientas/`.

## Layout

- Root layout: `apps/web/src/app/(boffmedia)/layout.tsx`
- Uses `FicusNav` for global navigation.
- Uses `GlobalProviders` wrapper.
- Toast notifications: `react-toastify`.

## Component Architecture

### Boffmedia Design System (THE ACTUAL PRIMITIVES)

Boffmedia has its **own design system** at `components/boffmedia/primitives/` with 78 custom components. These are the primitives actually used in the app:

**Core UI**: `BoffButton`, `BoffCard`, `BoffBadge`, `BoffInput`, `BoffSwitch`, `BoffCheckbox`, `BoffSlider`, `BoffProgress`, `BoffAvatar`, `BoffSkeleton`, `BoffTabs`, `BoffTooltip`, `BoffModal`, `BoffPopover`, `BoffAlert`, `BoffSpinner`

**Layout/Navigation**: `ToolPanel`, `ToolApp`, `ToolTable`, `ToolSelect`, `ToolStatBars`, `GamePanel`, `ActionBar`, `Breadcrumb`, `Pagination`, `SegTabs`, `Segmented`

**Data Display**: `Stat`, `StatTile`, `HpBar`, `SplitBar`, `TrendChart`, `HeatGrid`, `ResultBadge`, `TagPills`, `CodeBlock`, `EmptyState`, `CopyButton`

**Battle Simulator (BS)**: `BSType`, `BSStatusChip`, `BSBoost`, `BSTera`, `BSPokeChip`, `BSMove`, `BSMonCard`, `BSFieldCond`, `BSHpMeter`, `BSTracker`, `BSTraySlot`, `BSWinProb`, `BSTimer`, `BSLogEvent`

**Battle Sim v2 (BSX)**: `BSXRing`, `BSXPlate`, `BSXKey`, `BSXOrderRail`, `BSXPlanChip`, `BSXBenchChip`, `BSXTeraBtn`, `BSXTick`, `BSXSpark`, `BSXScorePlate`

All exported from `components/boffmedia/primitives/index.ts`.

### Domain UI

`components/boffmedia/ui/` contains domain-specific components organized by feature:
- `admin/` — Admin panel components
- `events/` — Event components
- `games/` — Game components
- `tools/` — Tool components
- `vgc/` — VGC (competitive Pokémon) components
- `navigation/` — FicusNav and related
- `profile/` — User profile components
- `leaderboard/` — Leaderboard components
- `layout/` — Layout components
- `system-states/` — Loading, error, empty states

### Layer Rules

| Layer | Location | Rule |
|---|---|---|
| Boffmedia primitives | `components/boffmedia/primitives/` | **Use these** — the actual design system |
| Boffmedia domain UI | `components/boffmedia/ui/` | Feature-specific, uses primitives above |
| Global primitives | `components/ui/primitives/` | shadcn/Radix base — fallback only |
| Shared utilities | `components/shared/` | Technical, no domain models |
| Route-private | `app/**/_components/` | **Default for new components** |

**Promotion path**: `_components/` → `features/` → `components/` — justify each promotion.

## Design Tokens

- **Primary**: Boffmedia primitives at `components/boffmedia/primitives/`.
- **Fallback**: shadcn/Radix at `components/ui/primitives/`.
- Tailwind CSS for styling.
- Theme: dark mode default, `globals.css` for base styles.
- CSS variables for colors (e.g., `var(--accent)`, `var(--text)`, `var(--border-strong)`).

## API Calls

- All HTTP calls go through `apps/web/src/services/api/boffmedia/`.
- Never inline `fetch` in components.
- Types from `@boffmedia/shared`.

## i18n

- Uses `next-intl`.
- Always use translation keys — never hardcode user-facing strings.
- Locale files in `apps/web/locales/`.

## Key Files

- Primitives index: `components/boffmedia/primitives/index.ts`
- `FicusNav`: `components/boffmedia/ui/navigation/FicusNav.tsx`
- `BoffFooter`: `app/(boffmedia)/_components/layout/BoffFooter.tsx`
- `GlobalProviders`: `app/GlobalProviders.tsx`
