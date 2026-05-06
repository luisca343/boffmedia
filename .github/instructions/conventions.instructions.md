---
applyTo: "**"
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

## Shared Types — Critical Rules

- `packages/shared/src/` is **auto-generated** from the NestJS OpenAPI spec. Never manually edit these files.
- To add a type: define the DTO/entity on the server, then run `pnpm generate:shared` (api must be running).
- The client imports types from `@boffmedia/shared`. Never redefine or duplicate these types on the client.
- TypeScript path alias `@boffmedia/shared` resolves to `packages/shared/src/index.ts` in both apps.

## API Services — Critical Rules

- All HTTP API calls from the client go through `apps/web/src/services/api/`. Never inline `fetch` calls in components or pages.
- Add new endpoints to the matching service file (`boffmedia/`, `smartrotom/`, or `tools/`).
- The NestJS server runs on port **34301**. The client's `NEXT_PUBLIC_API` env var points to the deployed API URL.

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
