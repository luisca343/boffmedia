# 🧠 Boffmedia VGC Damage Calculator — AI Implementation Guide

## 🎯 Objective
Integrate a **full-featured Pokémon Damage Calculator** into the existing Boffmedia VGC section:

**Path:** `/app/(boffmedia)/(herramientas)/pokemon/vgc/damage-calculator`

This is a **production-grade feature**, not a prototype conversion.

---

## ⚠️ Core Rule (Priority)
When conflicts arise:

> ✅ ALWAYS match **Boffmedia design, UX, and architecture** over the provided HTML prototype.

---

## 🧱 Tech Stack & Constraints

- Framework: **Next.js (App Router)**
- Styling: **Tailwind (existing config)**
- State: **Zustand** with `subscribeWithSelector`
- Language: **Strict TypeScript**
- Damage calc: `@smogon/calc` v0.11.0 (upgraded from 0.10.0)
- Pokémon game data: server API `GET /tools/vgc/champions/:reg/game-data` for moves/items/abilities (backed by `@pkmn/sim` on the server, scoped to the active regulation); natures are hardcoded static constants (game mechanics, never change)
- i18n: `next-intl`, namespace `vgc.calc`

### Champions Format Notes
- Uses SP (Spirit Points): 66 total, 32 max per stat (vs standard 510/252 EVs)
- SP → EV approximation: `floor(sp * 252 / 32)` — exact at extremes, ±1 at mid values
- Toggle via `useChampions` store flag; default regulation is `gen9championsvgc2026regma`

### ⚠️ Critical: The API owns ALL Pokémon Dex logic — the web has none

`@pkmn/dex` and `@pkmn/sim` are **server-side only**. The web client has zero Dex logic.
All game data — species, moves, items, abilities — flows from NestJS through typed HTTP endpoints.

> **Rule:** If you need Pokémon data on the web, add or call an API endpoint.
> Never import `@pkmn/dex`, `@pkmn/sim`, or `@pkmn/data` in any web file.

**Reason:** The server runs `@pkmn/sim` with the Champions mod registered. Only the server knows which moves, abilities, and items are legal in a given regulation. Any client-side Dex call would be format-agnostic and incorrect.

**Data sources by type:**

| Data | API Endpoint | Client hook / service |
|---|---|---|
| Legal Pokémon + base stats | `GET /tools/vgc/champions/:reg/pokemon` | `useLegalPokemon(regulationId)` |
| Moves / Items / Abilities | `GET /tools/vgc/champions/:reg/game-data` | `useGameData(regulationId)` in `usePokemonData.ts` |
| Speed tiers | `GET /tools/vgc/champions/:reg/speed-tiers` | `VgcService.getChampionsSpeedTiers()` |
| Natures | *(static constant — 25 values, never changes)* | `NATURES` named export from `usePokemonData.ts` |

All three regulation-scoped endpoints use `Dex.forFormat(format)` on the server so ban lists and mod overrides are applied automatically. Results are cached per `formatId` server-side (process lifetime) and per `regulationId` client-side (module-level Map, page session).

**Calling `useGameData(regulationId)`:**
- Takes the regulation ID from the Zustand store (`useCalculatorStore().regulation`).
- Returns `{ moveMap, moveNames, items, abilities, isLoaded }`. Never call without a regulation.
- `isLoaded` is `false` until the first fetch resolves — guard destructive actions (paste import, etc.) behind it.

`Dex.formats.get(formatId)` **cannot** be used as a substitute on the web: it returns format rule definitions (banlists, rulesets) but does not produce a filtered data list. That logic belongs on the server.

---

## 🧭 High-Level Responsibilities

The AI agent must:

1. Analyze existing VGC pages for patterns
2. Adapt (not blindly copy) the provided HTML design
3. Build a modular, scalable architecture
4. Preserve ALL features (matrix, speed, type calc, etc.)
5. Optimize performance aggressively
6. Ensure mobile + offline usability

---

## 🔍 Phase 0 — Discovery ✅ DONE

### Checklist
- [x] Inspect `/vgc` folder structure
- [x] Identify shared layout patterns
- [x] Extract reusable components (buttons, inputs, modals, etc.)
- [x] Review Tailwind config (colors, spacing, tokens)
- [x] Analyze how regulations/data are loaded in existing pages

---

## 🧩 Phase 1 — Architecture Design ✅ DONE

### Checklist
- [x] Define component tree
- [x] Separate UI / Logic / Data
- [x] Decide Zustand store structure (Pokémon, Field, UI)
- [ ] Plan URL state (shareable links) — deferred to Phase 7
- [ ] Plan localStorage persistence — deferred to Phase 7

---

## 🏗️ Phase 2 — Project Structure ✅ DONE

### Actual Structure Created

```
/damage-calculator/
  page.tsx                         ✅ Main page, 3-col layout [320px | 1fr | 320px]

  _types/
    calculator.ts                  ✅ StatKey, CalcPokemon, CalcMove, CalcField, DamageResult…

  _store/
    calculatorStore.ts             ✅ Zustand store (poke1, poke2, field, tabs, activeMoves)

  _lib/
    smogonAdapter.ts               ✅ calcDamage, calcAllMoves, getKOVerdict, getDamageColorClass
    spriteUtils.ts                 ✅ Re-exports spriteUrl/handleSpriteError from vgc-tracker

  _hooks/
    usePokemonData.ts              ✅ useGameData() — async hook fetching moves/items/abilities from server;
                                      NATURES — named static export (hardcoded game constants)

  _components/
    pokemon/
      PokemonSearch.tsx            ✅ Combobox with sprite + type icons
      StatTable.tsx                ✅ Stat | Base | IVs | EVs/SP | Total; nature highlighting
      MoveSlot.tsx                 ✅ Move search + BP/Type/Category overrides + Crit toggle
      HPBar.tsx                    ✅ Current HP input + color-coded bar
      PokemonPanel.tsx             ✅ Full panel: orange (attacker) / purple (defender)
    field/
      FieldPanel.tsx               ✅ Format, Weather, Terrain, side conditions
    moves/
      MoveStrip.tsx                ✅ Persistent top bar: both sides, 16 rolls, KO verdict
```

> ⚠️ **Correction:** The main page column layout is `320px | 1fr | 320px` (not `300px | 1fr | 300px` as previously documented). This matches the prototype spec.

---

## 🎨 Phase 3 — UI Implementation 🔄 IN PROGRESS

### Design Tokens (from prototype reference)

#### Colors
```
Background:         rgb(3, 5, 15)          — near-black blue
Surface:            rgb(8, 12, 24)         — panel background
Surface-mid:        rgb(12, 18, 32)        — nav / strip background
Border:             rgba(51, 65, 85, 0.5)  — default border
Text-primary:       rgb(226, 232, 240)
Text-secondary:     rgb(148, 163, 184)
Text-muted:         rgb(100, 116, 139)
Text-dim:           rgb(71, 85, 105)

Accent-orange:      rgb(249, 115, 22)      — attacker side
Accent-orange-soft: rgb(251, 146, 60)
Accent-violet:      rgb(168, 85, 247)      — defender side
Accent-violet-soft: rgb(192, 132, 252)

Damage-OHKO:        #ef4444
Damage-2HKO:        #f97316
Damage-possible:    #eab308
Damage-low:         rgb(148, 163, 184)

HP-high:            rgb(74, 222, 128)      — >50% HP
HP-mid:             rgb(234, 179, 8)       — 25–50% HP
HP-low:             rgb(239, 68, 68)       — <25% HP
```

#### Typography
```
Primary font:   'Inter', sans-serif
Mono font:      'Roboto Mono', monospace
Display font:   'Orbitron', sans-serif  (nav logo, panel titles, section headers)

Body:           13px / Inter / weight 400
Labels:         11px / Inter / weight 600 / color: text-muted
Section title:  10px / Orbitron / weight 800 / uppercase / letter-spacing 0.15em
Mono values:    11–12px / Roboto Mono / weight 400–700
Nav logo:       17px / Orbitron / weight 900
```

#### Spacing & Radius
```
Nav height:     56px
Panel padding:  12px
Card padding:   8px 10px
Gap (standard): 6–8px
Gap (tight):    3–4px

Border radius:
  Cards/panels:  7–8px
  Buttons/pills: 5–6px
  Badges:        9999px (pill)
  Tooltips:      9px
```

### Checklist
- [x] Navigation integrates with existing VGC/tools nav (ToolsMenu + i18n)
- [x] Layout matches full-screen tool pattern (`height: calc(100vh - 56px)`)
- [x] Replace custom HTML styles with Tailwind
- [ ] Ensure responsive behavior — **PENDING**
- [ ] Ensure accessibility basics — **PENDING**

---

## ⚙️ Phase 4 — Core Features 🔄 IN PROGRESS

### 🧬 Pokémon Panels ✅ DONE

Panels are 320px wide and scrollable. Each panel contains (top to bottom):
1. Panel title — "Pokémon 1 — Atacante" (orange) / "Pokémon 2 — Defensor" (violet)
2. PokéSearch combobox — autocomplete with sprite + type badges
3. Sprite + types row — 64×64 sprite + type badges + base stats summary
4. Tera Type select (color-coded by type)
5. Level number input
6. Stat table — HP/Atk/Def/SpA/SpD/Spe with Base/IVs/EVs/Total columns; nature colors: green (+), red (−)
7. Nature select — shows `+STAT -STAT` label
8. Ability select
9. Item select
10. Status select
11. HP bar — editable current HP + animated colored bar + Reset button
12. Boost row — buttons from −6 to +6, active=orange
13. Movimientos header + 4 Move Slots: name | BP | Type (colored) | Category | Crit toggle

Implementation status:
- [x] Stats (EVs/SP, IVs, Nature) with live computed totals
- [x] Moves (with BP/Type/Category/Crit overrides)
- [x] Tera type selector
- [x] HP tracking with visual bar
- [x] Ability, Item, Status, Boost (-6 to +6)

### ⚔️ Damage Calculation ✅ DONE
- [x] Integrated `@smogon/calc` v0.11.0
- [x] Champions SP format support
- [x] Handles crit, boosts, weather, terrain, side conditions, helping hand
- [x] Spread move tuple `[number[], number[]]` handled correctly
- [x] KO verdict (guaranteed OHKO/2HKO, possible OHKO/2HKO, no KO)

> ⚠️ **Note on Trick Room:** Trick Room is present in FieldState (the prototype includes it as a field condition toggling sort order in Speed view). It does NOT affect damage calculation and should not be wired into `@smogon/calc`. It only reverses the sort order in the Speed view.

### 🗺️ Navigation Tabs ✅ DONE

The app has **5 tabs**:

| Tab ID | Label | Description |
|---|---|---|
| `1v1` | 1 vs 1 | Single Pokémon vs single Pokémon, bidirectional |
| `teamvsmany` | Equipo → Muchos | Team attacks threat list — damage matrix |
| `manyvsteam` | Muchos → Equipo | Threat list attacks team — defensive matrix |
| `speed` | ⚡ Velocidad | Speed tier reference list |
| `typecalc` | 🔮 Tipos | Type coverage + defensive profile |

**Tab active style:** `bg-primary-500/15 border-primary-500/35 text-primary-400`

### 🏷️ Format / Regulation Picker ✅ DONE

A `Select` dropdown lives in the calculator header (right side). It fetches available Champions regulations from the API via the reused `useChampionsRegulations()` hook (from `../meta/_hooks/`). Selecting a regulation calls `setRegulation(reg.formatId)` + `setUseChampions(true)`.

- Default: `gen9championsvgc2026regma`
- While regulations load the picker is hidden; it appears once data arrives
- A small "SP" badge next to the picker indicates Champions SP mode is active
- Standard VGC formats are not yet offered (deferred — would require `setUseChampions(false)`)

Regulation is **wired to all tabs**:
- `PokemonPanel` reads `regulation` from the store → `useLegalPokemonNames` → `legalNames` prop on `PokemonSearch`. Covers 1v1 panels and Matrix View drawers (both use `PokemonPanel`).
- `SpeedView` reads `regulation` from the store → `VgcService.getChampionsSpeedTiers(regulation)` → Reference section shows only format-legal Pokémon.
- `TypeCalcView` operates on the user's own team (already-selected Pokémon), so no additional filtering needed.

### 📊 Matrix View ✅ DONE

Layout:
```
[ Compact Field Bar — full width ]
[ Side Panel 200px ] [ Matrix Table — flex 1 ] [ Side Panel 200px ]
```

- Side panels: scrollable slot cards (sprite + name + types + ×button). Import button (ClipboardPaste) at top + Add button at bottom.
- **Add button**: adds `defaultPokemon()` then immediately opens `PokeDrawer` for full editing (avoids dropdown-in-overflow clipping)
- **PokeDrawer**: fixed right-side panel (360px), overlay backdrop, full `PokemonPanel` inside, Escape closes
- **PasteImportModal**: fixed overlay, textarea for Showdown/PokéPaste text, live parse preview count, Import/Cancel buttons
- Matrix table: sticky header (defender columns) + sticky left (attacker rows with move sub-rows), KO badge per cell
- Uses `team` (up to 6) and `many` (up to 12) Pokémon arrays from the store

### ⚡ Speed View ✅ DONE

- Three sections: My Team (orange), Rivals (purple), Reference (format-legal Pokémon as flex-wrap sprite cards)
- Two independent modifier pill groups (My Team mods / Reference mods): Tailwind, Scarf, Para, TR, ±1, ±2
- `applyMods(spd, mods)`: tailwind×2 → paralyzed×0.5 → scarf×1.5 → boost stages (all `Math.floor`)
- Trick Room reverses sort order only; does not affect values
- Reference capped at 120 entries (200 with text filter active)
- Champions SP toggle respected via `useChampions` prop
- **Reference section reads `regulation` from store** → fetches `VgcService.getChampionsSpeedTiers(regulation)`. Module-level cache per regulation ID. Falls back to full `SPECIES_MAP` when `useChampions=false`. Label shows `(format)` indicator when filtered.

### 🧪 Type Calculator ✅ DONE
- Full Gen 9 type chart hardcoded as `TYPE_EFF: Record<string, Record<string, number>>`
- **Offensive Coverage**: rows = 18 defender types; cells = best effectiveness each team member can achieve using its own STAB types (`getBestOffenseEff(p.types, defenderType)`)
- **Defensive Coverage**: rows = 18 attacker types; cells = effectiveness against each team member's types (`getTypeEff(atkType, p.types)`)
- Insights panel: SE coverage counts per Pokémon (offensive) + weak/resist/immune profile (defensive)
- `bestOffType`: defender type most of the team has SE coverage against
- `bestDefType`: attacker type most of the team resists
- Empty state if no team Pokémon loaded

### 📥 Import/Export System ✅ DONE

**Paste import** is handled by `PasteImportModal` inside `MatrixView.tsx`:
- Uses `parseShowdownPaste(text)` from `@/features/vgc-tracker/showdown-parse` — the same canonical parser used by the tracker's `PresetManager`. Returns `PresetSlot[]` with `{ speciesId, speciesName, item?, ability?, moves: string[], nature? }`.
- Move BP/type/category are resolved via `moveMap` from `useGameData()`. The Import button is disabled until `isLoaded === true` (prevents importing with empty move data on slow connections).
- Species names are matched against `legalPokemon` via `toId()` for canonical lookup.
- `_lib/pokePasteParser.ts` (old custom parser) is no longer used — ⚠️ **can be deleted** (relied on `@smogon/calc`'s `GEN9.moves.get()` which was fragile and format-specific).

**Export** (`pokesToPaste`): ✅ implemented in `_lib/pokesToPaste.ts`
- Converts `CalcPokemon[]` to Showdown/PokéPaste format.
- Accepts `useChampions` flag: converts SP→EV via `floor(sp * 252 / 32)` before outputting.
- Used by the Saved Teams panel copy-to-clipboard action.

---

## 🧠 Phase 5 — State Management ✅ DONE

### State Shapes

#### PokémonState
```ts
{
  name: string;           // Pokémon name key matching POKEMON_DATA
  level: number;          // 1–100
  nature: string;         // key of NATURES
  ability: string;
  item: string;
  status: "Healthy" | "Burned" | "Paralyzed" | "Poisoned" | "Badly Poisoned" | "Frozen" | "Asleep";
  teraType: string;       // "None" or type name
  evs: { hp, atk, def, spa, spd, spe: number };  // 0–252
  ivs: { hp, atk, def, spa, spd, spe: number };  // 0–31
  boost: number;          // −6 to +6
  currentHP: number;      // −1 = max
  moves: MoveSlot[];      // always 4 elements
}

type MoveSlot = {
  key: string;    // move name key or ""
  bp: number;     // base power (overridable)
  type: string;   // type name
  cat: "physical" | "special" | "status";
  crit: boolean;
}
```

#### FieldState
```ts
{
  format: "Singles" | "Doubles";
  level: number;
  weather: string;       // "None" | "Sun" | "Rain" | "Sand" | "Snow" | ...
  terrain: string;       // "None" | "Electric" | "Grassy" | "Psychic" | "Misty"
  // Per-slot hazards (p1 = attacker/team side, p2 = defender/many side)
  p1StealthRock, p2StealthRock: boolean;
  p1Spikes, p2Spikes: 0|1|2|3;
  p1Reflect, p2Reflect: boolean;
  p1LightScreen, p2LightScreen: boolean;
  p1AuroraVeil, p2AuroraVeil: boolean;
  p1Protect, p2Protect: boolean;
  p1LeechSeed, p2LeechSeed: boolean;
  gravity, magicRoom, wonderRoom, trickRoom: boolean;  // trickRoom: speed sort only
}
```

#### Top-level app state also includes:
- `team` — array of up to 6 Pokémon (attacker side in matrix views)
- `many` — array of up to 12 Pokémon (threat/rival list in matrix views)
- `saved` — localStorage-persisted named groups

#### calcDamageRolls result shape
```ts
{
  min: number;
  max: number;
  minPct: number;
  maxPct: number;
  rolls: number[];   // all 16 damage rolls
  defHP: number;
  isPhys: boolean;
}
```

### Checklist
- [x] Centralized Zustand store (`calculatorStore.ts`)
- [x] Slices: poke1/poke2, field (with attackerSide/defenderSide), UI (activeTab, activeMoves)
- [x] `subscribeWithSelector` middleware for fine-grained subscriptions
- [x] `saved` slice: `SavedEntry[]` + `hydrateFromStorage` / `saveGroup` / `deleteSaved` / `renameSaved` / `loadSavedAsTeam` / `loadSavedAsManyList`
- [ ] Memoized selectors — partially done (useMemo in MoveStrip)
- [ ] Avoid unnecessary re-renders — needs profiling pass

---

## 🚀 Phase 6 — Performance Optimization ✅ DONE

- [x] `useMemo` on `calcAllMoves` in MoveStrip
- [x] Lazy-load `MatrixView`, `SpeedView`, `TypeCalcView`, `SavedTeamsPanel` via `React.lazy()` + `Suspense` — each is a separate JS chunk; only `PokemonPanel`/`FieldPanel`/`MoveStrip` are in the initial bundle
- [x] `TabFallback` spinner shown while lazy chunk loads (first visit only; subsequent switches are instant)
- [x] Deleted `_lib/pokePasteParser.ts` (dead code, was relying on `@smogon/calc` `GEN9.moves.get()`)
- [ ] `useCallback` pass on panel handlers — deferred (Zustand actions are already stable; no measurable re-render issue observed without profiling)
- [ ] Virtualize heavy tables if needed — deferred (Matrix is 6×12 max = 72 cells, renders fast)
- [ ] JS-positioned tooltips for matrix cells near edges — deferred to Phase 8 polish

---

## 💾 Phase 7 — Persistence & Sharing 🔄 IN PROGRESS

### Saved Teams Panel ✅ DONE

`_components/saved/SavedTeamsPanel.tsx` — slides in from right (320px width transition, no overlay, pushes content).

- Header: "EQUIPOS GUARDADOS" + 📋 Importar toggle + ✕ close
- Importar section (collapsible): paste textarea + name input → saves directly to library (uses `parseShowdownPaste` + `moveMap` + `legalPokemon` for full resolution)
- "+ Guardar Equipo" / "+ Guardar Rivales" → reveals name input + Guardar; disabled when list is empty
- Entry cards: 28×28 sprite strip + count + date · actions: → Equipo | → Rivales | 📋 Copiar (1.5s green ✓) | 👁 Ver (inline paste preview) | ✎ Rename (inline input) | ✕ Delete
- Entries displayed newest-first; hydrates from `localStorage` on mount (SSR-safe: `typeof window !== 'undefined'` guard)
- `BookmarkPlus` button in calculator header toggles panel; button reflects active state

```ts
// SavedEntry shape (in _types/calculator.ts)
interface SavedEntry {
  id: number        // Date.now()
  name: string
  pokeList: CalcPokemon[]
  savedAt: string   // ISO date
}
// localStorage key: "boffmedia_saved_teams"
```

Checklist:
- [x] LocalStorage sync (hydration-safe)
- [x] Hydration-safe logic (Next.js SSR) — `hydrateFromStorage` called in `useEffect`, never during SSR
- [ ] URL serialization (shareable states) — **deferred**

---

## 📱 Phase 8 — Responsiveness & Offline ✅ DONE

- [x] **MoveStrip**: `flex flex-col md:grid md:grid-cols-[1fr_1px_1fr]` — stacks vertically on mobile; sprite cards shrink from 170px → 140px on xs
- [x] **page.tsx 1v1**: mobile panel switcher (⚔ Attacker / ⚡ Field / 🛡 Defender) toggled by `mobilePanel` state — panels hidden/shown via `hidden md:block`; header tab nav `overflow-x-auto scrollbar-none`; regulation picker `hidden sm:block`
- [x] **page.tsx saved panel**: dual implementations — mobile: `fixed md:hidden translate-x-full/0` full-screen drawer; desktop: `hidden md:block transition-[width] 320px/0` inline slide
- [x] **MatrixView**: `flex flex-col md:flex-row` — SlotPanels stack on mobile with `w-full max-h-36`, switch to `w-[200px] max-h-none` on md+; borders responsive (`border-b md:border-r` / `border-t md:border-l`)
- [x] No reliance on external CDNs ✅ (all static)
- [x] Works offline ✅ (static assets + logic only)

---

## 🧪 Phase 9 — Type Safety ✅ DONE

- [x] Strict TypeScript throughout
- [x] `@smogon/calc` State interfaces used for type-safe construction
- [x] `Gen9DataDto` / `Gen9MoveDto` from `@boffmedia/shared` (auto-generated from server OpenAPI spec)
- [x] `MoveData` / `NatureData` interfaces defined in `usePokemonData.ts`
- [x] `Result.damage: number | number[] | number[][]` handled correctly
- [x] Zero errors in all damage-calculator files (`pnpm exec tsc --noEmit --skipLibCheck`)
- [x] No `any` in new files

---

## 🗺️ Phase 10 — Roadmap Execution

### Build Order

1. [x] Layout + navigation integration
2. [x] Zustand store (core state)
3. [x] Pokémon panels
4. [x] Damage calculation logic
5. [x] Move strip
6. [x] Matrix view
7. [x] Speed view
8. [x] Type calculator — bug fix: offensive coverage now uses `getBestOffenseEff` (STAB vs defender types)
9. [x] Import/export (PokéPaste) — parse + export (`pokesToPaste`)
10. [x] Saved Teams panel + localStorage persistence
11. [x] Optimization pass — lazy-load chunks, delete dead code
12. [x] **Mobile polish** ✅
13. [x] **UX polish pass** ✅ — TypeCalcView table 2× larger; SpeedView rivals comparison mode (item-aware per-Pokémon, auto-activates when rivals set, toggle for full reference); MatrixView SlotCard 36px sprites + bigger text, table cells h-[56px]/h-[28px], sprites 40px, SlotPanel width 240px
14. [ ] **URL serialization** ← **NEXT**

---

## 🧱 Known Technical Decisions

| Decision | Reason |
|---|---|
| `@smogon/calc` over `@pkmn/ps` | Full damage formula support, Champions SP approximation |
| **API owns ALL Dex logic — web has none** | `@pkmn/dex`/`@pkmn/sim` live on the server only. The web never calls Dex functions directly. If game data is needed on the web, call an API endpoint. |
| Game data scoped to regulation | `GET /tools/vgc/champions/:reg/game-data` uses `Dex.forFormat()` so only moves/items/abilities valid for that regulation are returned. A single format-agnostic `/data/gen9` endpoint would return incorrect data (e.g. banned moves would appear). |
| Natures as static client constants | 25 natures are Gen 3+ game constants that never change. No fetch needed. Exported as `NATURES` from `usePokemonData.ts`. |
| Module-level `_cache` + `_fetchPromise` keyed by regulationId | One fetch per regulation per page session, shared across all components. Same `Record<string, ...>` pattern as `useLegalPokemon`. Prevents duplicate requests from 8+ `MoveSlot` components mounting simultaneously. |
| `parseShowdownPaste` from tracker | Canonical, tested paste parser already used by `PresetManager`. Removes dependency on `@smogon/calc` for paste move lookups. Move data resolved post-parse via `moveMap` from `useGameData(regulationId)`. |
| `useChampions` toggle in store | Single source of truth for SP↔EV conversion everywhere |
| Trick Room in FieldState but NOT in damage calc | Only affects Speed view sort order — never passed to `@smogon/calc` |
| `Result.damage` typed `number[][]` | v0.11.0 changed tuple `[number[], number[]]` to `number[][]` in the TS type |
| SP→EV: `floor(sp * 252 / 32)` | Exact at max (32→252); ±1 at intermediate values — documented |
| Matrix capped at 120 speed entries | Prevents slow renders with full Pokédex in Speed view |
| JS-positioned tooltips for matrix | CSS hover tooltips clip near table edges with large datasets |
| `hydrateFromStorage` action (not persist middleware) | Zustand `persist` writes to localStorage synchronously on SSR which causes hydration mismatches. Instead, store starts empty and `SavedTeamsPanel` calls `hydrateFromStorage()` in `useEffect` — only runs on the client. |
| Saved Teams panel width via inline `style` + `transition-[width]` | Tailwind arbitrary `w-[320px]`/`w-0` with `transition-all` doesn't animate correctly on conditional renders. Inline style on width + `overflow-hidden` on the wrapper gives a smooth slide with no layout jank. |
| Offensive coverage uses `getBestOffenseEff(p.types, defenderType)` | Takes `Math.max` over the Pokémon's own type(s) effectiveness against the defender type — "best STAB I can bring against this type". Defensive coverage stays `getTypeEff(atkType, p.types)` — "how hard does this attack type hit me". The two formulas are asymmetric by design. |
| `React.lazy()` for MatrixView / SpeedView / TypeCalcView / SavedTeamsPanel | These four are never needed on initial render. Splitting them into separate chunks keeps the initial JS payload to just the 1v1 view (PokemonPanel + FieldPanel + MoveStrip). Zustand actions are stable so no `useCallback` wrapping is needed. |

---

## 📦 Data Sources

All game data comes from the NestJS API or is a hardcoded constant. The web never computes or infers Pokémon data itself.

| Data | API Endpoint | Client hook |
|---|---|---|
| Move list (name, BP, type, category) | `GET /tools/vgc/champions/:reg/game-data` | `useGameData(regulationId)` → `moveMap`, `moveNames` |
| Item list | `GET /tools/vgc/champions/:reg/game-data` | `useGameData(regulationId)` → `items` |
| Ability list | `GET /tools/vgc/champions/:reg/game-data` | `useGameData(regulationId)` → `abilities` |
| Natures (25) | *(static constant — never changes)* | `NATURES` named export from `usePokemonData.ts` |
| Legal Pokémon + base stats | `GET /tools/vgc/champions/:reg/pokemon` | `useLegalPokemon(regulationId)` |
| Speed tiers | `GET /tools/vgc/champions/:reg/speed-tiers` | `VgcService.getChampionsSpeedTiers()` |
| Type chart | *(hardcoded — immutable game mechanic)* | `TYPE_EFF` in `TypeCalcView.tsx` |
| Type colors | *(hardcoded — visual constant)* | `TYPE_COLORS` in `MoveSlot.tsx` |
| Statuses | *(hardcoded — fixed enum)* | Inline in `PokemonPanel.tsx` |

---

## 🚫 Non-Goals (for now)

- ❌ Authentication
- ❌ Backend saving
- ❌ SEO optimization
- ✅ Regulation-filtered Pokémon search — `PokemonSearch` uses `legalNames` from `useLegalPokemonNames` hook
- ✅ Regulation-filtered Speed Reference — `SpeedView` uses `VgcService.getChampionsSpeedTiers(regulation)`
- ⏳ Standard VGC format support in picker (only Champions regulations currently)

---

## 🧠 Final Instruction to AI Agent

You are NOT converting HTML.

You are:
- Designing a scalable system
- Integrating into an existing product
- Making UX decisions aligned with Boffmedia

When in doubt:
> Prioritize **consistency, performance, and maintainability** over literal fidelity to the prototype.
