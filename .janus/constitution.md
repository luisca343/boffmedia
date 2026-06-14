# boffmedia — Constitution

Non-negotiable principles for every change in this project. This file is injected
into the context of every janus task. Keep it short, specific, and current.

## Principles

1. **Spec before code.** Code-modifying work flows through the janus lifecycle
   (spec → plan → tasks → execute). See `AGENTS.md` for the workflow contract.
2. **Tests gate completion.** A task is not done until `verify_run` passes.
3. **Small, reviewable changes.** Prefer several focused tasks over one sprawling diff.

## Conventions

<!-- Project-specific rules: naming, architecture boundaries, error handling,
     commit style. Replace the examples below. -->

- _Example: All public APIs are typed; no `any` in exported signatures._
- _Example: Database changes always ship with a migration._

## Forbidden

<!-- Things no agent or human should ever do in this repo. -->

- Do not edit files matched by `.agentignore` (enforced by `guard_check`).
- Do not create merge/pull requests without an explicit user request.
