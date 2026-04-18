# CLAUDE.md

See [AGENTS.md](./AGENTS.md) for the full project reference (stack, commands, conventions, architecture).

## Claude-specific notes

- **Shared types**: Run `pnpm generate:shared` after adding server DTOs — never edit `packages/shared/src/` by hand.
- **Component placement**: Default new components to `app/**/_components/`. Promote only with justification.
- **MCEF**: Do not invent new `window.mcefQuery` call shapes — extend `mcefApi.ts` using the existing `mcefQuery<T>()` helper.
- **Type-check**: `next.config.mjs` ignores TS build errors. Always verify with `pnpm type-check` before reporting a task done.
- **Two design systems**: SmartRotom (`components/smartrotom/ui/`) and Boffmedia (`components/ui/primitives/`) are incompatible — do not cross-apply.
- When exploring unfamiliar modules, prefer the Explore subagent to avoid burning context on large directory trees.
