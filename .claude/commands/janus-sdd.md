---
description: Run the full Spec-Driven Development workflow for a task
---

You are executing the janus SDD workflow. The user wants to:
$ARGUMENTS

Follow [`AGENTS.md`](../../AGENTS.md). In short:

1. Decide the entry point: `janus spec new "<title>" --type quick` for small changes,
   or `--type feature|bugfix|refactor|ui-ux` for larger ones. Read-only/trivial → no spec.
2. Full specs are draft until a human runs `janus spec approve <id>` — never approve yourself.
   Quick specs are auto-approved with an inline T001.
3. For each task: `janus task start <id> <task>` → `janus guard check <paths>` → implement →
   `janus verify` → `janus structural` (write an ADR if needed) → `janus task done <id> <task>`.
4. Ship with `janus git branch|commit|push`. NEVER create an MR/PR unless the user asked.

Use `janus next` whenever you are unsure what to do next.
