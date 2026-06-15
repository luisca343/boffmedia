# boffmedia — Constitution

Non-negotiable principles for every change in this project.

## Principles

1. **Spec before code.** Code-modifying work flows through the janus lifecycle (spec → plan → tasks → execute). See `AGENTS.md` for the workflow contract.
2. **Tests gate completion.** A task is not done until `verify_run` passes. Run `pnpm lint` and `pnpm type-check` at minimum; run domain-specific tests when the task touches that domain.
3. **Small, reviewable changes.** Prefer several focused tasks over one sprawling diff.
4. **Contract-first API.** Shared types are generated from the OpenAPI spec. Define DTOs on the server first, then regenerate `@boffmedia/shared`.
5. **Separate design systems.** Boffmedia uses shadcn/Radix; SmartRotom uses neobrutalism. Never force one onto the other.

## Conventions

- All public API surfaces are typed — no `any` in exported signatures.
- Database schema changes ship with a Drizzle migration (`pnpm --filter api generate`).
- New NestJS endpoints require `@ApiProperty`/`@ApiResponse` Swagger decorators on DTOs.
- Client HTTP calls go through `services/api/` — never inline `fetch` in components.
- Use `next-intl` translation keys for all user-facing strings — never hardcode text.
- New components default to `app/**/_components/` (route-private). Promote to `features/` or `components/` only with justification.
- Imports use `@/` absolute aliases, not deep relative paths (more than 2 levels).
- WSL memory: use `pnpm lint` / `pnpm type-check` (sequential), not `:parallel` variants.

## Forbidden

- Do not edit files matched by `.agentignore` (enforced by `guard_check`). This includes `packages/shared/src/models/`, `node_modules/`, `.next/`, `dist/`, lockfiles, and `.env*` files.
- Do not create merge/pull requests without an explicit user request.
- Do not mix TypeORM and Drizzle patterns within a single NestJS module.
- Do not replace SmartRotom neobrutalism components (`components/smartrotom/ui/`) with global shadcn primitives.
- Do not hardcode user-facing strings in components — use i18n keys.
- Do not inline `fetch` calls in React components — use the service layer.
- Do not invent new MCEF integration patterns — use existing functions in `services/mcef/`.
- Do not commit secrets, keys, or credentials.
