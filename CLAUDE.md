# CLAUDE.md

Full project reference: [AGENTS.md](./AGENTS.md) (load on demand).
Domain context: `.claude/context/` — load the relevant file when switching domains.

---

## Boff Agent workflow — MANDATORY for code changes

This repo ships a custom MCP server `boff-agent`. **You MUST use it for every
code-modifying task.** Full rules: [.agents/boff-workflow.md](./.agents/boff-workflow.md).

- **Before any Edit/Write** on a code file, call ONE of:
  - `plan_goal` — multi-module / multi-app / >10 files / new schema+service+controller+UI / words like "feature", "migrate", "rebuild", "audit". Creates BookStack chapter with `status:draft` tasks. STOP after drafting; user approves before execution.
  - `begin_task` — single concern, single module, <10 files. Set `taskType` to `feature`/`bugfix`/`refactor`/`ui-ux`.
- Follow the workflow steps returned by the tool in order. Do not skip.
- Close with `save_run` (status: passed or failed). Never abandon a `runId`.
- Never call `create_gitlab_mr` automatically — only on explicit user request.

**Carve-outs** (workflow NOT required): pure read-only questions, single-line typo fixes,
conversational replies, edits inside `packages/agent/**` itself, edits to instruction
files (`*.md`, `.mcp.json`, `opencode.json`). When in doubt, USE the workflow.

If the `boff-agent` MCP tools are not registered in your session, STOP and tell the
user — do not silently fall back to ad-hoc editing.

---

## Always-active rules

- Default new components to `app/**/_components/`. Promote only with justification.
- Never edit `packages/shared/src/` — auto-generated. Run `pnpm generate:shared` after adding server DTOs.
- Run `pnpm type-check` before marking any task done (`next.config.mjs` ignores TS build errors).
- Do NOT cross design systems: SmartRotom (`components/smartrotom/ui/`) ↔ Boffmedia (`components/ui/primitives/`).
- Do NOT invent new `window.mcefQuery` shapes — extend `mcefApi.ts` using `mcefQuery<T>()`.
- For unfamiliar modules, use the `repo-explorer` subagent to avoid burning context on large directory trees.

---

## Forbidden paths — never read

- `packages/shared/src/` — 255+ auto-generated OpenAPI models
- `node_modules/`, `.next/`, `dist/`, `*.lock`, `pnpm-lock.yaml`
- `.env`, `.env.*`, `.env.agent`, `**/.env*` — environment files containing secrets. Never read, grep, cat, or inspect these. If env var debugging is needed, ask the user to confirm the key name only — never reveal values.

---

## Session discipline

- Run `/context` at session start. If baseline > 30K tokens before typing, load fewer context files.
- `/clear` when switching between unrelated domains (e.g. Boffmedia → SmartRotom).
- `/compact` after each discrete subtask. Before compacting, state what to preserve (see below).
- `/btw` for quick one-off questions that should not enter conversation history.

## On /compact

Always preserve: modified files, migration status, `pnpm type-check` result,
pending `pnpm generate:shared` runs, active design system (Boffmedia or SmartRotom).

## Load context on demand

| Working on… | Load |
|---|---|
| Tech stack / deps | `.claude/context/stack.md` |
| Folder structure | `.claude/context/architecture.md` |
| Conventions / commands | `.claude/context/conventions.md` |
| API standards (NestJS) | `.claude/context/api-standards.md` |
| Web network policy | `.claude/context/web-network.md` |
| i18n rules | `.claude/context/i18n.md` |
| Repository hygiene | `.claude/context/hygiene.md` |
| MCEF / Minecraft | `.claude/context/mcef.md` |
| SmartRotom UI | `.claude/context/smartrotom.md` |
| Full reference | `AGENTS.md` |
