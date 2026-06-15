# boffmedia — Architecture

## Overview

Boffmedia is a gaming tools platform and Pixelmon/Minecraft companion. Two client-facing products share a single NestJS API backend:

- **Boffmedia** — Gaming tools (VGC meta, TCG Pocket, MHWilds builds, manga library), events, leaderboards, user profiles.
- **SmartRotom** — In-game Pixelmon companion rendered as a cellphone UI with 20+ apps (Pokedex, StarBank, ChatApp, Liga, Mina, Misiones, Arcade, Taxi, etc.). Communicates with Minecraft via MCEF.

A **Discord bot** (necord) runs inside the same NestJS process, providing slash commands for VGC meta analysis, quote management, and TTS in voice channels.

**Users:** Gaming community members; Pixelmon server players access SmartRotom through the Minecraft client.

## Stack & tooling

| Layer | Tech | Version |
|---|---|---|
| Package manager | pnpm workspaces | >=10 |
| Node | Node.js | >=22 |
| Frontend | Next.js (App Router) | 16.0.7 |
| Frontend | React | 19.2.3 |
| Backend | NestJS + Express 5 | 11.x |
| Database | MySQL (TypeORM 0.3.25 + Drizzle 0.44.4) | — |
| Real-time | Socket.io | 4.7.4 (client), 4.8.1 (server) |
| Auth | NextAuth + Passport/JWT + Google OAuth | — |
| Styling | Tailwind CSS 3.3 + Radix UI (shadcn) + neobrutalism (SmartRotom) | — |
| State | Zustand 4.5 | — |
| Validation | Zod 3.22 (client), class-validator (server), Zod 4.4 (server env) | — |
| Shared types | openapi-typescript-codegen 0.29 (auto-generated from OpenAPI spec) | — |
| Testing | Playwright 1.49 (web e2e), Jest 30 (api unit/integration) | — |
| Monitoring | Prometheus + Grafana, Pino structured logging | — |
| Discord | discord.js 14 + necord 6.9 | — |
| AI | Google Gemini, OpenAI | — |

**Key commands:**

```bash
pnpm dev              # web + api concurrently
pnpm dev:web          # Next.js only
pnpm dev:api          # NestJS only (watch mode, 3GB heap)
pnpm build:web        # Next.js production build
pnpm build:api        # NestJS production build
pnpm lint             # Sequential lint (memory-safe, 2GB/process)
pnpm type-check       # Sequential type-check (memory-safe, 2GB/process)
pnpm generate:shared  # Regenerate shared types (requires api running on :34301)
pnpm setup            # Create public/ symlinks (first-time)
pnpm --filter api test       # Jest tests (4GB heap, single worker)
pnpm --filter web test       # Playwright e2e
```

## Module map

```
/
├── apps/
│   ├── web/                  # Next.js 16 client (port 3000)
│   │   └── src/
│   │       ├── app/                    # App Router routes
│   │       │   ├── (boffmedia)/        # Boffmedia section (route group)
│   │       │   │   ├── (eventos)/      # Events, leaderboards
│   │       │   │   ├── (herramientas)/ # Gaming tools (DESIGN SYSTEM BASELINE)
│   │       │   │   └── (politicas)/    # Policy pages
│   │       │   ├── smartrotom/         # SmartRotom cellphone UI (20+ app routes)
│   │       │   ├── battlesim/          # Pokemon battle simulator
│   │       │   ├── showdown/           # Pokemon Showdown integration
│   │       │   ├── wingull/            # Wingull invite system
│   │       │   └── auth/               # Login, unauthorized
│   │       ├── components/
│   │       │   ├── ui/primitives/      # 33 shadcn/Radix primitives (no business logic)
│   │       │   ├── boffmedia/          # Boffmedia domain (78 primitives + UI modules)
│   │       │   ├── smartrotom/         # SmartRotom domain (neobrutalism design system)
│   │       │   └── shared/             # Shared utility (pokemon, book, map, ckeditor)
│   │       ├── services/
│   │       │   ├── api/boffmedia/      # Boffmedia API calls (7 files)
│   │       │   ├── api/smartrotom/     # SmartRotom API calls (18 files)
│   │       │   ├── api/tools/          # Tool-specific API calls
│   │       │   └── mcef/               # Minecraft MCEF integration
│   │       ├── features/
│   │       │   ├── ficusai/            # FicusAI chat feature slice
│   │       │   └── vgc-tracker/        # VGC match tracking (IndexedDB via Dexie)
│   │       ├── hooks/                  # Domain-organized hooks (19 directories)
│   │       ├── stores/                 # 7 Zustand stores
│   │       ├── providers/              # Session, Socket, Pokemon, SpriteManifest
│   │       └── lib/                    # Utilities (pokemon, minecraft, DnD, i18n)
│   │
│   └── api/                  # NestJS server (port 34301)
│       └── src/
│           ├── main.ts                # Bootstrap: ValidationPipe, CORS, Swagger, Scalar
│           ├── app.module.ts           # Root module (35+ imports)
│           ├── api/
│           │   ├── auth/               # JWT + Google OAuth + roles
│           │   ├── boffmedia/          # Events, tools (pokemon, mhwilds, youtube, scrape, manga), users
│           │   ├── smartrotom/         # 18 submodules (pokemon, starbank, chatapp, liga, mine, misiones, ficusai, arcade, achievement, player, documents, notifications, wingull, apps, users, netfluis)
│           │   ├── battlesimulator/    # Battle rooms + Showdown WS proxy
│           │   └── wingull/            # Invite codes
│           ├── discord/               # Discord bot (necord): slash commands, TTS, VGC meta
│           ├── _db/schema/            # 15 Drizzle schema files (~50 tables)
│           ├── _utils/                # DrizzleService, MySQL2Service, metrics, sockets
│           ├── common/                # DTOs, exceptions, global filter
│           ├── automation/            # Twitch integration
│           └── seed/                  # Default roles, admin user, apps
│
└── packages/
    └── shared/               # @boffmedia/shared — auto-generated OpenAPI types (351 models)
        └── src/
            ├── index.ts      # Barrel (auto-generated)
            ├── roles.ts      # UserRole constants (manually maintained)
            └── models/       # 351 type files (auto-generated, DO NOT EDIT)
```

## Key flows

### 1. API request lifecycle (Boffmedia/SmartRotom)

```
Client component
  → services/api/{domain}Service.ts    # Typed API call
    → services/boffAPI.ts              # HTTP wrapper (apiGET/apiPOST/rotomGET/etc.)
      → NEXT_PUBLIC_API + /endpoint    # → NestJS on :34301
        → MinecraftMiddleware          # Validates MC_WORLD for /smartrotom/* POST requests
        → MetricsMiddleware            # Prometheus histogram + counter
        → JwtAuthGuard + RolesGuard    # Auth check (if protected)
        → ValidationPipe               # class-validator DTO validation
        → Controller → FacadeService → Service/Repository
        → ResponseInterceptor          # Wraps in { success, statusCode, message, data }
        → GlobalExceptionFilter        # Catches errors, formats response
```

### 2. Shared types contract flow

```
NestJS controller/DTO (decorated with @ApiProperty/@ApiResponse)
  → Swagger auto-generates OpenAPI spec at /api-json
    → pnpm generate:shared
      → openapi-typescript-codegen reads :34301/api-json
        → packages/shared/src/models/*.ts regenerated
          → @boffmedia/shared available to both apps via TS path alias
```

### 3. SmartRotom real-time flow

```
Minecraft player action → MCEF (window.mcefQuery)
  → services/mcef/mcefApi.ts
    → NestJS API (or direct Socket.io)
      → SocketsGateway (:34304)
        → Broadcasts to connected SmartRotom clients
          → SocketProvider → Zustand store update → UI re-render
```

### 4. Discord bot VGC meta flow

```
User types /meta-pokemon in Discord
  → Necord routes to MetaCommand handler
    → MetaCacheService (in-memory cache)
    → VgcService queries Drizzle (vgc_smogon_*, vgc_limitless_* tables)
    → Formats embed with stats, teammates, speed tiers
    → Reply with Discord embed
```

## Conventions

**Routing:**
- Route groups use `(name)` syntax — no URL impact.
- Route-private components go in `_components/` subdirectories.
- `herramientas/` is the Boffmedia design system baseline — all Boffmedia sections must match its visual style.

**Components (4-layer):**
1. `components/ui/primitives/` — shadcn/Radix, zero business logic.
2. `components/ui/{navigation,display,form,interactive}/` — Global cross-section UI.
3. `components/shared/` — Utility components with no domain models.
4. `components/{boffmedia,smartrotom}/` — Domain-specific.
5. Route-private: `app/**/_components/` (default for new components).

**Two design systems — never mix:**
- Boffmedia: shadcn/Radix globals (`components/ui/primitives/`).
- SmartRotom: neobrutalism variants (`components/smartrotom/ui/badge.tsx`, `button.tsx`). Do NOT replace with global equivalents.

**API layer:**
- All HTTP calls from client go through `services/api/`. Never inline `fetch` in components.
- Use `boffAPI.ts` wrappers: `apiGET`, `rotomGET`, `wingullGET`, `apiAuthedPOST`, `apiMultipartPOST`, etc.
- Every API response is typed `ApiResponse<T>` with `{ statusCode, message, data?, error?, success }`.

**Database:**
- Dual ORM: Drizzle (newer modules) + TypeORM (legacy entity modules). Never mix within a single module.
- Drizzle schemas in `_db/schema/`. Migrations via `drizzle-kit`.
- Repository pattern: `BaseRepository<T, CreateDto, UpdateDto>` with DI tokens.

**Validation:**
- Server: `class-validator` DTOs. Global `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`.
- Client: Zod schemas with `react-hook-form` + `@hookform/resolvers`.

**Shared types:**
- `packages/shared/src/` is auto-generated. Never edit manually.
- `roles.ts` is the only manually-maintained file in that package.
- To add a type: define the DTO on the server with Swagger decorators, then run `pnpm generate:shared`.

**i18n:**
- Uses `next-intl`. Always use translation keys, never hardcode user-facing strings.

**Testing:**
- API: Jest with `*.integration.spec.ts` for controller tests, `*.spec.ts` for services.
- Web: Playwright e2e (`apps/web/tests/`).

**WSL memory management:**
- `pnpm lint` and `pnpm type-check` run sequentially (2GB per process).
- `pnpm memory-check` before heavy operations.
- `pnpm dev:api` starts with `--max-old-space-size=3072`.

## Glossary

| Term | Meaning |
|---|---|
| **SmartRotom** | Pixelmon/Minecraft companion app styled as a cellphone UI with individual "apps" |
| **Boffmedia** | Gaming tools platform (VGC, TCG, MHWilds, manga, events) |
| **MCEF** | Minecraft Embedded Framework — allows direct client ↔ game communication via `window.mcefQuery` |
| **FicusAI** | AI chat feature powered by Google Gemini, with Pokemon card rendering |
| **StarBank** | Virtual in-game banking system (accounts, transfers, transactions) |
| **Liga** | Competitive Pokemon league system (gyms, tournaments, fight camera) |
| **Mina** | Mining mini-game with grid-based reward system |
| **Misiones** | Quest/mission system with objectives and rewards |
| **Arcade** | Gacha/lootbox system with daily rewards and streak tracking |
| **Wingull** | Invite code system for Pixelmon server access |
| **FicusNav** | Top navigation bar for Boffmedia sections |
| **RotomNav** | Bottom navigation bar for SmartRotom |
| **AppWrapper** | SmartRotom cellphone frame wrapper component |
| **necord** | NestJS + discord.js integration framework |
| **Showdown gateway** | WebSocket proxy that connects individual clients to Pokemon Showdown |
| **VGC** | Video Game Championships — competitive Pokemon format |
| **TCG Pocket** | Pokemon Trading Card Game Pocket — mobile card game |

## Gotchas

- **`ignoreBuildErrors: true`** in `next.config.mjs` — TypeScript errors do NOT fail the Next.js build. Always run `pnpm type-check` separately.
- **Dual ORM** — TypeORM and Drizzle coexist. Check which ORM a module uses before editing. Never mix within a module.
- **MCEF guards** — Always check `isMinecraft()` before calling MCEF functions. `mcefPlaceholders.ts` provides fallbacks.
- **Design system bleed** — SmartRotom's neobrutalism `badge.tsx` and `button.tsx` are incompatible with global primitives. Never replace one with the other.
- **WSL OOM** — The monorepo has crashed WSL from memory exhaustion. Use `pnpm lint` / `pnpm type-check` (sequential), not `:parallel` variants, unless you have >16GB RAM.
- **Public folder** — `public/` is gitignored at root and symlinked via `pnpm setup`. Both apps share one `public/` directory.
- **Google service account** — `apps/api/*.json` is blocked in `.gitignore` except for config files. Don't accidentally commit credentials.
- **`@pkmn/*` version overrides** — All `@pkmn` packages are pinned in `pnpm-workspace.yaml`. Do not upgrade them independently.
- **OpenAPI codegen** — `pnpm generate:shared` requires the API to be running on port 34301. The spec is served live, not from a file.
- **Socket.io ports** — API listens on 34301, WebSocket gateway on 34304. CORS origins are hardcoded in `main.ts`.
