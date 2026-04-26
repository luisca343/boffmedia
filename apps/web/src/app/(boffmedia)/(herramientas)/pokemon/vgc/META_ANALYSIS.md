# VGC Meta Analysis — Living Design Document

> **This is a living document.** Any agent working on this feature must:
> - Check off completed items as they are implemented (`- [x]`)
> - Add new questions to the **Open Questions** section whenever a decision is needed
> - Add a dated entry to the **Changelog** when making significant changes or decisions
> - Never delete answered questions — move them to **Answered** with the resolution inline

---

## Changelog

| Date | Author | Change |
|---|---|---|
| 2026-04-26 | Initial analysis | Document created from live data fetches |
| 2026-04-26 | User answers | Q1–Q19 answered; RK9 added; DB/pkmn/sim decisions recorded |
| 2026-04-26 | Architecture deep-dive | OQ1–OQ6 answered; module structure, roles, Champions SP formula documented |
| 2026-04-26 | Phase 0 implemented | VgcMeta.ts schema, RolesGuard+decorator, vgc-meta/ module scaffolded, parse-paste-meta.ts + StatCalcService written, OQ7–OQ9 resolved |

---

## Feature Implementation Checklist

### Phase 0 — Foundation (API module + schema)
- [x] Create `VgcMeta.ts` schema in `apps/api/src/_db/schema/`
- [x] Create `vgc-meta/` module folder at `apps/api/src/api/boffmedia/herramientas/pokemon/vgc-meta/`
- [x] Scaffold `vgc-meta.module.ts`, `vgc-meta.controller.ts`, `vgc-meta.facade.service.ts`
- [x] Scaffold `dto/`, `entities/`, `repositories/`, `services/` subfolders
- [x] Implement `RolesGuard` + `@Roles()` decorator in `apps/api/src/api/_utils/guards/` + `decorators/`
- [x] Register `VgcMetaModule` in root `app.module.ts`
- [x] Write meta-specific `parse-paste-meta.ts` in `services/` (captures SP/EV line; tracker types untouched)
- [x] Implement Champions SP stat formula in `stat-calc.service.ts` (full nature table, `isValidChampionsSpread`)

### Phase 1 — Ladder Meta (Smogon)
- [ ] `SmogonService` — fetch + parse chaos JSON
- [ ] `SmogonRepository` — upsert/query `vgc_meta_smogon_snapshot` table
- [ ] Name resolution utility using `@pkmn/sim` Dex (items, moves, abilities, species)
- [ ] NestJS endpoint: `GET /vgc-meta/smogon?format=&month=&cutoff=`
- [ ] `/pokemon/vgc/meta` page with Ladder tab
- [ ] Regulation + month + cutoff picker UI
- [ ] Usage table (sprite | name | bar | top item | top move | top tera)
- [ ] Pokémon detail panel (click to expand: abilities / items / moves / tera / teammates / spreads)
- [ ] Hexagonal radar chart for SP/EV spread (Recharts `<RadarChart>`)

### Phase 2 — Champions Meta (VGCPastes CSV — basic usage)
- [ ] `VgcPastesService` — fetch + parse CSV
- [ ] `VgcPastesRepository` — upsert/query `vgc_meta_paste_team` table
- [ ] NestJS endpoint: `GET /vgc-meta/champions?regulationId=`
- [ ] Champions tab in meta page
- [ ] Usage table from `Pokemon Text for Copypasta` column (no paste fetch needed)
- [ ] Tournament + date range filter UI
- [ ] GID config constant added to `CHAMPIONS_REGULATIONS` in `champions-data.ts`

### Phase 3 — Full Champions Depth (Paste Fetch)
- [ ] `PokepasteService` — fetch `pokepast.es/{id}/json`, parse via extended `parseShowdownPaste()`
- [ ] `PokepasteRepository` — upsert/query `vgc_meta_paste_detail` table
- [ ] Batch fetch with concurrency limit (max 10 parallel, respect backpressure)
- [ ] NestJS endpoint: `GET /vgc-meta/champions/{speciesId}/detail`
- [ ] Detail panel enriched: Champions move / item / SP spread breakdown
- [ ] SP spread → computed stats via Champions formula → hexagonal radar chart

### Phase 4 — Ladder vs Champions Divergence
- [ ] Divergence score computation: `|ladder_usage − champions_usage|`
- [ ] NestJS endpoint: `GET /vgc-meta/divergence?regulationId=`
- [ ] Compare tab in meta page
- [ ] Sortable divergence table
- [ ] "Ladder trap" badge (high ladder %, low Champions %)
- [ ] "Tournament staple" badge (low ladder %, high Champions %)

### Phase 5 — Limitless Tournament Aggregation
- [ ] Admin-only NestJS endpoint: `POST /vgc-meta/limitless/tournament` (accepts URL)
- [ ] `LimitlessService` — scrape standings HTML, extract player slugs
- [ ] `LimitlessService` — scrape teamlist pages (regex on `const teamlist` JS var)
- [ ] Rate-limit stagger: max 10 req/min with retry on 429
- [ ] Configurable player-count threshold (above which admin must trigger manually)
- [ ] `LimitlessRepository` — upsert/query `vgc_meta_limitless_tournament` + `vgc_meta_limitless_team` tables
- [ ] NestJS endpoint: `GET /vgc-meta/limitless?tournamentId=`
- [ ] Tournament tab in meta page (admin URL input + cached tournament list)

### Future — RK9 Regionals Pairings (Low Priority)
- [ ] RK9 event scrape (`rk9.gg/event/{id}`)
- [ ] RK9 pairings scrape (`rk9.gg/pairings/{id}`)
- [ ] Display upcoming tournament pairings (companion feature, not meta aggregation)

### Future — Personal Integration
- [ ] Join meta usage data with user's own tracker `opponentTeam` records
- [ ] "You vs the meta" overlays in `SessionStatsView`

---

## Data Sources — Ground Truth

### Smogon Chaos Endpoint

**URL pattern:** `https://www.smogon.com/stats/{YYYY-MM}/chaos/{format}-{cutoff}.json`

- No CORS → NestJS API fetches only. No auth, no rate limiting.
- ~6.5 MB uncompressed; `.json.gz` variant is much smaller — prefer gzip.
- Updates monthly (~1st of following month). Latest confirmed: `2026-03`.
- `gen9vgc2026regi` exists from `2026-01` onward.
- **No Champions format in Showdown** — Smogon = regular VGC ladder only.

**Default cutoff:** `-1760`. Named constant in a dedicated config:
```ts
// vgc-meta/config/smogon.config.ts
export const SMOGON_DEFAULT_CUTOFF = 1760; // 0 | 1500 | 1630 | 1760
```

**Per-Pokémon fields:** `Raw count`, `usage` (float), `Abilities`, `Items`, `Spreads`, `Moves`, `Tera Types`, `Teammates`, `Checks and Counters` (always empty in VGC).

**Name resolution via `@pkmn/sim`:**
```ts
// Ladder data
Dex.forFormat('gen9vgc2026regi').items.get('safetygoggles').name // "Safety Goggles"
// Champions data (after initChampionsMod())
Dex.forFormat('gen9championsvgc2026regma').moves.get('fakeout').name // "Fake Out"
```

---

### VGCPastes Google Sheet

**URL:** `https://docs.google.com/spreadsheets/d/1axlwmzPA49rYkqXh7zHvAtSP-TKbM0ijGYBPRflLSWw/export?format=csv&gid={GID}`

- Server-side fetch only (redirect CORS issue from browser).
- ~179 KB CSV, 476 teams (as of 2026-04-26). Champions tier only.
- **GID is per-regulation** — `791705272` = Reg M-A. New GID expected when Reg changes (~1.5 months). GID stored as a config constant per regulation (see `champions-data.ts` extension below).
- `Pokemon Text for Copypasta` column = 6 species names, comma-separated → basic usage without paste fetching.

---

### Pokepaste JSON API

**URL:** `https://pokepast.es/{id}/json`  
CORS open (`*`), ~1.3 KB, no auth, no rate limiting observed.  
Fields: `{ author, notes, paste, title }` — `paste` feeds directly into (extended) `parseShowdownPaste()`.

---

### Limitless TCG

**Standings:** `https://play.limitlesstcg.com/tournament/{id}/standings` — 497 KB HTML, no CORS.  
**Teamlist:** `https://play.limitlesstcg.com/tournament/{id}/player/{slug}/teamlist` — 14 KB HTML.  
Team paste extracted via: `html.match(/const teamlist = `([\s\S]*?)`/)`  
Rate limit: **50 req / 5 min** (confirmed from response headers).

---

### RK9 (Future — Low Priority)
`https://rk9.gg/event/pokemon-euic-2026` / `https://rk9.gg/pairings/{id}`  
Pairings companion feature only. Not meta aggregation.

---

## Architecture

### Module Structure

The new feature lives at:
```
apps/api/src/api/boffmedia/herramientas/pokemon/vgc-meta/
├── vgc-meta.module.ts
├── vgc-meta.controller.ts
├── vgc-meta.facade.service.ts        ← orchestrates all sub-services
├── config/
│   └── smogon.config.ts              ← SMOGON_DEFAULT_CUTOFF constant
├── dto/
│   ├── query-smogon.dto.ts
│   ├── query-champions.dto.ts
│   ├── add-limitless-tournament.dto.ts
│   └── ...
├── entities/
│   ├── pokemon-usage.entity.ts
│   ├── smogon-snapshot.entity.ts
│   └── ...
├── repositories/
│   ├── smogon.repository.ts
│   ├── vgcpastes.repository.ts
│   ├── pokepaste.repository.ts
│   └── limitless.repository.ts
└── services/
    ├── smogon.service.ts             ← fetch + parse Smogon chaos JSON
    ├── vgcpastes.service.ts          ← fetch + parse CSV
    ├── pokepaste.service.ts          ← batch paste fetching
    ├── limitless.service.ts          ← HTML scraping
    └── stat-calc.service.ts          ← Champions SP formula
```

This follows the Events module pattern (facade + multiple domain services + repositories), confirmed as the correct pattern for complex multi-source modules.

### Roles Guard (New — to be implemented in Phase 0)

Roles exist in the JWT payload (`roles: string[]`) but no guard is currently enforcing them. Implement:

```ts
// apps/api/src/_utils/guards/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.get<string[]>('roles', context.getHandler());
    if (!required) return true;
    const user = context.switchToHttp().getRequest().user;
    return required.some((r) => user?.roles?.includes(r));
  }
}

// apps/api/src/_utils/decorators/roles.decorator.ts
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
```

Usage on admin endpoints:
```ts
@Post('limitless/tournament')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
addTournament(@Body() dto: AddLimitlessTournamentDto) { ... }
```

The `boffmedia_user_roles` join table already provides role data; it's included in the JWT payload by `auth.service.ts`. No DB change needed.

### Drizzle DB Pattern (established, replicate exactly)

```ts
@Injectable()
export class SmogonRepository {
  constructor(@Inject(DRIZZLE) private db: MySql2Database<Record<string, never>>) {}

  async findSnapshot(formatId: string, month: string, cutoff: number) {
    return this.db.select().from(vgcMetaSmogonSnapshots)
      .where(and(
        eq(vgcMetaSmogonSnapshots.formatId, formatId),
        eq(vgcMetaSmogonSnapshots.month, month),
        eq(vgcMetaSmogonSnapshots.cutoff, cutoff),
      ))
      .limit(1)
      .then((r) => r[0] ?? null);
  }

  async upsertSnapshot(data: { formatId: string; month: string; cutoff: number; data: object }) {
    await this.db.insert(vgcMetaSmogonSnapshots).values({
      ...data,
      data: JSON.stringify(data.data),
      fetchedAt: new Date(),
    }).onDuplicateKeyUpdate({
      set: { data: JSON.stringify(data.data), fetchedAt: new Date() },
    });
  }
}
```

### `champions-data.ts` Extension

Add `vgcPastesGid` to `ChampionsRegulation` so GID is co-located with the format definition:

```ts
export interface ChampionsRegulation {
  id: string;
  formatId: string;
  name: string;
  gameType: 'singles' | 'doubles';
  /** Google Sheets GID for the VGCPastes Champions sheet for this regulation. */
  vgcPastesGid?: string;
  notes?: string;
}

export const CHAMPIONS_REGULATIONS: Record<string, ChampionsRegulation> = {
  vgc2026regma: {
    id: 'vgc2026regma',
    formatId: 'gen9championsvgc2026regma',
    name: '[Gen 9 Champions] VGC 2026 Reg M-A',
    gameType: 'doubles',
    vgcPastesGid: '791705272',
  }
};
```

When a new regulation ships, add a new entry here with the new GID. Zero other files need to change.

---

## Champions SP Stat Formula

**Critical difference from standard Pokémon:** Champions format uses **Stat Points (SP)** instead of EVs/IVs.

### Rules
- Total SP budget: **66** per team slot
- Max SP per individual stat: **32**
- IVs do not exist in Champions — all stats derived from Base + SP only
- "Alignment" = the nature multiplier (same values as standard: ×1.1, ×1.0, ×0.9)

### Formulas
```
HP  = Base + SP + 75
Any other stat = floor( (Base + SP + 20) × Alignment )
```

### Examples (Incineroar, base stats: 95 HP / 115 Atk / 90 Def / 45 SpA / 90 SpD / 60 Spe)

| Stat | Base | SP | Alignment | Result |
|---|---|---|---|---|
| HP | 95 | 10 | — | 95 + 10 + 75 = **180** |
| Atk (Adamant) | 115 | 32 | 1.1 | floor((115+32+20)×1.1) = floor(184.7) = **184** |
| Def (neutral) | 90 | 0 | 1.0 | floor((90+0+20)×1.0) = **110** |
| Spe (neutral) | 60 | 8 | 1.0 | floor((60+8+20)×1.0) = **88** |

### Paste Format

In Showdown paste format, Champions SPs appear under the `EVs:` label but the values are SPs (0–32), not EVs (0–252). Validation: all six SP values must sum to ≤ 66.

```
Incineroar @ Safety Goggles
Ability: Intimidate
EVs: 10 HP / 32 Atk / 0 Def / 0 SpA / 16 SpD / 8 Spe   ← these are SPs, not EVs
Adamant Nature
```

**`parseShowdownPaste()` extension needed:** The current parser ignores the `EVs:` line. It must be extended to parse it into `{ hp, atk, def, spa, spd, spe }` for meta use. Since `PresetSlot` (tracker type) doesn't need EVs, add an optional field or write a separate meta-only extended parser to avoid polluting tracker types.

### `stat-calc.service.ts` Implementation

```ts
export interface ChampionsSpreads {
  hp: number; atk: number; def: number; spa: number; spd: number; spe: number;
}

const NATURE_MULTIPLIERS: Record<string, Partial<Record<keyof ChampionsSpreads, number>>> = {
  Adamant: { atk: 1.1, spa: 0.9 },
  Modest:  { spa: 1.1, atk: 0.9 },
  Jolly:   { spe: 1.1, spa: 0.9 },
  Timid:   { spe: 1.1, atk: 0.9 },
  Bold:    { def: 1.1, atk: 0.9 },
  Impish:  { def: 1.1, spa: 0.9 },
  Calm:    { spd: 1.1, atk: 0.9 },
  Careful: { spd: 1.1, spa: 0.9 },
  // ... all natures
};

@Injectable()
export class StatCalcService {
  computeChampionsStats(
    baseStats: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number },
    sps: ChampionsSpreads,
    nature: string,
  ): ChampionsSpreads {
    const mults = NATURE_MULTIPLIERS[nature] ?? {};
    const calc = (base: number, sp: number, key: keyof ChampionsSpreads) => {
      if (key === 'hp') return base + sp + 75;
      return Math.floor((base + sp + 20) * (mults[key] ?? 1.0));
    };
    return {
      hp:  calc(baseStats.hp,  sps.hp,  'hp'),
      atk: calc(baseStats.atk, sps.atk, 'atk'),
      def: calc(baseStats.def, sps.def, 'def'),
      spa: calc(baseStats.spa, sps.spa, 'spa'),
      spd: calc(baseStats.spd, sps.spd, 'spd'),
      spe: calc(baseStats.spe, sps.spe, 'spe'),
    };
  }
}
```

> **Note:** `@pkmn/sim` support for the Champions formula is expected soon. Until then, `StatCalcService` is the in-house workaround. Once `@pkmn/sim` supports it natively, replace `StatCalcService` with the library call and delete the workaround.

---

## DB Schema — `VgcMeta.ts`

```ts
// apps/api/src/_db/schema/VgcMeta.ts

// One row per format+month+cutoff combination
export const vgcMetaSmogonSnapshots = mysqlTable('vgc_meta_smogon_snapshots', {
  id:       int('id').primaryKey().autoincrement(),
  formatId: varchar('format_id', { length: 64 }).notNull(),   // e.g. 'gen9vgc2026regi'
  month:    varchar('month', { length: 7 }).notNull(),         // e.g. '2026-03'
  cutoff:   int('cutoff').notNull(),                           // 0 | 1500 | 1630 | 1760
  data:     longtext('data').notNull(),                        // serialized JSON
  fetchedAt: datetime('fetched_at').notNull(),
}, (t) => ({ uniq: unique().on(t.formatId, t.month, t.cutoff) }));

// One row per team entry in VGCPastes CSV
export const vgcMetaPasteTeams = mysqlTable('vgc_meta_paste_teams', {
  id:          varchar('id', { length: 16 }).primaryKey(),     // 'PC476'
  pasteId:     varchar('paste_id', { length: 32 }),            // pokepast.es ID
  pasteUrl:    varchar('paste_url', { length: 255 }),
  playerName:  varchar('player_name', { length: 128 }),
  tournament:  varchar('tournament', { length: 255 }),
  dateShared:  varchar('date_shared', { length: 16 }),         // 'DD Mon YYYY'
  rank:        varchar('rank', { length: 64 }),
  regulationId: varchar('regulation_id', { length: 64 }),
  species:     text('species').notNull(),                      // JSON: string[]
  fetchedAt:   datetime('fetched_at').notNull(),
});

// Parsed paste cache — immutable once fetched
export const vgcMetaPasteDetails = mysqlTable('vgc_meta_paste_details', {
  pasteId:    varchar('paste_id', { length: 32 }).primaryKey(),
  author:     varchar('author', { length: 128 }),
  title:      varchar('title', { length: 255 }),
  formatId:   varchar('format_id', { length: 64 }),
  parsedSlots: text('parsed_slots').notNull(),                 // JSON: extended PresetSlot[]
  fetchedAt:  datetime('fetched_at').notNull(),
});

// One row per scraped Limitless tournament
export const vgcMetaLimitlessTournaments = mysqlTable('vgc_meta_limitless_tournaments', {
  id:           int('id').primaryKey().autoincrement(),
  limitlessId:  varchar('limitless_id', { length: 64 }).notNull().unique(),
  name:         varchar('name', { length: 255 }),
  date:         varchar('date', { length: 32 }),
  format:       varchar('format', { length: 64 }),
  playerCount:  int('player_count'),
  fetchedAt:    datetime('fetched_at').notNull(),
});

// One row per player team per tournament
export const vgcMetaLimitlessTeams = mysqlTable('vgc_meta_limitless_teams', {
  id:            int('id').primaryKey().autoincrement(),
  tournamentId:  int('tournament_id').references(() => vgcMetaLimitlessTournaments.id, { onDelete: 'cascade' }),
  playerSlug:    varchar('player_slug', { length: 128 }).notNull(),
  playerName:    varchar('player_name', { length: 128 }),
  record:        varchar('record', { length: 16 }),             // '7-2-0'
  pasteText:     text('paste_text'),
  parsedSlots:   text('parsed_slots'),                          // JSON: extended PresetSlot[]
  fetchedAt:     datetime('fetched_at').notNull(),
});
```

---

## UI Structure

```
/pokemon/vgc/meta
  ├── Tabs: [Ladder | Champions | Compare]
  │
  ├── Ladder tab (Smogon chaos)
  │     ├── Regulation picker  ·  Month picker  ·  Cutoff picker (default 1760+)
  │     ├── Usage table: sprite | name | usage bar | top item | top move | top tera
  │     └── Pokémon detail panel (click any row)
  │           Abilities · Items · Moves · Tera Types · Teammates · SP Spreads
  │           SP spread → Recharts RadarChart (6-axis hexagon)
  │
  ├── Champions tab (VGCPastes + Limitless)
  │     ├── Source: [VGCPastes | Limitless]
  │     ├── [VGCPastes] Regulation picker · date range · tournament filter
  │     ├── [Limitless] Tournament picker (admin URL input when no cached data)
  │     ├── Usage table (same structure as Ladder)
  │     └── Pokémon detail panel (Champions moves / items / SP spreads)
  │
  └── Compare tab
        ├── Side-by-side: Ladder % vs Champions %
        ├── Divergence table (sorted by |ladder − champions|)
        ├── "Ladder trap" badge  ·  "Tournament staple" badge
        └── Month-over-month trend sparklines (future)
```

---

## Answered Questions

**Q1** New dedicated page. → `/pokemon/vgc/meta`  
**Q2** Inside VGC section, alongside `/speed-tiers`, `/tracker`.  
**Q3** Champions tier only. GID `791705272` (Reg M-A).  
**Q4** Default `-1760` cutoff. Named constant `SMOGON_DEFAULT_CUTOFF`. UI picker exposes all four.  
**Q5** Multiple months. Each stored as a separate DB snapshot. Month picker in UI.  
**Q6** No Champions in Showdown. Smogon = ladder only.  
**Q7** Admin pastes any Limitless URL.  
**Q8** Configurable threshold. Above it, admin triggers manual team-fetch job.  
**Q9** RK9 for Regionals — low-priority future feature (pairings only).  
**Q10** Persist to DB (MySQL/Drizzle).  
**Q11** Drizzle/MySQL. New schema file `VgcMeta.ts`.  
**Q12** Strategy A (CSV species) in Phase 2, Strategy B (lazy paste fetch) in Phase 3.  
**Q13** `@pkmn/sim` Dex for base stats. Champions SP formula in `StatCalcService` (workaround until library support).  
**Q14** Recharts `<RadarChart>`. Try it, revisit if sizing issues emerge.  
**Q15** Personal integration — future phase.  
**Q16** Both: publicly accessible meta page + future tracker-aware overlays for logged-in users.  
**Q17/Q18** `@pkmn/sim` Dex for all name resolution. Champions mod format IDs as canonical keys.  
**Q19** `vgc2026regma` / `gen9championsvgc2026regma` confirmed in `champions-data.ts`.

**OQ1** Module location: `vgc-meta/` as a sibling to `vgc/` under `.../herramientas/pokemon/`. Events module pattern (facade + multiple services + repositories). Structure documented above.

**OQ2** No existing `RolesGuard`. Implement `RolesGuard` + `@Roles()` decorator in `_utils/`. Roles already in JWT payload (confirmed in `auth.service.ts`). No DB change needed. Implementation documented above.

**OQ3** Only latest month for initial DB seed. Fetch historical only if user requests via picker.

**OQ4** GID is per-regulation. Add `vgcPastesGid?: string` to `ChampionsRegulation` interface in `champions-data.ts`. When a new regulation ships, add a new entry. Extension documented above.

**OQ5** Recharts `<RadarChart>`. Already a project dependency.

**OQ6** Yes, EVs (SPs) must be parsed. Champions uses SP (0–32 per stat, 66 total) under the `EVs:` label in paste format. Full formula documented in the Champions SP section above. Extend `parseShowdownPaste()` or write a meta-specific variant to avoid polluting tracker types. `StatCalcService` implements the workaround formula.

---

## Open Questions

*(All resolved — none pending.)*

---

## Answered Questions (continued)

**OQ7** — Separate `parse-paste-meta.ts` file in `vgc-meta/services/`. Tracker types stay clean; meta enrichment (EVs/SPs) is opt-in at the call site. The shared `parseShowdownPaste()` in `showdown-parse.ts` is not modified.

**OQ8** — Smogon Ladder data uses **standard EVs (0–252)** and standard stat formula (gen9 formula with IVs=31). Champions paste data uses **SPs (0–32)** and the custom Champions formula. These are entirely separate paths. `StatCalcService` is only invoked for Champions paste spreads; the Ladder tab computes stats using the standard formula (or shows raw EV values without stat computation in Phase 1).

**OQ9** — Admin UI lives inside `/pokemon/vgc/meta` as a hidden section rendered only when the authenticated user has the `admin` role. No separate admin panel needed yet. The `RolesGuard` on the API endpoint enforces it server-side regardless.
