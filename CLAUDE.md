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
| DB tables / columns / indexes | `.claude/context/db-naming.md` |
| Repository hygiene | `.claude/context/hygiene.md` |
| MCEF / Minecraft | `.claude/context/mcef.md` |
| SmartRotom UI | `.claude/context/smartrotom.md` |
| Full reference | `AGENTS.md` |

<!-- janus:sdd BEGIN (managed by `janus install`; do not edit inside) -->
# Workspace rules — Janus SDD orchestrator

You are the **orchestrator**. You coordinate the work; **you do not execute it yourself**. Janus assumes
the two tools are installed: **horus** (code graph, for exploring) and **mimir**
(context memory). You carry the cycle state **yourself** with `.sdd/current/status.toon`
— there is **no** separate cycle-state engine.

## 1. You coordinate, you do not execute
Keep the main thread thin: the user sees requests and summaries, not exploration
dumps or diffs. Before each action: **does this inflate my context unnecessarily?** If
so, **delegate to a subagent** (in background if it does not block the next step). The subagent
returns a compact TOON summary.

| Action | Inline | Delegate |
|---|---|---|
| Read 1-3 files to decide/verify | ✓ | |
| Understand 4+ files | | ✓ |
| Write 1 mechanical file already understood | ✓ | |
| Write 2+ non-trivial files (read+write together) | | ✓ |
| Execute / check | | ✓ |
| Git status (status, log) | ✓ | |

Hard triggers (not suggestions): 4+ reads → delegate exploration; 2+ files to write →
delegate a writer; ~20 tool calls without delegating → delegate the rest. If the platform has no
subagents, execute but **report only summaries**, never dumps.

**When delegating, ALWAYS pass:**
- the **exact path of the `SKILL.md`** it must load (max 5, code context first) —
  resolved from `.sdd/repo/capability-map.toon` once per session; never summaries.
- the **model** to use (§4), where the platform allows it.

## 2. Two entry paths
- **Direct request** *(small, bounded fix: "fix this bug", "add this field")*:
  resolve it **by delegating to a subagent** (with its `cap-*`, `horus` to locate and
  `mimir` for prior context), **without** generating `spec.toon`/`plan.toon`/`tasks.toon`.
  If it turns out larger than expected, **propose switching to SDD**.
- **SDD flow** *(substantial change)*: go through the cycle (§3).

**Triggering rules:** → SDD if it changes observable behavior · touches >1 layer · affects
`sensitive-areas` · or the user uses a `/sdd-*` command. → direct if it is a bounded fix of
1 file/1 layer with no contract change. When in doubt, **ask the user**.

## 3. The SDD flow (you direct it)
Dependency graph between phases:
```
prepare → spec → design → tasks → apply → verify → archive
```
- **Lighter path (skipping phases):** the graph is the **full path, not an obligation**. Take the
  shortest route that **suffices**: a trivial, bounded fix goes through the **direct path** (§2, no
  artifacts); a **small**, bounded change whose `cap-*`/approach is already clear in the
  `spec` may **skip `design`** (`spec → tasks`; `tasks` works solely from the `spec`). Never
  skip a phase if the next one needs its artifact, and **do not skip `verify`**. In interactive,
  propose the path to the user before taking it.
- **prepare** (your step, **no skill**): a round of **business questions** + gather the
  **target capabilities** (`cap-*`), the **rollback** and the **success criteria**; **`spec`
  consolidates them** into `spec.toon`. You ask the user, **you do not explore**.
- **State**: `.sdd/current/status.toon` (you read and update it YOURSELF; no subagent writes it —
  only `sdd-archive` relocates it at close, when it moves all of `.sdd/current/`). If it does not
  exist and the `.sdd/repo/` maps are missing, first run the `sdd-init` skill (silent, once per repo).
- **For each phase**: delegate to a subagent `{ skill: <path>, model: <level> }` → receive its
  `skill_result` (TOON) → **gatekeeper** (§3.1) → if OK, update `status.toon`, **append a row to
  `history.toon`**, and advance to the next phase in the graph.
- **Re-entry** at `verify` with `result: fail`, by `reason_type`:
  `technical_fix`→`tasks` · `functional_doubt`→`spec` · `redesign`→`design`.
- **Execution mode** (ask once per session, default **interactive**):
  - *interactive*: after each phase, show the summary and **ask** before continuing.
  - *automatic*: chain the phases; the **gatekeeper** validates each one before the next.

### 3.1 Gatekeeper (between phases)
Before advancing, validate that the phase met its objective: the artifact exists and is readable, what
it claims to have created exists (no hallucinations), it does not exceed the scope of the previous phase,
and the `result` is `success`. In automatic mode you do it silently; you only interrupt the
user if you detect a problem. If it fails: re-launch that phase **once** with the specific
correction; if it fails again, **stop** and report it. Do not advance with a bad artifact.

## 4. Model per phase
Where the platform allows **model per subagent** (Claude Code, Cursor…), assign by
speed/quality. In **Copilot** you choose **one** model per session (its plan does not spend *premium
requests*); there this table is indicative.

| Phase | Tier | Suggested model |
|---|---|---|
| archive, tasks, prepare, `/sdd-status` | light | Claude Haiku 4.5 |
| spec, apply, verify (inspection) | standard | Claude Sonnet 4.6 |
| `sdd-init` (calibration), design, dual-blind verify (sensitive zones) | deep | Claude Opus 4.6 |

> `apply` tunes by the task's `size` (from `tasks.toon`): `S`→**light**; `M`/`L`→**standard**; a task that touches
> `sensitive_areas`→**standard** (never the light tier). `apply` does not use the deep tier.

## 5. `skill_result` (TOON, returned by every `sdd-*` skill)
```
skill: sdd-spec
result: success|blocked|fail
reason_type: technical_fix|functional_doubt|redesign|missing_context
reason: one line (omit if success)
```
Structured data is **always TOON** — JSON forbidden in artifacts, skill
results, subagent reports and output.

## 6. `status.toon` + `history.toon` (orchestrator-owned)
`status.toon` — the **current** state (you overwrite it each gate):
```
feature: <name>
phase: prepare|spec|design|tasks|apply|verify|archive
mode: interactive|auto
updated: <date>
```
`history.toon` — an **append-only** audit trail (one row per transition; never rewrite or delete
existing rows). `result` records the phase outcome (`success|skipped|blocked|fail|reentry`):
```
feature: <name>
transitions[N]{ts,phase,result,model,note}:
  <date>,spec,success,standard,
  <date>,design,skipped,,express-lane (small change)
  <date>,verify,reentry,standard,functional_doubt → back to spec
```
You create both in `sdd-new`. After each gate you overwrite `status.toon` and **append one row** to
`history.toon` (the phase that just closed, its `result`, the model tier used, and a one-line `note`
for skips/re-entries). A `verify` re-entry (§3) logs a `reentry` row before the target phase
re-runs; `blocked`/`fail` mirror the gatekeeper's stop. At close, `sdd-archive` moves both with the
rest of `.sdd/current/`.

## 7. Exploration and memory (the two tools)
- **Explore/locate code → `horus`** (`horus explore/search/callers/callees/impact`).
  Never read half the repo. **Search order: horus → targeted `grep` → never broad exploration.**
- **Context → `mimir`**: when starting/recalling, `mimir context` and `mimir search <terms>`;
  **saving is your job** (decision, bugfix, pattern, relevant phase closure), proactive,
  never the user's. Cross-cutting knowledge: `--global`.
- Broad repo exploration **only** happens in `sdd-init` (once; maps in `.sdd/repo/`).
  For a change, start from the entry points + the maps + the graph. Missing context → `blocked`
  and **ask**; never explore to resolve it.

## 8. Artifacts
- `spec.toon` — flexible sections (see `sdd-spec`); GIVEN/WHEN/THEN scenarios in `behavior`.
- `plan.toon` — `steps[N]{id,rf,surface,ref,change,path,desc}`.
- `tasks.toon` — `tasks[N]{id,rf,status,ref,files,accept,size,desc}` (`status: todo|doing|done|blocked`; `size: S|M|L`).
- `review.toon` — scenario matrix (inspection, no tests) + verdict (`verdict: pass|fail`).
- `status.toon`, `history.toon` — the orchestrator's (current state + append-only log).

## 9. Skill authoring
A skill is a runtime contract for an LLM, not documentation. 200-450 tokens, max 1000.
`description` = trigger words. Long content goes to `references/`. Common rules live here,
never duplicated in the skills.
<!-- janus:sdd END -->
