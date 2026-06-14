---
description: Database layer — Drizzle schemas, TypeORM entities, migrations
applyTo:
  - "apps/api/src/_db/schema/**/*.ts"
  - "apps/api/drizzle/**/*.ts"
  - "apps/api/drizzle.config.ts"
  - "apps/api/src/api/**/*.entity.ts"
---

## Dual ORM

This project uses both **TypeORM** and **Drizzle ORM**. Do NOT mix them within a single module.

### TypeORM (older modules)
- Entities use `@Entity()`, `@Column()`, `@ManyToOne()`, etc.
- Located alongside their modules in `apps/api/src/api/{domain}/`.

### Drizzle (newer modules, preferred for new work)
- Schemas in `apps/api/src/_db/schema/`.
- Type-safe, zero runtime overhead.
- MySQL dialect.

## Schema Files

| File | Domain |
|------|--------|
| `BoffMedia.ts` | Boffmedia core tables |
| `Events.ts` | Events system |
| `Ficus.ts` | Ficus core |
| `FicusAI.ts` | AI chat tables |
| `SmartRotom.ts` | SmartRotom core tables |
| `SmartRotomChat.ts` | Chat app tables |
| `SmartRotomDocuments.ts` | Documents tables |
| `SmartRotomMine.ts` | Mine system tables |
| `SmartRotomPokedex.ts` | Pokédex tables |
| `SmartRotomStarBank.ts` | Star bank tables |
| `TCG.ts` | Trading card game tables |
| `Vgc.ts` | VGC tables |
| `VgcTracker.ts` | VGC tracker tables |
| `Wingull.ts` | Wingull tables |
| `Sharex.ts` | Sharex tables |

## Migration Workflow

1. Define/update schema in `apps/api/src/_db/schema/`.
2. Generate migration: `pnpm --filter api generate`.
3. Apply migration: `pnpm --filter api migrate`.
4. Push schema (dev only): `pnpm --filter api push`.

## Drizzle Config

- Config file: `apps/api/drizzle.config.ts`.
- Schema path: `./src/_db/schema/*.ts`.
- Output: `./drizzle/migrations`.
- Dialect: `mysql`.
- DB URL from `env.DATABASE_URL`.

## Rules

- New modules should prefer Drizzle over TypeORM.
- Always generate migrations — do not rely on `push` in production.
- Schema changes require a migration file committed to the repo.
