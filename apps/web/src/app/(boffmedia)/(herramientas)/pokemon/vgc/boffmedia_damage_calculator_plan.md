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
- Pokémon data: `@pkmn/dex` (static singletons, built at module load)
- i18n: `next-intl`, namespace `vgc.calc`

### Champions Format Notes
- Uses SP (Spirit Points): 66 total, 32 max per stat (vs standard 510/252 EVs)
- SP → EV approximation: `floor(sp * 252 / 32)` — exact at extremes, ±1 at mid values
- Toggle via `useChampions` store flag; default regulation is `gen9championsvgc2026regma`

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
  page.tsx                         ✅ Main page, 3-col layout [300px | 1fr | 300px]

  _types/
    calculator.ts                  ✅ StatKey, CalcPokemon, CalcMove, CalcField, DamageResult…

  _store/
    calculatorStore.ts             ✅ Zustand store (poke1, poke2, field, tabs, activeMoves)

  _lib/
    smogonAdapter.ts               ✅ calcDamage, calcAllMoves, getKOVerdict, getDamageColorClass
    spriteUtils.ts                 ✅ Re-exports spriteUrl/handleSpriteError from vgc-tracker

  _hooks/
    usePokemonData.ts              ✅ Static singletons: SPECIES_MAP, MOVE_MAP, NATURES, ITEMS, ABILITIES

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

---

## 🎨 Phase 3 — UI Implementation 🔄 IN PROGRESS

### Checklist
- [x] Navigation integrates with existing VGC/tools nav (ToolsMenu + i18n)
- [x] Layout matches full-screen tool pattern (`height: calc(100vh - 56px)`)
- [x] Replace custom HTML styles with Tailwind
- [ ] Ensure responsive behavior — **PENDING**
- [ ] Ensure accessibility basics — **PENDING**

---

## ⚙️ Phase 4 — Core Features 🔄 IN PROGRESS

### 🧬 Pokémon Panels ✅ DONE
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

### 📊 Matrix View ⏳ NEXT
- [ ] Attacker vs Defender grid (all moves of poke1 vs all of poke2)
- [ ] Tooltip breakdowns
- [ ] Performance optimized rendering

### ⚡ Speed View ⏳ TODO
- [ ] Speed tiers with TR support
- [ ] Highlight player Pokémon

### 🧪 Type Calculator ⏳ TODO
- [ ] Offensive + defensive coverage
- [ ] Summary insights

### 📥 Import System ⏳ TODO
- [ ] PokéPaste parsing
- [ ] Error handling

---

## 🧠 Phase 5 — State Management ✅ DONE

### Checklist
- [x] Centralized Zustand store (`calculatorStore.ts`)
- [x] Slices: poke1/poke2, field (with attackerSide/defenderSide), UI (activeTab, activeMoves)
- [x] `subscribeWithSelector` middleware for fine-grained subscriptions
- [ ] Memoized selectors — partially done (useMemo in MoveStrip)
- [ ] Avoid unnecessary re-renders — needs profiling pass

---

## 🚀 Phase 6 — Performance Optimization ⏳ TODO

- [x] `useMemo` on `calcAllMoves` in MoveStrip
- [ ] `useCallback` pass on panel handlers
- [ ] Avoid deep re-renders (profiling needed)
- [ ] Virtualize heavy tables if needed (Matrix view)
- [ ] Lazy load heavy views (Matrix, Speed, TypeCalc tabs)

---

## 💾 Phase 7 — Persistence & Sharing ⏳ TODO

- [ ] LocalStorage sync (hydration-safe)
- [ ] URL serialization (shareable states)
- [ ] Hydration-safe logic (Next.js SSR)

---

## 📱 Phase 8 — Responsiveness & Offline ⏳ TODO

- [ ] Mobile layout (currently desktop-only 3-col grid)
- [ ] Touch-friendly UI
- [ ] No reliance on external CDNs ✅ (all static)
- [ ] Works offline ✅ (static assets + logic only)

---

## 🧪 Phase 9 — Type Safety ✅ DONE

- [x] Strict TypeScript throughout
- [x] `@smogon/calc` State interfaces used for type-safe construction
- [x] `@pkmn/dex` types used for species/move/nature data
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
6. [ ] **Matrix view** ← **NEXT**
7. [ ] Speed view
8. [ ] Type calculator
9. [ ] Import/export (PokéPaste)
10. [ ] Persistence + URL sync
11. [ ] Optimization pass
12. [ ] Mobile polish

---

## 🧱 Known Technical Decisions

| Decision | Reason |
|---|---|
| `@smogon/calc` over `@pkmn/ps` | Full damage formula support, Champions SP approximation |
| `@pkmn/dex` for static data | Synchronous, tree-shakeable, no fetch needed |
| Singleton maps at module load | `Dex` is static; avoids repeated iteration on every render |
| `useChampions` toggle in store | Single source of truth for SP↔EV conversion everywhere |
| Trick Room NOT in Field | Only affects turn order, not damage — omitted intentionally |
| `Result.damage` typed `number[][]` | v0.11.0 changed tuple `[number[], number[]]` to `number[][]` in the TS type |
| SP→EV: `floor(sp * 252 / 32)` | Exact at max (32→252); ±1 at intermediate values — documented |

---

## 🚫 Non-Goals (for now)

- ❌ Authentication
- ❌ Backend saving
- ❌ SEO optimization
- ❌ Regulation-filtered Pokémon lists (deferred — too heavy for MVP)

---

## 🧠 Final Instruction to AI Agent

You are NOT converting HTML.

You are:
- Designing a scalable system
- Integrating into an existing product
- Making UX decisions aligned with Boffmedia

When in doubt:
> Prioritize **consistency, performance, and maintainability** over literal fidelity to the prototype.
