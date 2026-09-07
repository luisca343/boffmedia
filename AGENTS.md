# AGENTS.md — Boffmedia Monorepo

Last verified: 2026-09-04, against the real `package.json` files (root, every `apps/*`, every
`packages/*`) and the actual source tree — not against a prior revision of this file. For a shorter,
domain-scoped version of most sections here, see `.claude/context/*.md` (stack, architecture,
conventions, api-standards, web-network, i18n, db-naming, hygiene, mcef, smartrotom).

Monorepo for Boffmedia (gaming tools platform) and SmartRotom (Pixelmon/Minecraft companion), with a shared NestJS API, a Next.js web client, and a Tauri desktop client.

---

## Tech Stack

| Layer | Tech | Version |
|---|---|---|
| Package manager | pnpm workspaces | `>=10` (root `package.json` engines; `packageManager` pins `pnpm@10.24.0`) |
| Node | Node.js | `>=22` |
| Frontend (web) | Next.js | 16.0.7 |
| Frontend (web + desktop) | React | 19.2.3 |
| Desktop shell | Tauri | v2 (`@tauri-apps/api`/`cli` `^2.1.x`), renderer on Vite `^6.0.7` |
| Backend | NestJS | `^11.1.6` |
| Database | MySQL (`mysql2`) + **Drizzle ORM only** | Drizzle `^0.44.4`, `drizzle-kit` `^0.31.4` — **TypeORM is not used**; there are zero TypeORM references anywhere in `apps/api/src` |
| Real-time | Socket.io | `^4.7.4` (client), `^4.8.1` (server) |
| Auth | NextAuth + Passport/JWT | NextAuth `^4.24.6` |
| Styling | Tailwind CSS + Radix UI | `^3.3.0` (apps/web) / `^3.4.0` (`@boffmedia/tailwind-config`) |
| State | Zustand | `^4.5.0` |
| Validation | Zod (client `^3.22.4`, server `^4.4.3` — two separate major versions, not shared) + `class-validator`/`class-transformer` on server DTOs | — |
| Shared types | openapi-typescript-codegen | `^0.29.0` |
| Testing | Vitest `^4.1.10` (apps/web unit tests, `battle-core`, `pack-schema`, `tools/minecraft`) + Playwright `^1.49.1` (apps/web e2e) + Jest `^30.0.5` (apps/api) | — |

Full detail and rationale: `.claude/context/stack.md`.

---

## Repository Layout

```
/
├── apps/
│   ├── web/          # Next.js client (port 3000)
│   │   └── src/
│   │       ├── app/                    # App Router routes
│   │       │   ├── (boffmedia)/        # Boffmedia section
│   │       │   │   ├── (eventos)/      # Events + juegos (games)
│   │       │   │   └── (herramientas)/ # Gaming tools (baseline design system)
│   │       │   └── smartrotom/         # SmartRotom cellphone UI — one folder per app
│   │       ├── services/
│   │       │   ├── api/boffmedia/, api/smartrotom/  # Per-domain API call modules
│   │       │   ├── http/                # HTTP client, split by domain (core/boff/rotom/wingull)
│   │       │   └── mcef/                # Minecraft MCEF integration
│   │       ├── proxy.ts                 # Replaces middleware.ts on Next 16 — see web-network.md
│   │       ├── components/
│   │       │   ├── ui/primitives/      # LEGACY shadcn/Radix layer — no new additions
│   │       │   ├── boffmedia/          # Boffmedia domain components
│   │       │   ├── smartrotom/         # SmartRotom components (own design system)
│   │       │   └── shared/pokemon/     # Shared Pokémon UI (TypeBadge, etc.)
│   │       └── features/ficusai/       # FicusAI chat feature slice
│   ├── api/          # NestJS server (port 34301)
│   │   └── src/
│   │       ├── api/boffmedia/          # Boffmedia endpoints
│   │       ├── api/smartrotom/         # SmartRotom endpoints
│   │       ├── api/packs, api/randomizer, api/desktop-updates, api/battlesimulator
│   │       ├── discord/                # Discord bot — inside the Nest app, not a separate service
│   │       ├── _db/schema/             # Drizzle schema definitions, one file per domain
│   │       ├── _repositories/          # Data access layer
│   │       └── common/                 # errors/catalog.json, exceptions/, filters/, dto/
│   └── desktop/      # Tauri v2 shell — reuses apps/web's @boffmedia/tools-* packages
│       └── src/                        # Only runtime.ts may import @tauri-apps/*
└── packages/
    ├── shared/src/        # AUTO-GENERATED — do not edit (255+ OpenAPI models)
    ├── ui/                # @boffmedia/ui — host-agnostic design system (web + desktop)
    ├── pack-schema/       # Pack-manifest Zod schema, feeds src-tauri/build.rs
    ├── battle-core/       # Battle sim engine
    ├── asset-paths/, pokemon-identity/, pkmn-names/, tailwind-config/
    └── tools/             # Listed SEPARATELY in pnpm-workspace.yaml (the packages/* glob isn't recursive)
        └── kit/, battlesim/, mewgenics/, mhwilds/, minecraft/, misc/, pokemon/  # One package per ported tool
```

Full layout detail, the four-layer component rule, and the two-design-system boundary:
`.claude/context/architecture.md`.

---

## Commands

```bash
# Root (run from repo root)
pnpm dev              # Run web + api concurrently
pnpm dev:web          # Next.js dev only
pnpm dev:api          # NestJS dev only (watch mode); dev:api:win for the Windows env-var syntax
pnpm build:web        # Next.js production build (does NOT fail on type errors — see below)
pnpm build:api        # NestJS production build
pnpm lint             # Full CI gate: lint (sequential) + v3-conventions + layering + i18n + fonts
                       # + tool-chassis + pack-schema + error-codes + pokemon-identity + pokedex-locales + seed-sql
pnpm type-check       # TypeScript check all packages (sequential, memory-safe) — the real gate
pnpm memory-check     # Check available memory before heavy operations
pnpm generate:shared  # Regenerate shared types + error codes (requires api on port 34301)
pnpm check:i18n       # i18n guard alone — see .claude/context/i18n.md
pnpm check:layering   # apps/api repository-layering guard alone
pnpm setup            # Create public folder symlinks (first-time setup)

# Parallel versions (use only with sufficient memory >16GB)
pnpm lint:parallel        # Lint all packages concurrently
pnpm type-check:parallel  # Type-check all packages concurrently

# apps/api only
pnpm --filter api generate   # Drizzle migration generation
pnpm --filter api migrate    # Run Drizzle migrations
pnpm --filter api test        # Jest tests (--runInBand)
pnpm --filter api test:e2e   # End-to-end tests

# apps/web only
pnpm --filter web test        # Playwright e2e tests
pnpm --filter web test:unit   # Vitest unit tests

# apps/desktop only
pnpm --filter desktop dev:renderer  # Runs every screen in a plain browser, no Rust required
```

Command list and hygiene rationale in full: `.claude/context/conventions.md` and
`.claude/context/hygiene.md` (including the `pnpm lint --fix` trap — root `lint` can rewrite files
in a package you didn't touch).

> **⚠ Memory management (sequential gates):**
> - `pnpm lint` and `pnpm type-check` run **sequentially**, one package at a time, to prevent OOM crashes
> - Each process is capped via `NODE_OPTIONS=--max-old-space-size` (computed from actually-available RAM for type-check, fixed per-package for lint)
> - Run `pnpm memory-check` before heavy operations to verify available memory
> - On WSL, if crashes persist, ensure swap is enabled: `wsl --shutdown` from Windows PowerShell
> - For parallel execution (faster), use the `:parallel` variants only with >16GB RAM free

---

## Shared Types — Critical Rules

- `packages/shared/src/` is **auto-generated** from the NestJS OpenAPI spec. Never manually edit these files.
- To add a type: define the DTO/entity on the server, then run `pnpm generate:shared` (api must be running).
- The client imports types from `@boffmedia/shared`. Never redefine or duplicate these types on the client.
- TypeScript path alias `@boffmedia/shared` resolves to `packages/shared/src/index.ts` in both apps.

---

## API Services — Critical Rules

- All HTTP API calls from the client go through `apps/web/src/services/` — domain call modules in `services/api/{boffmedia,smartrotom}/`, built on the shared HTTP client in `services/http/` (split by domain: `core.ts`, `boff-client.ts`, `rotom-client.ts`, `wingull-client.ts`). Never inline `fetch` calls in components or pages.
- Add new endpoints to the matching service file for their domain; add new low-level request helpers to the matching `http/*-client.ts` file (SmartRotom mutations must carry `server` in the body — `MinecraftMiddleware` 403s a non-GET without it).
- The NestJS server runs on port **34301**. The client's `NEXT_PUBLIC_API` env var points to the deployed API URL.

Detail: `.claude/context/web-network.md`.

---

## Product Sections

### Boffmedia
Gaming tools platform. Sections under `(boffmedia)`: `(herramientas)/` (tools — `herramientas`,
`mhwilds`, `minecraft`, `otros`, `pokemon`), `(eventos)/` (`eventos` + `juegos`), plus forum,
tournaments, community, profile and admin routes at the section root.
- `herramientas/` is the **design system baseline** — all Boffmedia sections must stay visually consistent with it.
- Uses the global design system at `components/ui/primitives/` (legacy shadcn/Radix) and the newer `@boffmedia/ui` for anything shared with desktop.
- Global nav: `FicusNav`.

### SmartRotom
Pixelmon (Minecraft) server companion app, styled as a cellphone UI with individual apps — one
folder per app under `apps/web/src/app/smartrotom/`. Full app-by-app status and cross-app map:
`apps/web/src/app/smartrotom/APPS.md`.
- Has its own design system: `components/smartrotom/ui/` (neobrutalism variants).
- May reuse Boffmedia components, but **do not force Boffmedia styles onto SmartRotom**.
- This is Pixelmon/Minecraft-themed — respect that context for UI and logic suggestions.
- Nav: `RotomNav`, wrapper: `AppWrapper`.

Detail: `.claude/context/smartrotom.md`.

---

## Minecraft Integration (MCEF)

MCEF (Minecraft Embedded Framework) allows direct client-side communication with the Minecraft game process via `window.mcefQuery`.

- All MCEF functions live in `apps/web/src/services/mcef/`.
- Use `isMinecraft()` to guard MCEF calls; `mcefPlaceholders.ts` provides fallbacks for non-Minecraft browsers.
- **Do not invent new MCEF integration patterns.** Rely on existing functions in `mcefApi.ts` or server-side relay endpoints.
- When MCEF is unsuitable (server-authoritative actions), use the NestJS API as a relay instead.
- The current function list moves — don't copy a static snapshot into a doc; `mcefApi.ts` is the
  source of truth and `.claude/context/mcef.md` tracks it, grouped by purpose (identity, gameplay
  relay, screenshots, zoom/flashlight, waypoints).

---

## Component Architecture (client)

Four-layer system — never skip layers:

| Layer | Location | Rule |
|---|---|---|
| Primitives | `components/ui/primitives/` | shadcn/Radix, no business logic |
| Global UI | `components/ui/navigation/`, `display/`, etc. | Used across 2+ unrelated sections |
| Shared utilities | `components/shared/` | Technical, no domain models |
| Feature slice | `features/{domain}/` | Domain-specific, 2+ routes in same domain |
| Route-private | `app/**/_components/` | Default for new components |

**Promotion path**: `_components/` → `features/` → `components/` — justify each promotion.

Non-component files (types.ts, config.ts, .svg, .css) must not live inside `_components/`.

---

## Key Conventions

- **Route groups** use `(name)` syntax and do not affect the URL path.
- **Imports**: use `@/` absolute aliases instead of deep relative paths (more than 2 levels).
- **i18n**: The app uses `next-intl` exclusively for UI strings — always use translation keys, never hardcode user-facing text. `next-i18next`/`react-i18next` are also installed dependencies but are not the wired-up system; don't add new usage of them. Detail: `.claude/context/i18n.md`.
- **Database**: NestJS uses **Drizzle ORM only** (`_db/schema/`, repository pattern in `_repositories/`) — TypeORM is not part of this codebase. Detail: `.claude/context/api-standards.md`, `.claude/context/db-naming.md`.
- **Swagger**: Decorated with `@ApiProperty`/`@ApiResponse` — all new DTOs must include Swagger decorators so the OpenAPI spec stays accurate for `generate:shared`.
- **Validation**: All incoming request bodies validated via `class-validator` DTOs on the server. The global `ValidationPipe` has `whitelist: true` and `forbidNonWhitelisted: true` — extra properties are rejected.
- **next.config.mjs**: `ignoreBuildErrors: true` is set — TypeScript errors do NOT fail the Next.js build. Always run `pnpm type-check` separately.
- **SmartRotom design tokens**: `components/smartrotom/ui/badge.tsx` and `button.tsx` use neobrutalism variants that are incompatible with the global primitives. Do not replace them with global equivalents.
- **Pokémon libraries**: `@pkmn/*` packages are version-overridden in `pnpm-workspace.yaml`. Do not upgrade them independently.
- **Discord bot** lives inside the NestJS app (`src/discord/`), not as a separate service.
- **Desktop app naming**: `app` (what a user calls the download), `desktop` (which client, in code that distinguishes web/desktop/in-game), `launcher` (the launching function specifically) are three deliberately distinct words — see CLAUDE.md's "apps/desktop (Tauri v2)" section for the full rule and why collapsing them makes names less accurate.
- **`@boffmedia/ui` is host-agnostic**: no `next/*`, no `next-intl`, no `@/` imports — it ships to both `apps/web` and `apps/desktop`. Each host wires it up via `configureUi()`.

---

## Tool Registration Checklist

When a domain package's first tool is ready, it must be registered in the desktop hub. Follow these steps to ensure the tool works in both the web and desktop app. All claims below have been verified against actual code (tool-host.ts, typecheck-sequential.js, manifest entries, CSS tokens, layout declarations).

### 1. Tool Manifest & Registration

- [ ] Tool has a **manifest entry** in its domain package (`packages/tools/<domain>/src/tools.ts`):
  ```ts
  { 
    id, domain, titleKey, descriptionKey, icon, 
    component: lazy(...), 
    layout: "document" | "viewport",
    requiredCapabilities: [list actual ones used]
  }
  ```
- [ ] Manifest is exported from the package's `/tools.ts` export (the manifests list, not the barrel)
- [ ] Tool is **registered** in `apps/desktop/src/tool-host.ts` → `registerTools([...])` array (import manifests only, not the barrel)

### 2. i18n & Catalogs

- [ ] Tool has **package-owned es/en message catalogs** under `packages/tools/<domain>/src/locales/`
- [ ] Catalog keys follow the naming scheme (e.g., `tools.schematicCompat.*`, `tools.mhwilds.*.skillTree.*`)
- [ ] Keys use **ICU plurals and select syntax** (not just `{name}` substitution) — `@boffmedia/ui` rules apply
- [ ] Desktop host (`apps/desktop/src/i18n/messages.ts`) includes the new catalog via merge
- [ ] Both locales have identical key sets (audit before shipping)

### 3. Capabilities

Verify the tool uses only capabilities present in `configureToolHost()`:

- [ ] **`api`** — if tool calls `apps/api`, make sure `requiredCapabilities` includes it
- [ ] **`saveFile`** — if tool exports files, verify it uses the capability (not direct blob download)
- [ ] **`storage`** — if tool persists state, verify it uses `data.db(namespace)` or `data.outbox(namespace)`
- [ ] No `next/*`, no `next-intl`, no `@tauri-apps/*` imports in the package itself

### 4. Layout Contract — Critical

**Wrong layout is silent and total failure.** A `"document"` tool in a clipped box cannot scroll at all.

- [ ] Tool **declares `layout` in the manifest**: `"document"` (grows with content, page scroll) or `"viewport"` (fills a bounded box, tool scrolls its own panes)
- [ ] Tool uses **exactly two host-provided CSS tokens** with working fallbacks:
  - `--tool-vh`: height of the box the host gives the tool (e.g., `calc(100dvh - 77px)` in desktop, `calc(100dvh - var(--nav-h))` on web)
  - `--tool-sticky-top`: sticky offset from top of that box (e.g., `0px` in desktop; `var(--nav-h)` on web)
- [ ] **No viewport math in the package** — no `calc(100dvh - var(--nav-h))`, no hardcoded heights. Packages never read `--nav-h`.
- [ ] No `--nav-h` references — that variable exists only in `apps/web/globals.css`

### 5. Assets & Data Packs

- [ ] If tool includes **bundled assets** (JSON, images, fonts):
  - Asset paths are **root-relative** (e.g., `/tools/<domain>/data/...`)
  - `packages/tools/<domain>/public/` holds them
  - `scripts/sync-tool-assets.mjs` is run to generate the asset manifest used by the launcher
- [ ] If tool has large data packs:
  - Packs are **fetched on first use**, not bundled in startup
  - Launcher's `boffasset://` scheme fetches and caches them

### 6. Type-Check & Bundling

- [ ] **Package is added to `PACKAGES` in `scripts/typecheck-sequential.js`** — *This is mandatory. A missing entry makes `pnpm type-check` report green for code it never read.*
- [ ] `pnpm type-check` passes across all packages (sequential to avoid memory spikes)
- [ ] `pnpm build:desktop` produces a valid renderer bundle:
  - Package workers split correctly (if any) — Vite's default `worker.format: "iife"` cannot do code-splitting; dynamic imports in workers require `worker: { format: "es" }`
  - Lazy-loaded deps do NOT appear in the startup chunk
  - Import `@boffmedia/tools-<domain>/tools` (manifests + lazy refs only), NOT the barrel — the barrel eagerly re-exports components and UI kit, which drags heavy dependencies into the startup chunk
  - Measure startup time before and after (should not regress by >10% without heavy deps like three.js)

### 7. Testing & Verification

- [ ] Tool works in **`dev:renderer` mode** (browser, mocked capabilities)
- [ ] Tool works in **desktop Tauri dev build** with all required capabilities
- [ ] Tool is **reachable pre-auth** and **offline** (if it does not require `api`)
- [ ] If tool uses `api`:
  - Anonymous calls (no session) work for public endpoints
  - Authenticated calls attach the player's session when one exists
  - A 401 does NOT sign the player out unexpectedly

### 8. Web Counterpart (if extracted from web)

- [ ] Web imports the tool from the package (not local `_components`)
- [ ] Web routing wraps stateful tools in host-router adapters (e.g., `VgcNavProvider`)
- [ ] Web regression pass: tool visually and functionally identical to before extraction
- [ ] Web Tailwind config includes `packages/tools/<domain>` in `content` globs

### 9. Code Review

- [ ] Tool package has **no unused variables** (lint rule is `error` with `_` prefix ignore pattern)
- [ ] No dead code, no commented-out imports
- [ ] Manifest lazy-loads the component (do NOT eagerly re-export it from the barrel)

### 10. Launch & Communication

- [ ] Tool is listed in the **tool inventory** in `docs/boffmedia-desktop-app-plan.md` §2 (update the table)
- [ ] Owner is notified of the tool's availability in the desktop app
- [ ] Tool is **visible in both web and desktop hubs** (registry-driven rendering)

<!-- mimir:policy BEGIN (managed by `mimir wire`; do not edit inside) -->
## mimir — persistent memory (recall before deciding, record after)

`mimir` is a durable, searchable log of decisions, bugfixes, patterns and preferences for this
project, plus a global store shared across every project. It survives context windows and sessions.

| Need | Command |
| --- | --- |
| what is already known here | `mimir context` |
| recall prior work on a topic | `mimir search "<terms>"` |
| record something worth keeping | `mimir save "<title>" -t <type> --what "…" --why "…"` |
| read one entry in full | `mimir show <id>` |
| mark an entry replaced by a newer one | `mimir supersede <old-id> --by <new-id>` |
| what happened recently | `mimir timeline` |

`<type>` is one of `decision`, `bugfix`, `pattern`, `preference`, `session`. Add `--topic <key>` to
group related entries, and `--global` for something true of every project (tooling, house style).

**Recall first.** Before designing anything non-trivial, debugging something that feels familiar, or
re-deriving a constraint, run `mimir search` on the topic. A recorded decision stands unless you
have a reason to overturn it — and if you overturn it, `mimir save` the replacement and
`mimir supersede` the old entry so recall stops surfacing it.

**Record as you go, not at the end.** After a non-obvious choice, a fixed bug, or a discovered
gotcha, save it with the *why*, not just the *what*. One fact per entry, titled so a future
`mimir search` finds it.
<!-- mimir:policy END -->

## Janus CLI tools (Codex)

Mimir and Horus are available as local command-line tools, not MCP servers. Use their managed
guidance below when deciding when and how to invoke them.

- On Windows PowerShell, use `mimir.cmd` and `horus.cmd` explicitly. The extensionless commands
  can resolve to `.ps1` launchers that are blocked by the local execution policy.
- Do not invoke the Claude-only `hook` commands from Codex sessions.

<!-- horus:policy BEGIN (managed by `horus wire`; do not edit inside) -->
## horus — code graph (query it before searching text)

`horus` keeps a symbol/edge index of this repo in `.horus/graph.db`. **Locate code by querying the
graph; use text search only for what the graph cannot answer** — comments, config, strings, docs,
and other non-code text.

| Need | Command |
| --- | --- |
| (re)build the index | `horus build` |
| top-down overview: apps, cross-app edges, hotspots, modules | `horus architecture` |
| find a symbol by name / FQN / doc words | `horus search <name or phrase>` |
| restrict a search to one app/package | `horus search <term> --app <api\|web\|…>` |
| symbols + callers + callees + blast radius (signatures) | `horus explore <symbol>` |
| full source of one symbol, on demand | `horus show <symbol>` |
| who calls this (incl. cross-app http/ipc callers) | `horus callers <symbol>` |
| what this calls | `horus callees <symbol>` |
| everything a change would touch (+ tests covering it) | `horus impact <symbol>` |
| symbols your working diff touches + blast radius | `horus diff` |
| index health + unresolved-edge causes | `horus status` |
| visualize the graph in the browser | `horus view` |

**Order of operations:** `horus architecture` when the repo is unfamiliar → `horus search`/`explore`
to locate (search also matches doc-comment words, so a phrase like "retry logic" works) →
`horus show` or a targeted `grep` on the file it named to read the exact lines → *never* a broad
`grep`/`rg`/`find` over the repo as the first move.

In a monorepo, edges cross app boundaries: a web client call site links to the NestJS route it hits
(`http`) and a Tauri `invoke()` links to its Rust command (`ipc`). So `horus impact` on a server
handler already lists the client code that depends on it — check it before changing a route or a
shared endpoint. Entries marked `?` are unproven candidates (over-approximation is deliberate;
`--strict` hides them). If a command reports the graph is missing or stale, run `horus build`
(incremental, seconds) and retry — do not fall back to grepping the whole repo.
<!-- horus:policy END -->
