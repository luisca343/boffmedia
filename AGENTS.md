# AGENTS.md — Boffmedia Monorepo

Monorepo for Boffmedia (gaming tools platform) and SmartRotom (Pixelmon/Minecraft companion), with a shared NestJS API and Next.js client.

---

## Tech Stack

| Layer | Tech | Version |
|---|---|---|
| Package manager | pnpm workspaces | >=9 |
| Node | Node.js | >=20 |
| Frontend | Next.js | 16.0.7 |
| Frontend | React | 19.2.3 |
| Backend | NestJS | 11.x |
| Database | MySQL + TypeORM + Drizzle ORM | TypeORM 0.3.25, Drizzle 0.44.4 |
| Real-time | Socket.io | 4.7.4 (client), 4.8.1 (server) |
| Auth | NextAuth + Passport/JWT | NextAuth 4.24.6 |
| Styling | Tailwind CSS + Radix UI | Tailwind 3.3.0 |
| State | Zustand | 4.5.0 |
| Validation | Zod (client), class-validator (server) | Zod 3.22.4 |
| Shared types | openapi-typescript-codegen | 0.29.0 |
| Testing | Playwright (e2e) + Jest (api) | Playwright 1.49.1, Jest 30.0.5 |

---

## Repository Layout

```
/
├── apps/
│   ├── web/          # Next.js client (port 3000)
│   │   └── src/
│   │       ├── app/                    # App Router routes
│   │       │   ├── (boffmedia)/        # Boffmedia section
│   │       │   │   ├── (eventos)/      # Events
│   │       │   │   └── (herramientas)/ # Gaming tools (baseline design system)
│   │       │   └── smartrotom/         # SmartRotom cellphone UI
│   │       ├── services/
│   │       │   ├── api/boffmedia/      # Boffmedia API calls
│   │       │   ├── api/smartrotom/     # SmartRotom API calls
│   │       │   ├── api/tools/          # Tool-specific API calls
│   │       │   └── mcef/               # Minecraft MCEF integration
│   │       ├── components/
│   │       │   ├── ui/primitives/      # shadcn/Radix primitives (no business logic)
│   │       │   ├── boffmedia/          # Boffmedia domain components
│   │       │   ├── smartrotom/         # SmartRotom components (own design system)
│   │       │   └── shared/pokemon/     # Shared Pokémon UI (TypeBadge, etc.)
│   │       └── features/ficusai/       # FicusAI chat feature slice
│   └── api/          # NestJS server (port 34301)
│       └── src/
│           ├── api/boffmedia/          # Boffmedia endpoints
│           ├── api/smartrotom/         # SmartRotom endpoints
│           ├── discord/                # Discord bot
│           ├── _db/schema/             # Drizzle schema definitions
│           └── _repositories/          # Data access layer
└── packages/
    └── shared/src/models/  # AUTO-GENERATED — do not edit (255+ OpenAPI models)
```

---

## Commands

```bash
# Root (run from repo root)
pnpm dev              # Run web + api concurrently
pnpm dev:web          # Next.js dev only
pnpm dev:api          # NestJS dev only (watch mode)
pnpm build:web        # Next.js production build
pnpm build:api        # NestJS production build
pnpm lint             # Lint all packages
pnpm type-check       # TypeScript check all packages
pnpm generate:shared  # Regenerate shared types (requires api on port 34301)
pnpm setup            # Create public folder symlinks (first-time setup)

# apps/api only
pnpm --filter api generate   # Drizzle migration generation
pnpm --filter api migrate    # Run Drizzle migrations
pnpm --filter api test        # Jest tests
pnpm --filter api test:e2e   # End-to-end tests

# apps/web only
pnpm --filter web test        # Playwright e2e tests
```

---

## Shared Types — Critical Rules

- `packages/shared/src/` is **auto-generated** from the NestJS OpenAPI spec. Never manually edit these files.
- To add a type: define the DTO/entity on the server, then run `pnpm generate:shared` (api must be running).
- The client imports types from `@boffmedia/shared`. Never redefine or duplicate these types on the client.
- TypeScript path alias `@boffmedia/shared` resolves to `packages/shared/src/index.ts` in both apps.

---

## API Services — Critical Rules

- All HTTP API calls from the client go through `apps/web/src/services/api/`. Never inline `fetch` calls in components or pages.
- Add new endpoints to the matching service file (`boffmedia/`, `smartrotom/`, or `tools/`).
- The NestJS server runs on port **34301**. The client's `NEXT_PUBLIC_API` env var points to the deployed API URL.

---

## Product Sections

### Boffmedia
Gaming tools platform. Sections: `herramientas/` (tools), `eventos/` (events), `games/`.
- `herramientas/` is the **design system baseline** — all Boffmedia sections must stay visually consistent with it.
- Uses the global design system at `components/ui/primitives/` (shadcn/Radix).
- Global nav: `FicusNav`.

### SmartRotom
Pixelmon (Minecraft) server companion app, styled as a cellphone UI with individual apps.
- Has its own design system: `components/smartrotom/ui/` (neobrutalism variants).
- May reuse Boffmedia components, but **do not force Boffmedia styles onto SmartRotom**.
- This is Pixelmon/Minecraft-themed — respect that context for UI and logic suggestions.
- Nav: `RotomNav`, wrapper: `AppWrapper`.

---

## Minecraft Integration (MCEF)

MCEF (Minecraft Embedded Framework) allows direct client-side communication with the Minecraft game process via `window.mcefQuery`.

- All MCEF functions live in `apps/web/src/services/mcef/`.
- Use `isMinecraft()` to guard MCEF calls; `mcefPlaceholders.ts` provides fallbacks for non-Minecraft browsers.
- **Do not invent new MCEF integration patterns.** Rely on existing functions in `mcefApi.ts` or server-side relay endpoints.
- When MCEF is unsuitable (server-authoritative actions), use the NestJS API as a relay instead.
- Available MCEF functions: `getMcUserData`, `openPC`, `getSpawns`, `setCall`, `leaveCall`, `sendChatMessage`, `taxiTeleport`, `darCaja`, `takeScreenshot`, `getZoomLevel`, `setZoomLevel`, `getWaypoints`, `addWaypoint`.

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
- **i18n**: The app uses `next-intl`. Always use translation keys, never hardcode user-facing strings.
- **Database**: NestJS uses both TypeORM (entity-based modules) and Drizzle (newer modules and `_db/schema/`). Do not mix ORM patterns within a single module.
- **Swagger**: Decorated with `@ApiProperty`/`@ApiResponse` — all new DTOs must include Swagger decorators so the OpenAPI spec stays accurate for `generate:shared`.
- **Validation**: All incoming request bodies validated via `class-validator` DTOs on the server. The global `ValidationPipe` has `whitelist: true` and `forbidNonWhitelisted: true` — extra properties are rejected.
- **next.config.mjs**: `ignoreBuildErrors: true` is set — TypeScript errors do NOT fail the Next.js build. Always run `pnpm type-check` separately.
- **SmartRotom design tokens**: `components/smartrotom/ui/badge.tsx` and `button.tsx` use neobrutalism variants that are incompatible with the global primitives. Do not replace them with global equivalents.
- **Pokémon libraries**: `@pkmn/*` packages are version-overridden in `pnpm-workspace.yaml`. Do not upgrade them independently.
- **Discord bot** lives inside the NestJS app (`src/discord/`), not as a separate service.
