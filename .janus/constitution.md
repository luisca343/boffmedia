# Boffmedia — Constitution

Non-negotiable principles for every change in this project. This file is injected
into the context of every janus task. Keep it short, specific, and current.

---

## Principles

1. **Spec before code.** Code-modifying work flows through the janus lifecycle
   (spec → plan → tasks → execute). See `AGENTS.md` for the workflow contract.
2. **Tests gate completion.** A task is not done until `verify_run` passes (`pnpm lint` + `pnpm type-check`).
3. **Small, reviewable changes.** Prefer several focused tasks over one sprawling diff.
4. **Never break the build.** `next.config.mjs` has `ignoreBuildErrors: true` — TypeScript errors do NOT fail Next.js builds. Always run `pnpm type-check` separately.
5. **Respect domain boundaries.** Boffmedia and SmartRotom are separate products sharing one codebase. Do not mix their design systems or domain logic.

---

## Conventions

### Shared Types
- `packages/shared/src/` is **auto-generated** from the NestJS OpenAPI spec. Never manually edit these files.
- To add a type: define the DTO/entity on the server with `@ApiProperty` decorators, then run `pnpm generate:shared` (api must be running on port 34301).
- The client imports types from `@boffmedia/shared`. Never redefine or duplicate these types on the client.

### API Layer
- All HTTP API calls from the client go through `apps/web/src/services/api/`. Never inline `fetch` calls in components or pages.
- Add new endpoints to the matching service file (`boffmedia/`, `smartrotom/`, or `tools/`).
- NestJS runs on port **34301**. The client's `NEXT_PUBLIC_API` env var points to the deployed API URL.

### NestJS (API)
- All request DTOs must use `class-validator` decorators.
- All new DTOs/entities must include `@ApiProperty` decorators; controller responses must include `@ApiResponse`.
- Array Swagger style: `@ApiProperty({ type: ModelClass, isArray: true })` — avoid `type: [ModelClass]`.
- Global `ValidationPipe` is `whitelist: true` + `forbidNonWhitelisted: true` — extra properties are rejected.
- Do not mix TypeORM and Drizzle patterns inside the same module.
- Discord bot lives inside NestJS (`src/discord/`), not as a separate service.

### Component Architecture (Next.js)
Four-layer system — never skip layers:

| Layer | Location | Rule |
|---|---|---|
| Boffmedia primitives | `components/boffmedia/primitives/` | **78 custom primitives** (BoffButton, BoffCard, etc.) — the actual Boffmedia design system |
| Boffmedia domain UI | `components/boffmedia/ui/` | Domain-specific: admin, events, games, tools, vgc, navigation, etc. |
| Global primitives | `components/ui/primitives/` | shadcn/Radix base — used as fallback or by non-Boffmedia sections |
| Shared utilities | `components/shared/` | Technical, no domain models |
| Feature slice | `features/{domain}/` | Domain-specific, 2+ routes in same domain |
| Route-private | `app/**/_components/` | **Default for all new components** |

Promotion path: `_components/` → `features/` → `components/` — justify each promotion.

Non-component files (types.ts, config.ts, .svg, .css) must not live inside `_components/`.

### Design Systems
- **Boffmedia**: Own design system at `components/boffmedia/primitives/` (78 custom primitives). Exported via `index.ts`. Baseline is `herramientas/`.
- **Global fallback**: `components/ui/primitives/` (shadcn/Radix) — available as base layer.
- **SmartRotom**: Own design system at `components/smartrotom/ui/` (neobrutalism variants).
- Do NOT cross SmartRotom ↔ Boffmedia design systems. Do not force Boffmedia styles onto SmartRotom.
- SmartRotom `badge.tsx` and `button.tsx` use neobrutalism variants — do not replace with global primitives.

### Key Conventions
- **Route groups** use `(name)` syntax and do not affect the URL path.
- **Imports**: use `@/` absolute aliases instead of deep relative paths (more than 2 levels).
- **i18n**: uses `next-intl`. Always use translation keys — never hardcode user-facing strings.
- **Pokémon libraries**: `@pkmn/*` packages are version-overridden in `pnpm-workspace.yaml`. Do not upgrade independently.
- **MCEF**: never invent new `window.mcefQuery` shapes — extend `mcefApi.ts` using `mcefQuery<T>()`.

---

## Forbidden

- Do not edit files matched by `.agentignore` (enforced by `guard_check`).
- Do not manually edit anything in `packages/shared/src/` — it is auto-generated.
- Do not create merge/pull requests without an explicit user request.
- Do not inline `fetch` calls in React components — use the services layer.
- Do not hardcode user-facing strings — use i18n translation keys.
- Do not mix TypeORM and Drizzle patterns within a single NestJS module.
- Do not force Boffmedia design tokens onto SmartRotom components (or vice versa).
- Do not invent new MCEF integration patterns — extend existing `mcefApi.ts`.
- Do not upgrade `@pkmn/*` packages independently — they are version-locked in `pnpm-workspace.yaml`.
