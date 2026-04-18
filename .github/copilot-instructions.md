# GitHub Copilot Instructions

Full project reference: [AGENTS.md](../AGENTS.md). This file adds Copilot-specific scoping.

## Critical rules (read before suggesting code)

1. **Never duplicate shared types.** All server-generated types live in `@boffmedia/shared`. Import from there; never redefine them on the client.
2. **All API calls go through `apps/web/src/services/api/`**. Never inline `fetch` in components.
3. **MCEF**: Use only the existing functions in `apps/web/src/services/mcef/mcefApi.ts`. Do not invent new `window.mcefQuery` call shapes.
4. **Two products, two design systems**: Boffmedia uses `components/ui/primitives/`; SmartRotom uses `components/smartrotom/ui/`. Do not mix them.
5. **New components default to `app/**/_components/`**. Promote to `features/` or `components/` only when shared across routes.
6. **NestJS DTOs must include `@ApiProperty` decorators** so the OpenAPI spec stays accurate for `generate:shared`.
7. **`next.config.mjs` suppresses TS build errors** — suggest running `pnpm type-check` to surface them.

## Stack at a glance

- **Client**: Next.js 16 + React 19, Tailwind 3, Zustand, Zod, `next-intl`
- **Server**: NestJS 11, MySQL, TypeORM + Drizzle ORM, Socket.io, Swagger
- **Shared**: `packages/shared/` — auto-generated OpenAPI models (do not edit)
- **Minecraft**: MCEF bridge in `apps/web/src/services/mcef/`
