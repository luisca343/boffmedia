# Boffmedia — Codebase Conventions

> Injected by `agent:resolve_context` as baseline context for every task.

---

## Commands

```bash
# Root
pnpm dev              # web + api concurrently
pnpm dev:web          # Next.js dev only
pnpm dev:api          # NestJS dev only (watch mode)
pnpm build:web        # Next.js production build
pnpm build:api        # NestJS production build
pnpm lint             # Lint all packages
pnpm type-check       # TypeScript check all packages (always run before marking done)
pnpm generate:shared  # Regenerate packages/shared/src/ (api must be running on port 34301)
pnpm setup            # Create public folder symlinks (first-time setup)

# apps/api
pnpm --filter api generate   # Drizzle migration generation
pnpm --filter api migrate    # Run Drizzle migrations
pnpm --filter api test       # Jest unit tests
pnpm --filter api test:e2e   # Jest e2e tests

# apps/web
pnpm --filter web test       # Playwright e2e tests
```

---

## Shared Types

- `packages/shared/src/` is **auto-generated** from the NestJS OpenAPI spec. Never manually edit these files.
- To add a type: define the DTO/entity in NestJS, then run `pnpm generate:shared`.
- The client imports from `@boffmedia/shared`. Never redefine or duplicate these types on the client.

---

## API (NestJS)

- All request DTOs must use `class-validator` decorators.
- All new DTOs/entities must include `@ApiProperty` decorators; controller responses must include `@ApiResponse`.
- Array Swagger style: `@ApiProperty({ type: ModelClass, isArray: true })` — avoid `type: [ModelClass]`.
- Global `ValidationPipe` is `whitelist: true` + `forbidNonWhitelisted: true` — extra properties are rejected.
- Do not mix TypeORM and Drizzle patterns inside the same module.
- All HTTP API calls from the client go through `apps/web/src/services/api/`. Never inline `fetch` in components.
- NestJS runs on port **34301**. Client uses `NEXT_PUBLIC_API` for the deployed URL.
- Discord bot lives inside NestJS (`src/discord/`), not as a separate service.

---

## Component Architecture (Next.js)

Four-layer system — never skip layers:

| Layer | Location | Rule |
|---|---|---|
| Primitives | `components/ui/primitives/` | shadcn/Radix, no business logic |
| Global UI | `components/ui/navigation/`, `display/`, etc. | Used across 2+ unrelated sections |
| Shared utilities | `components/shared/` | Technical, no domain models |
| Feature slice | `features/{domain}/` | Domain-specific, 2+ routes in same domain |
| Route-private | `app/**/_components/` | **Default for all new components** |

Promotion path: `_components/` → `features/` → `components/` — justify each promotion.

Non-component files (types.ts, config.ts, .svg, .css) must not live inside `_components/`.

---

## Key Conventions

- **Route groups** use `(name)` syntax and do not affect the URL path.
- **Imports**: use `@/` absolute aliases instead of deep relative paths (more than 2 levels).
- **i18n**: uses `next-intl`. Always use translation keys — never hardcode user-facing strings.
- **next.config.mjs**: `ignoreBuildErrors: true` — TypeScript errors do NOT fail the Next.js build. Always run `pnpm type-check` separately.
- **Design systems**: do NOT cross SmartRotom (`components/smartrotom/ui/`) ↔ Boffmedia (`components/ui/primitives/`).
- **SmartRotom tokens**: `badge.tsx` and `button.tsx` use neobrutalism variants — do not replace with global primitives.
- **Pokémon libraries**: `@pkmn/*` packages are version-overridden in `pnpm-workspace.yaml`. Do not upgrade independently.
- **MCEF**: never invent new `window.mcefQuery` shapes — extend `mcefApi.ts` using `mcefQuery<T>()`.
