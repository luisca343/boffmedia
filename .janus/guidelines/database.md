---
description: Database and ORM rules — Drizzle schemas, migrations, repository pattern
applyTo:
  - "apps/api/src/_db/**/*"
  - "apps/api/drizzle/**/*"
  - "apps/api/src/_utils/DrizzleService.ts"
  - "apps/api/src/_utils/MySQL2Service.ts"
  - "apps/api/src/api/_repositories/**/*.ts"
---

## Dual ORM — Drizzle (preferred) + TypeORM (legacy)

- **Drizzle ORM** is the preferred ORM for all new modules.
- **TypeORM** exists in legacy entity-based modules under `_repositories/`. Do not add new TypeORM entities.
- Never mix both ORMs within a single NestJS module.

## Drizzle schema location

- Schema files: `apps/api/src/_db/schema/*.ts` (15 files, ~50 tables).
- Migrations: `apps/api/drizzle/migrations/`.
- Config: `apps/api/drizzle.config.ts` (MySQL dialect, reads `DATABASE_URL`).

## Schema domains

| File | Domain |
|---|---|
| `BoffMedia.ts` | Users, roles |
| `SmartRotom.ts` | SmartRotom core (users, apps, achievements, replays, inventory, notifications) |
| `SmartRotomChat.ts` | In-game chat |
| `SmartRotomDocuments.ts` | News/documents |
| `SmartRotomPokedex.ts` | Pokedex tracking |
| `SmartRotomStarBank.ts` | Virtual banking |
| `SmartRotomMine.ts` | Mining mini-game |
| `Ficus.ts` | Discord quotes/TTS |
| `FicusAI.ts` | AI chat history |
| `Events.ts` | Events system (games, events, participants, teams, achievements) |
| `Wingull.ts` | Invite codes |
| `Sharex.ts` | Image uploads |
| `TCG.ts` | Pokemon TCG Pocket |
| `Vgc.ts` | VGC meta data (Smogon, Limitless, VGCPastes) |
| `VgcTracker.ts` | VGC match tracking |

## Creating a migration

```bash
pnpm --filter api generate    # Generate migration from schema changes
pnpm --filter api migrate     # Apply migration
pnpm --filter api push        # Push schema directly (dev only)
```

## Repository pattern

- Base interface: `BaseRepository<T, CreateDto, UpdateDto>` with `findAll`, `findById`, `create`, `update`, `delete`, `exists`.
- Base implementation: `BaseRepositoryImpl` using Drizzle.
- DI tokens: Symbol-based, defined in `repository.token.ts` and `chatapp.repository.token.ts`.
- Concrete repositories implement the base and register with their token.

## Drizzle injection

- `DrizzleModule` creates a MySQL2 pool and exports `MySql2Database` as `DRIZZLE` token.
- Inject: `@Inject(DRIZZLE) private readonly db: MySql2Database`.
- `MySQL2Service` is a standalone injectable wrapper used by the Discord module and older code.

## Schema changes require ADR

- Changes to `_db/schema/*.ts` trigger a structural rule (`adrRecommended: true`).
- Consider data migration, backward compatibility, and downstream impact.
