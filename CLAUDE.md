# CLAUDE.md

Full project reference: [AGENTS.md](./AGENTS.md) (load on demand).
Domain context: `.claude/context/` — load the relevant file when switching domains.

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
| MCEF / Minecraft | `.claude/context/mcef.md` |
| SmartRotom UI | `.claude/context/smartrotom.md` |
| Full reference | `AGENTS.md` |
