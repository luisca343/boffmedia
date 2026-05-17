# Boffmedia Monorepo — Cleanup Audit

> Generated 2026-05-17. All items are pre-existing technical debt, not introduced by the agent branch.
> Last updated: 2026-05-17 — Sections 1, 2, 3, 6 completed.

---

## Status legend

- `[ ]` Pending
- `[x]` Done
- `[~]` In progress
- `[?]` Needs investigation before touching

---

## 1. Quick wins — delete these files

These files are dead, have no importers, and need no investigation.

### 1a. Page copy files (3 files)

| File | Action |
|---|---|
| `apps/web/src/app/battlesim/page copy.tsx` | Delete |
| `apps/web/src/app/smartrotom/chatapp/page copy.tsx` | Delete |
| `apps/web/src/app/(boffmedia)/(herramientas)/mhwilds/tree/page copy.tsx` | Delete |

- [x] Delete all 3 `page copy.tsx` files

### 1b. Dev/test/debug routes (11 pages)

All confirmed as dev scaffolding — delete the entire folders.

- [x] `apps/web/src/app/test/` — root test page
- [x] `apps/web/src/app/localtest/` — 4 pages (personal-meta-comparison, tracker-sync-badge, tracker-sync-provider)
- [x] `apps/web/src/app/smartrotom/(debug)/` — 2 pages (components, error-preview)
- [x] `apps/web/src/app/smartrotom/arcade/test/` — 3 pages (root, sprite, tama)
- [x] `apps/web/src/app/(boffmedia)/(herramientas)/pokemon/vgc/meta/test/` — 1 page

---

## 2. API — `no-unused-vars` (216 warnings → 0 errors)

**Decision**: Rule is now set to `error` with `_` prefix ignore patterns applied. All errors resolved.

### Rule change (applied)

In `apps/api/.eslintrc.js`:
```js
'@typescript-eslint/no-unused-vars': ['error', {
  argsIgnorePattern: '^_',
  varsIgnorePattern: '^_',
  caughtErrorsIgnorePattern: '^_',
}]
```

### File-by-file checklist

#### Schema files
- [x] `_db/schema/FicusAI.ts`
- [x] `_db/schema/SmartRotomDocuments.ts`
- [x] `_db/schema/SmartRotomStarBank.ts`

#### Utils / Infrastructure
- [x] `_utils/MySQL2Service.ts`
- [x] `_utils/WingullSQL2Service.ts`
- [x] `_utils/interceptors/response.interceptor.ts`
- [x] `_utils/response/response.service.ts`
- [x] `_utils/sockets/sockets.gateway.ts`
- [x] `app.controller.ts`
- [x] `app.module.ts`
- [x] `minecraft.middleware.ts`

#### Auth / Users
- [x] `api/auth/auth.module.ts`
- [x] `api/boffmedia/users/repositories/users.repository.ts`
- [x] `api/boffmedia/users/users.controller.ts`
- [x] `api/boffmedia/users/services/users-management.service.ts`
- [x] `api/boffmedia/users/dto/get-user-by-id.dto.ts`

#### BoffMedia — Events
- [x] `api/boffmedia/events/services/participants.service.ts`
- [x] `api/boffmedia/events/services/progress.service.ts`
- [x] `api/boffmedia/events/services/teams.service.ts`
- [x] `api/boffmedia/events/dto/join-event.dto.ts`
- [x] `api/_repositories/boffmedia/participants.repository.ts`
- [x] `api/_repositories/boffmedia/invites.repository.ts`

#### BoffMedia — Herramientas
- [x] `api/boffmedia/herramientas/pokemon/tcgpocket/services/tcg.service.ts`
- [x] `api/boffmedia/herramientas/pokemon/tcgpocket/tcg.controller.ts`
- [x] `api/boffmedia/herramientas/pokemon/tcgpocket/tcg.module.ts`
- [x] `api/boffmedia/herramientas/pokemon/vgc/meta/services/vgcpastes.service.ts`
- [x] `api/boffmedia/herramientas/pokemon/vgc/mod/scripts.ts`
- [x] `api/boffmedia/herramientas/pokemon/vgc/mod/items.ts`
- [x] `api/boffmedia/herramientas/mhwilds/mhwilds.facade.service.ts`
- [x] `api/boffmedia/herramientas/mhwilds/repositories/mhwilds.repository.ts`
- [x] `api/boffmedia/herramientas/mhwilds/services/mhwilds-cache.service.ts`
- [x] `api/boffmedia/herramientas/mhwilds/services/mhwilds-data.service.ts`
- [x] `api/boffmedia/herramientas/manga/services/manga-download.service.ts`
- [x] `api/boffmedia/herramientas/manga/services/novecool.service.ts`
- [x] `api/boffmedia/herramientas/scrape/services/myrient.service.ts`
- [x] `api/boffmedia/herramientas/scrape/services/manga/manga-cron.service.ts`
- [x] `api/boffmedia/herramientas/scrape/services/manga/scrapers/leercapitulo/leercapitulo.scraper.ts`
- [x] `api/boffmedia/herramientas/scrape/services/manga/scrapers/pkproject/pkproject.scraper.ts`
- [x] `api/boffmedia/herramientas/scrape/dto/download-selected-games.dto.ts`

#### BoffMedia — Util
- [x] `api/boffmedia/util/sharex/sharex.controller.ts`
- [x] `api/boffmedia/util/sharex/sharex.service.ts`
- [x] `api/boffmedia/util/upload/upload.controller.ts`
- [x] `api/boffmedia/util/upload/services/file-upload.service.ts`

#### SmartRotom — Pokemon
- [x] `api/smartrotom/pokemon/pokemon.controller.ts`
- [x] `api/smartrotom/pokemon/pokemon.facade.service.ts`
- [x] `api/smartrotom/pokemon/services/data/pokemon-data.service.ts`
- [x] `api/smartrotom/pokemon/services/data/spawn-data.service.ts`
- [x] `api/smartrotom/pokemon/services/pokemon-showdown.service.ts`
- [x] `api/smartrotom/pokemon/services/data/move-data.service.ts`
- [x] `api/smartrotom/pokemon/services/pokemon-data-management.service.ts`
- [x] `api/smartrotom/pokemon/services/data/pokemon-image.service.ts`
- [x] `api/smartrotom/pokemon/services/sprite-manifest.service.ts`
- [x] `api/smartrotom/pokemon/repositories/interfaces/pokemon.repository.interface.ts`
- [x] `api/smartrotom/pokemon/interfaces/pokemon.interface.ts`
- [x] `api/smartrotom/pokemon/utils/types.ts`
- [x] `api/smartrotom/pokemon/utils/MoveData.ts`
- [x] `api/smartrotom/pokemon/utils/SpawnData.ts`
- [x] `api/smartrotom/pokemon/utils/PokemonData.ts`
- [x] `types/pokemon.ts`

#### SmartRotom — Other modules
- [x] `api/smartrotom/liga/liga.facade.service.ts`
- [x] `api/smartrotom/liga/repositories/liga.repository.ts`
- [x] `api/smartrotom/liga/services/tournament.service.ts`
- [x] `api/smartrotom/mine/repositories/mine.repository.ts`
- [x] `api/smartrotom/mine/services/energy.service.ts`
- [x] `api/smartrotom/mine/types.ts` — deleted (file was entirely dead code, no importers)
- [x] `api/smartrotom/misiones/repositories/quest.repository.ts`
- [x] `api/smartrotom/misiones/repositories/interfaces/quest.repository.interface.ts`
- [x] `api/smartrotom/misiones/misiones.controller.ts`
- [x] `api/smartrotom/misiones/misiones.facade.service.ts`
- [x] `api/smartrotom/misiones/services/quest.cache.service.ts`
- [x] `api/smartrotom/misiones/types.ts`
- [x] `api/smartrotom/achievement/achievement.controller.ts`
- [x] `api/smartrotom/achievement/services/achievements.service.ts`
- [x] `api/smartrotom/achievement/repositories/achievements.repository.ts`
- [x] `api/smartrotom/apps/apps.facade.service.ts`
- [x] `api/smartrotom/apps/repositories/user-apps.repository.ts`
- [x] `api/smartrotom/apps/apps.controller.spec.ts`
- [x] `api/smartrotom/arcade/arcade.controller.ts`
- [x] `api/smartrotom/arcade/arcade.facade.service.ts`
- [x] `api/smartrotom/arcade/arcade.module.ts`
- [x] `api/smartrotom/arcade/dto/lottbox.dto.ts`
- [x] `api/smartrotom/arcade/entities/arcade-inventory.entity.ts`
- [x] `api/smartrotom/arcade/services/inventory.service.ts`
- [x] `api/smartrotom/arcade/services/lootbox.service.ts`
- [x] `api/smartrotom/arcade/services/streak.service.ts`
- [x] `api/smartrotom/chatapp/chatapp.controller.ts`
- [x] `api/smartrotom/chatapp/chatapp.facade.service.ts`
- [x] `api/smartrotom/chatapp/dto/call.dto.ts`
- [x] `api/smartrotom/chatapp/dto/chat.dto.ts`
- [x] `api/smartrotom/chatapp/services/call.service.ts`
- [x] `api/smartrotom/documents/entities/document.entity.ts`
- [x] `api/smartrotom/documents/dto/news.dto.ts`
- [x] `api/smartrotom/ficusai/ficusai.facade.service.ts`
- [x] `api/smartrotom/ficusai/repositories/ficusai.repository.ts`
- [x] `api/smartrotom/starbank/starbank.controller.ts`
- [x] `api/smartrotom/users/users.controller.ts`
- [x] `api/smartrotom/_dto/taxi-stop.dto.ts`
- [x] `api/smartrotom/_main/smartrotom.service.ts`
- [x] `api/smartrotom/wingull/dto/battle-team.dto.ts`
- [x] `api/smartrotom/wingull/services/wingull-transport.service.ts`
- [x] `api/smartrotom/wingull/wingull.module.ts`
- [x] `api/wingull/invites/invites.controller.ts`

#### Automation / Discord
- [x] `automation/twitch/services/twitch-monitor.service.ts`
- [x] `automation/twitch/services/notification.service.ts`
- [x] `automation/twitch/twitch-debug.controller.ts`
- [x] `discord/_main/discord.controller.ts`
- [x] `discord/_main/message.listener.ts`
- [x] `discord/_commands/commands.service.ts`
- [x] `discord/commands/global/meta/meta-matchup.command.ts`

#### BattleSimulator (found during audit)
- [x] `api/battlesimulator/battle/battle.controller.ts`

#### Deprecated module
- [x] `api/deprecated/` — entire folder deleted (no external importers confirmed)

Also removed during audit:
- [x] `api/boffmedia/herramientas/pokemon/vgc/meta/config/smogon.config.ts` — deleted `smogonChaosUrl` (unused, deprecated)

---

## 3. Needs investigation before touching

### 3a. Migration status — `users.module.ts`

- [x] **Investigated**: Migration incomplete. `BoffMediaUsersManagementService` still injects `BoffMediaUsersRepository` directly (not via token). TODOs at L36, L44 are intentional blockers — leave them until the service is migrated.

### 3b. `@deprecated` entities — are they still used?

| Symbol | File | Status |
|---|---|---|
| `ArceuSpeakEntity` | `smartrotom.controller.ts` | **Active** — used in Swagger `@ApiResponse` |
| `PokemonW` | multiple wingull files | **Active** — return type for team endpoints |
| `FicusAiHealthEntity` | `ficusai.controller.ts` | **Active** — used in Swagger `@ApiResponse` |
| `smogonChaosUrl` | `smogon.config.ts` | **Deleted** — was truly unused |
| `smogonUsageUrl`, `smogonMovesetUrl` | `smogon.config.ts` | **Active** — used in `smogon.service.ts` |

### 3c. Active TODOs

| File | Line | Comment | Decision |
|---|---|---|---|
| `api/boffmedia/users/users.module.ts` | L36, L44 | REMOVE THIS AFTER MIGRATION | Leave — migration incomplete |
| `api/smartrotom/chatapp/services/group.service.ts` | L190 | TODO: Implement unread count logic | Leave — feature work |
| `apps/web/src/app/smartrotom/arcade/loot/_hooks/useLootBoxInventory.ts` | L124 | FIX THIS (weight: 0) | Leave — needs domain context |
| `api/smartrotom/pokemon/pokemon.controller.ts` | L648 | API FIX | Leave — needs investigation |
| `apps/web/src/app/smartrotom/liga/camaralucha/page.tsx` | L12 | TODO: implement useBattleReplays | Leave — feature work |

---

## 4. Console.log → structured logger

**Scale**: ~1,044 statements (API ~900, Web ~140)
**Status**: `[ ]` Pending — planned for a future sprint.

### Plan

1. **API** — NestJS has `Logger` built-in. Pattern:
   ```ts
   import { Logger } from '@nestjs/common'
   private readonly logger = new Logger(MyService.name)
   // then: this.logger.log('message') / this.logger.error('msg', error)
   ```
   - Replace `console.log` → `this.logger.log`
   - Replace `console.error` → `this.logger.error`
   - Replace `console.warn` → `this.logger.warn`

2. **Web** — Create a thin logger wrapper `src/lib/logger.ts` that wraps `console` in dev and silences in prod.

### Top priority files (most console calls)

- [ ] `api/smartrotom/pokemon/pokemon.facade.service.ts` — 32 calls
- [ ] `api/boffmedia/users/users.facade.service.ts` — 32 calls
- [ ] `api/smartrotom/chatapp/chatapp.facade.service.ts` — 26 calls
- [ ] `api/boffmedia/users/services/users-management.service.ts` — 22 calls
- [ ] `api/smartrotom/wingull/wingull.facade.service.ts` — 21 calls
- [ ] `api/boffmedia/herramientas/pokemon/tcgpocket/repositories/tcg.repository.ts` — 21 calls
- [ ] `api/_utils/sockets/sockets.gateway.ts` — 20 calls
- [ ] `api/smartrotom/documents/documents.facade.service.ts` — 20 calls
- [ ] `api/boffmedia/herramientas/scrape/services/manga/scrapers/novelcool/novelcool.scraper.ts` — 20 calls
- [ ] Web: `apps/web/src/app/smartrotom/pc/page.tsx` — 17 calls
- [ ] Web: `apps/web/src/app/smartrotom/mina/utils.ts` — 14 calls
- [ ] Web: `apps/web/src/app/smartrotom/chatapp/_components/Chat.tsx` — 13 calls

> After migration: add `no-console` as `error` in both ESLint configs to prevent regressions.

---

## 5. Large files in the repo

These are not actively blocking anything but create repository bloat.

| File | Size | Status |
|---|---|---|
| `apps/web/src/components/shared/ckeditor/ckeditor.js` | 1.9 MB | Leave for now — touching it risks breaking the editor |
| `apps/web/src/app/battlesim/_utils/battle-animations-moves.ts` | 793 KB / 39K lines | Data file — consider splitting or lazy-loading |
| `apps/api/scripts/source/pokedex.ts` | 535 KB / 21K lines | Source data dump — candidate for `.gitignore` |
| `apps/api/src/api/boffmedia/herramientas/pokemon/vgc/mod/pokedex.ts` | 534 KB / 20K lines | Generated Pokémon data — candidate for external JSON |

- [ ] Investigate moving large data files (pokedex.ts) to JSON and loading at runtime
- [ ] Investigate splitting `battle-animations-moves.ts` into smaller chunks with dynamic import

---

## 6. Deprecated folder

- [x] **No external importers confirmed** — entire `apps/api/src/api/deprecated/` folder deleted.

---

## Summary

| Category | Items | Status |
|---|---|---|
| Delete page copies | 3 files | ✅ Done |
| Delete test routes | 11 pages | ✅ Done |
| Delete deprecated/ folder | 1 folder | ✅ Done |
| API unused-vars (now error + _-prefix config) | ~100 files | ✅ Done — `pnpm lint` exits 0 |
| `tsc --noEmit` (API + Web) | both apps | ✅ Clean |
| Migration status investigation | 1 | ✅ Investigated — incomplete, TODOs kept |
| @deprecated investigation | 5 symbols | ✅ Investigated — 1 deleted, 4 active |
| Active TODOs | 5 | ✅ Reviewed — all kept (feature/domain work) |
| Console.log → Logger migration | ~1,044 calls | ⏳ Pending — future sprint |
| Large data files | 4 files | ⏳ Pending — low priority |
