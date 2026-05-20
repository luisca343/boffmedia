# Copilot Instructions — Boffmedia Monorepo

Full reference: `AGENTS.md`. Path-specific context: `.github/instructions/`.

Additional scoped instruction domains:
- API standards: `api-standards.instructions.md`
- Web network policy: `web-network.instructions.md`
- i18n rules: `i18n.instructions.md`
- Repository hygiene: `hygiene.instructions.md`

## Boff Agent workflow — MANDATORY for code changes

This repo ships a custom MCP server `boff-agent`. **You MUST use it for every
code-modifying task.** Full rules: [`.agents/boff-workflow.md`](../.agents/boff-workflow.md).

- **Before any edit/write** on a code file, call ONE of:
  - `plan_goal` — multi-module / multi-app / >10 files / new schema+service+controller+UI. Creates BookStack chapter of `status:draft` tasks. STOP after drafting; user approves before execution.
  - `begin_task` — single concern, <10 files. Set `taskType`: `feature` / `bugfix` / `refactor` / `ui-ux`.
- Follow the workflow steps returned by the tool in order. Do not skip.
- Close with `save_run` (passed or failed). Never abandon a `runId`.
- Never call `create_gitlab_mr` automatically — only on explicit user request.

Carve-outs (workflow NOT required): read-only questions, single-line typo fixes,
conversational replies, edits inside `packages/agent/**`, edits to instruction /
config files. When in doubt, USE the workflow.

If `boff-agent` MCP tools are not registered, STOP and tell the user — do not
silently fall back to ad-hoc editing.

## Stack
NestJS 11 (port 34301) + Next.js 16 App Router (port 3000). pnpm workspaces. MySQL + TypeORM + Drizzle.

## Critical rules

- Never edit `packages/shared/src/` — auto-generated from OpenAPI. Run `pnpm generate:shared` after adding server DTOs.
- All HTTP calls go through `apps/web/src/services/api/`. Never inline `fetch` in components.
- Default new components to `app/**/_components/`. Promote with justification only.
- Run `pnpm type-check` to verify TypeScript — `next.config.mjs` ignores TS build errors.
- Two incompatible design systems — do NOT cross-apply:
	- Boffmedia: `components/ui/primitives/` (shadcn/Radix)
	- SmartRotom: `components/smartrotom/ui/` (neobrutalism)
- Never invent new `window.mcefQuery` call shapes. Extend `mcefApi.ts` only.
- New DTOs must include `@ApiProperty`/`@ApiResponse` Swagger decorators.
- Use `class-validator` for all server request bodies. `ValidationPipe` has `whitelist: true` and `forbidNonWhitelisted: true`.
- Use `next-intl` translation keys — never hardcode user-facing strings.
- Use `@/` absolute aliases, not deep relative paths (more than 2 levels).
- Do not mix TypeORM and Drizzle within a single module.
- `@pkmn/*` packages are version-overridden in `pnpm-workspace.yaml` — do not upgrade independently.

## Forbidden paths — never read
- `packages/shared/src/` — 255+ auto-generated files
- `node_modules/`, `.next/`, `dist/`, `pnpm-lock.yaml`

## Key commands
- `pnpm dev` — run web + api
- `pnpm generate:shared` — regenerate shared types (api must be on port 34301)
- `pnpm type-check` — TypeScript check all packages
- `pnpm --filter api migrate` — run Drizzle migrations
