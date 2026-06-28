# CSS Color System — Refactor Plan

> **Status:** Planning  
> **Scope:** `apps/web/` only  
> **Paradigm:** Semantic tokens as the public API. Raw palette steps are private implementation detail — components never reference them directly.

---

## Core Principle

Components consume **role + state** tokens, never raw colors.

```
bg-[var(--primary)]         ✅
bg-orange-500               ❌
bg-[var(--orange-500)]      ❌ (except brand-intentional moments)
bg-primary-500              ❌
```

The 50–950 palette scales are demoted from public API to private implementation detail. They stay in `themes.css` as the engine behind the semantic tokens, but nothing in components references `--primary-500` anymore.

---

## Token Architecture

### Private (implementation detail — `themes.css`, never used in components)

```css
/* Raw palette channels — RGB triplets for the color engine */
--_primary-50 … --_primary-950
--_secondary-50 … --_secondary-950
/* etc. */
```

These power the semantic tokens below. Palette themes (future 20+) swap these values by class on `<html>`.

### Public — Foundation (Layer 0)

```css
--bg               /* Application background */
--layer-1          /* Cards, primary content surfaces */
--layer-2          /* Inputs, elevated panels */
--layer-3          /* Popovers, dialogs, overlays */
--border           /* Default border */
--border-strong    /* High-emphasis border */
--text             /* Primary text */
--text-muted       /* Secondary text */
--text-dim         /* Disabled & placeholder text */
--shadow-color
--grid-dot
```

### Public — Surface Interaction

```css
--layer-hover      /* Any surface on :hover */
--layer-active     /* Any surface on :active / pressed */
```

### Public — Brand

```css
--primary           /* Hero action color (orange) */
--primary-hover
--primary-active
--primary-soft      /* Tinted background, ~12–15% opacity */
--on-primary        /* Text/icon on top of --primary */

--secondary         /* Support color (cyan) — replaces --accent */
--secondary-hover
--secondary-active
--secondary-soft
--on-secondary
```

> **Note on `--accent`:** The handoff used `--accent` as a swappable role (cyan by default). That concept maps to `--secondary` here. Existing `var(--accent)` references will be migrated to `var(--secondary)`. `--accent-bright` → `--secondary-hover`. `--accent-soft` → `--secondary-soft`.

### Public — Semantic Status

```css
--success           --success-soft   --success-border   --on-success
--warning           --warning-soft   --warning-border   --on-warning
--danger            --danger-soft    --danger-border    --on-danger
--info              --info-soft      --info-border      --on-info
```

> **Rename:** `--error` → `--danger` throughout.

### Public — Interactive

```css
--focus-ring        /* Keyboard focus outline */
--selection         /* Text selection highlight */
--link              /* Hyperlink */
--link-hover
--link-visited
--disabled-bg
--disabled-border
--disabled-text
```

### Public — Inputs

```css
--input-bg
--input-border
--input-border-hover
--input-border-focus
--input-placeholder
--input-valid
--input-invalid
```

### Public — State Overlays

Instead of scattering `rgba(...)` values, use:

```css
--hover-overlay     /* rgba at ~6–8% white/black */
--pressed-overlay   /* rgba at ~12% */
--selected-overlay  /* rgba at ~10% primary */
```

### Public — Dividers

```css
--divider           /* Lighter than --border, for row separators */
--divider-strong
```

### Public — Data & Charts

```css
--chart-1 … --chart-8
```

Maps to: orange, cyan, purple, emerald, amber, rose, blue, pink. These are the brand constants repackaged for data viz context.

### Public — Loading

```css
--skeleton
--skeleton-shimmer
```

### Public — Tables & Lists

```css
--row-hover
--row-selected
```

### Public — Scrollbars

```css
--scroll-thumb
--scroll-thumb-hover
--scroll-track
```

### Public — Effects

```css
--glass             /* Glassmorphism fill */
--glass-border
--scrim             /* Full-screen modal darkener */
```

### Brand Constants (public, intentional brand moments only)

```css
--orange-{300,400,500,600,700}
--cyan-{300,400,500,600}
--purple-{400,500,600}
--emerald-{400,500}   --amber-400   --rose-{400,500}
```

These are intentional — orange IS a named brand identity, not just "the current primary color". Used directly only for explicitly brand-anchored moments (selection highlight, eyebrow numerals, Pokémon type palette, etc.).

### Special — Pokémon / Game data

```css
--ty-normal … --ty-fairy   /* Type palette — game data, not UI */
--st-brn … --st-frz        /* Status colors */
--trk-win  --trk-loss  --trk-draw
```

These stay untouched — they are domain data colors, not UI tokens.

---

## File-by-File Changes

### `tailwind.config.ts`

- [ ] Delete `import { be } from "date-fns/locale"` (line 1 — unused)
- [ ] Change `darkMode: ["class"]` → `darkMode: ["selector", '[data-theme="dark"]']`
- [ ] Remove all hardcoded hex from `theme.extend.colors` (orange, cyan, purple, emerald, amber, rose)
- [ ] Remove `primary`, `secondary`, `accent`, `surface`, `highlight`, `success`, `warning`, `error`, `info` palette mappings — these are no longer a Tailwind public API
- [ ] Keep `gray` for compatibility
- [ ] Fix shadcn color bridge — rename all `hsl(var(--x))` references to use `--ui-*` prefix:
  ```ts
  border:     "hsl(var(--ui-border))",
  input:      "hsl(var(--ui-input))",
  ring:       "hsl(var(--ui-ring))",
  background: "hsl(var(--ui-background))",
  foreground: "hsl(var(--ui-foreground))",
  destructive: { DEFAULT: "hsl(var(--ui-destructive))", foreground: "hsl(var(--ui-destructive-foreground))" },
  muted:      { DEFAULT: "hsl(var(--ui-muted))", foreground: "hsl(var(--ui-muted-foreground))" },
  popover:    { DEFAULT: "hsl(var(--ui-popover))", foreground: "hsl(var(--ui-popover-foreground))" },
  card:       { DEFAULT: "hsl(var(--ui-card))", foreground: "hsl(var(--ui-card-foreground))" },
  ```
- [ ] Glow/shadow `boxShadow` values that hardcode `rgba(249, 115, 22, ...)` → reference CSS vars where possible, or accept as static brand constants

---

### `src/styles/themes.css`

- [ ] Delete `.old { }` block entirely
- [ ] Rename all shadcn vars to `--ui-*` prefix (full list in Tailwind section above)
- [ ] Rename `--background` (shadcn HSL) → `--ui-background` to stop colliding with handoff `--bg`
- [ ] Demote 50–950 palette vars to private: prefix with `--_` (e.g. `--_primary-500`) or drop from CSS vars entirely and hardcode into the semantic tokens that consume them
- [ ] Keep palette vars as the engine — but they are now only referenced by the semantic tokens in globals.css, never by components

---

### `src/app/globals.css`

**Rename surface semantic tokens:**
- `--surface` → `--layer-1`
- `--surface-2` → `--layer-2`
- `--surface-3` → `--layer-3`
- Apply in both `[data-theme="dark"]` and `[data-theme="light"]` blocks

**Add missing semantic tokens** (values for dark and light each):
- Surface interaction: `--layer-hover`, `--layer-active`
- Overlays: `--hover-overlay`, `--pressed-overlay`, `--selected-overlay`
- Inputs: `--input-bg`, `--input-border`, `--input-border-hover`, `--input-border-focus`, `--input-placeholder`, `--input-valid`, `--input-invalid`
- Interactive: `--focus-ring`, `--selection`, `--link`, `--link-hover`, `--link-visited`
- Disabled: `--disabled-bg`, `--disabled-border`, `--disabled-text`
- Dividers: `--divider`, `--divider-strong`
- Tables: `--row-hover`, `--row-selected`
- Loading: `--skeleton`, `--skeleton-shimmer`
- Scrollbars: `--scroll-thumb`, `--scroll-thumb-hover`, `--scroll-track` (consolidate the two conflicting scrollbar definitions)
- Effects: `--glass`, `--glass-border`, `--scrim`
- Charts: `--chart-1` … `--chart-8`

**Brand role tokens — rename/add:**
- `--accent` → `--secondary` (same value, new name)
- `--accent-bright` → `--secondary-hover`
- `--accent-soft` → `--secondary-soft`
- `--on-accent` → `--on-secondary`
- Add: `--primary`, `--primary-hover`, `--primary-active`, `--primary-soft`, `--on-primary`
- Semantic status — add: `--danger`, `--danger-soft`, `--danger-border`, `--on-danger` (was `--error` territory)

**Clean up:**
- Consolidate the two `::-webkit-scrollbar` definitions (utilities.css hides scrollbars; globals.css styles them — remove the hide-all rule from utilities.css, keep the styled one in globals.css using the new `--scroll-*` tokens)

---

### Codebase-wide migrations

**Priority 1 — rename existing vars (find-and-replace, low risk):**

| Find | Replace |
|------|---------|
| `var(--surface)` | `var(--layer-1)` |
| `var(--surface-2)` | `var(--layer-2)` |
| `var(--surface-3)` | `var(--layer-3)` |
| `var(--accent)` | `var(--secondary)` |
| `var(--accent-bright)` | `var(--secondary-hover)` |
| `var(--accent-soft)` | `var(--secondary-soft)` |
| `var(--on-accent)` | `var(--on-secondary)` |

Grep targets: `.tsx`, `.css` in `apps/web/src`. ~400 total occurrences.

**Priority 2 — harden components to use semantic tokens:**

Spot-check `components/boffmedia/primitives/` for any remaining raw color classes:
- `bg-orange-500` on a button → `bg-[var(--primary)]`
- `text-orange-500` on a link → `color: var(--link)` or `color: var(--primary)`
- `bg-[color-mix(...var(--orange-500)...)]` tinted bg → `bg-[var(--primary-soft)]`
- `text-cyan-400` for accent text → `color: var(--secondary-hover)`

**Priority 3 — deferred (shadcn layer, separate track):**

`components/ui/primitives/` — 1 097 `bg-primary-{n}`, `bg-surface-{n}` class usages. These work today. Migrate in a dedicated pass after the token system stabilizes.

---

### Showcase page — `FoundationsSection()`

Replace the current BRAND / SUPPORT / SEMANTIC / SURFACES arrays with:

1. **Foundation tokens** — `--bg`, `--layer-1/2/3`, `--border`, `--border-strong`, `--text`, `--text-muted`, `--text-dim` — live swatches (react to theme toggle)
2. **Brand colors** — `--primary`, `--primary-soft` + brand constants strip
3. **Secondary / accent** — `--secondary` and its states
4. **Semantic status** — success / warning / danger / info, showing base + soft + border for each
5. **Interaction tokens** — overlays, input states, focus-ring, disabled — shown as labeled tiles
6. **Chart palette** — `--chart-1` … `--chart-8` color strip
7. **Effects** — skeleton, glass, scrim

---

## Implementation Order

1. `tailwind.config.ts` — delete stale import, fix darkMode, rename shadcn bridge, remove palette mappings
2. `themes.css` — delete `.old`, rename `--ui-*`, prefix private palette vars with `--_`
3. `globals.css` — rename surface tokens, rename accent→secondary, add all missing semantic tokens
4. `utilities.css` — remove duplicate scrollbar hide rule
5. `pnpm type-check` + browser visual check (nothing should visually change yet)
6. Priority 1 find-and-replace (`--surface*`, `--accent*`)
7. Priority 2 spot-check boffmedia primitives for raw color classes
8. `pnpm type-check` again
9. Showcase page update
10. Shadcn layer migration — separate PR, separate planning

---

## What Does NOT Change

- Brand constant values — same hex, same names
- Pokémon type / status / track colors — domain data, untouched
- Typography scale, spacing, motion tokens, border radius
- `components/ui/primitives/` (shadcn layer) — deferred
- Direction tokens (`--card-bg`, `--card-shadow`, `--btn-radius`) — stay, but after step 6 they reference `--layer-1` instead of the old `--surface`
- 3-direction visual system (HUD / Neon / Grid) — untouched
