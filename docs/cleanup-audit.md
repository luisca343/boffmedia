# Boffmedia Monorepo — Cleanup Audit

> Generated 2026-05-17. All items are pre-existing technical debt, not introduced by the agent branch.

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

- [ ] Delete all 3 `page copy.tsx` files

### 1b. Dev/test/debug routes (11 pages)

All confirmed as dev scaffolding — delete the entire folders.

- [ ] `apps/web/src/app/test/` — root test page
- [ ] `apps/web/src/app/localtest/` — 4 pages (personal-meta-comparison, tracker-sync-badge, tracker-sync-provider)
- [ ] `apps/web/src/app/smartrotom/(debug)/` — 2 pages (components, error-preview)
- [ ] `apps/web/src/app/smartrotom/arcade/test/` — 3 pages (root, sprite, tama)
- [ ] `apps/web/src/app/(boffmedia)/(herramientas)/pokemon/vgc/meta/test/` — 1 page

After deletion: verify no remaining imports point to any of these pages.

---

## 2. API — `no-unused-vars` (216 warnings → 0 errors)

**Decision**: Rule is now set to `error`. Each file below must be fixed before it can be modified in future PRs.

### Rule change (already applied)

In `apps/api/.eslintrc.js`:
```js
'@typescript-eslint/no-unused-vars': 'error'   // was: 'warn'
```

### File-by-file checklist

Fix strategy per type:
- **Unused import** → delete the import line
- **Unused function parameter required by interface/NestJS** → prefix with `_` (e.g. `_error`)
- **Unused local variable** → delete or refactor

#### Schema files (simple — just delete unused Drizzle helper imports)

- [ ] `_db/schema/FicusAI.ts` — remove `mysqlSchema`, `text`, `varchar`, `smartrotomUsers` (L7–L12)
- [ ] `_db/schema/SmartRotomDocuments.ts` — remove `date` (L2)
- [ ] `_db/schema/SmartRotomStarBank.ts` — remove `exp` (L1)

#### Utils / Infrastructure

- [ ] `_utils/MySQL2Service.ts` — `fields` L87 → `_fields`
- [ ] `_utils/WingullSQL2Service.ts` — `fields` L87 → `_fields`
- [ ] `_utils/interceptors/response.interceptor.ts` — `response` L21 → `_response`; `e` L104 → `_e`
- [ ] `_utils/response/response.service.ts` — remove `action` (L7, L11), `data` (L7, L11, L24)
- [ ] `_utils/sockets/sockets.gateway.ts` — `existingUser` L44, `sockets` L101/L130 → `_sockets`
- [ ] `app.controller.ts` — `err` L55 → `_err`; `body` L121 → `_body`
- [ ] `app.module.ts` — remove `DiscordService` import (L36)
- [ ] `minecraft.middleware.ts` — remove `multer` import (L4)

#### Auth / Users

- [ ] `api/auth/auth.module.ts` — remove `BoffMediaUsersManagementService` import (L10)
- [ ] `api/boffmedia/users/repositories/users.repository.ts` — remove `SmartRotomUser` (L11)
- [ ] `api/boffmedia/users/users.controller.ts` — remove `UserWithRolesEntity` (L33)
- [ ] `api/boffmedia/users/services/users-management.service.ts` — remove `bcrypt` (L6), `BoffMediaUser` (L8)
- [ ] `api/boffmedia/users/dto/get-user-by-id.dto.ts` — remove `IsOptional` (L7)

#### BoffMedia — Events

- [ ] `api/boffmedia/events/services/participants.service.ts` — remove `Achievement` (L6); `participantId` L135 → `_participantId`
- [ ] `api/boffmedia/events/services/progress.service.ts` — remove `boffMediaAchievements` (L7)
- [ ] `api/boffmedia/events/services/teams.service.ts` — remove `TeamMember` (L6)
- [ ] `api/boffmedia/events/dto/join-event.dto.ts` — remove `IsUrl` (L2)
- [ ] `api/_repositories/boffmedia/participants.repository.ts` — remove `ParticipantProgress` (L12), `Achievement` (L13), `PARTICIPANT_STATUS` (L14)
- [ ] `api/_repositories/boffmedia/invites.repository.ts` — `limit` L82, `offset` L83 → prefix with `_`

#### BoffMedia — Herramientas

- [ ] `api/boffmedia/herramientas/pokemon/tcgpocket/services/tcg.service.ts` — remove `UserCard`, `UserCardHistory` (L17), `fs` (L20); `existingCardsMap` L210 → investigate if needed; `error` L451 → `_error`
- [ ] `api/boffmedia/herramientas/pokemon/tcgpocket/tcg.controller.ts` — `error` L42 → `_error`
- [ ] `api/boffmedia/herramientas/pokemon/tcgpocket/tcg.module.ts` — remove `BoffMediaUsersManagementService` (L15)
- [ ] `api/boffmedia/herramientas/pokemon/vgc/meta/services/vgcpastes.service.ts` — remove `Dex` (L2)
- [ ] `api/boffmedia/herramientas/pokemon/vgc/mod/scripts.ts` — `ppUps` L32, `pokemon` L246 → investigate if needed
- [ ] `api/boffmedia/herramientas/pokemon/vgc/mod/items.ts` — `pokemon` L1031 → `_pokemon`
- [ ] `api/boffmedia/herramientas/mhwilds/mhwilds.facade.service.ts` — `error` L225, L240 → `_error`
- [ ] `api/boffmedia/herramientas/mhwilds/repositories/mhwilds.repository.ts` — `fallbackError` L181 → `_fallbackError`; `error` L250 → `_error`
- [ ] `api/boffmedia/herramientas/mhwilds/services/mhwilds-cache.service.ts` — remove `MhwildsRepository` (L2)
- [ ] `api/boffmedia/herramientas/mhwilds/services/mhwilds-data.service.ts` — remove `MhwildsRepository` (L3)
- [ ] `api/boffmedia/herramientas/manga/services/manga-download.service.ts` — remove `ChapterDownloadStatus` (L10)
- [ ] `api/boffmedia/herramientas/manga/services/novecool.service.ts` — `SEL_CHAPTER_IMAGES` L42 → investigate if needed
- [ ] `api/boffmedia/herramientas/scrape/services/myrient.service.ts` — remove `MYRIENT_BASE_URL` (L28)
- [ ] `api/boffmedia/herramientas/scrape/services/manga/manga-cron.service.ts` — already prefixed `_event` (L74) — verify then mark done
- [ ] `api/boffmedia/herramientas/scrape/services/manga/scrapers/leercapitulo/leercapitulo.scraper.ts` — `_query` L39 already prefixed — verify
- [ ] `api/boffmedia/herramientas/scrape/services/manga/scrapers/pkproject/pkproject.scraper.ts` — `_context` L151 already prefixed — verify
- [ ] `api/boffmedia/herramientas/scrape/dto/download-selected-games.dto.ts` — remove `IsString` (L8)

#### BoffMedia — Util

- [ ] `api/boffmedia/util/sharex/sharex.controller.ts` — remove `Get` (L6); `error` L61 → `_error`
- [ ] `api/boffmedia/util/sharex/sharex.service.ts` — remove `Inject` (L3)
- [ ] `api/boffmedia/util/upload/upload.controller.ts` — remove `Param` (L8), `ApiParam` (L21)
- [ ] `api/boffmedia/util/upload/services/file-upload.service.ts` — remove `UploadedFileDetails` (L5)

#### SmartRotom — Pokemon

- [ ] `api/smartrotom/pokemon/pokemon.controller.ts` — remove `GetPokemonByDexDto`, `SearchPokemonDto`, `GetPokemonMovesDto`, `GetPokemonImageDto` (L30–L34), `Move` (L43), `BiomeSpawnData` (L53), `PokemonBiomes` (L65)
- [ ] `api/smartrotom/pokemon/pokemon.facade.service.ts` — remove `Attack` (L8), `Fuse` (L10)
- [ ] `api/smartrotom/pokemon/services/data/pokemon-data.service.ts` — remove `fs` (L9); `index` L105 → `_index`; `thisEvo` L430, `evoEvo` L437 → investigate; `index` L443 → `_index`
- [ ] `api/smartrotom/pokemon/services/data/spawn-data.service.ts` — remove `fs` (L6), `Console` (L7); `pokemonId` L176 → `_pokemonId`
- [ ] `api/smartrotom/pokemon/services/pokemon-showdown.service.ts` — remove `ShowdownPokemon` (L4), `fs` (L7), `path` (L8), `fsPromises` (L9); `pokemonName` L91 → `_pokemonName`
- [ ] `api/smartrotom/pokemon/services/data/move-data.service.ts` — remove `Attack` (L3)
- [ ] `api/smartrotom/pokemon/services/pokemon-data-management.service.ts` — remove `PokemonForm` (L7), `Attack` (L7); `key` L138 → `_key`
- [ ] `api/smartrotom/pokemon/services/data/pokemon-image.service.ts` — `error` L265 → `_error`
- [ ] `api/smartrotom/pokemon/services/sprite-manifest.service.ts` — remove `SpriteLocation` (L3)
- [ ] `api/smartrotom/pokemon/repositories/interfaces/pokemon.repository.interface.ts` — remove `BulkUpdateData` (L5), `BulkUpdateResult` (L6)
- [ ] `api/smartrotom/pokemon/interfaces/pokemon.interface.ts` — remove `index` (L1)
- [ ] `api/smartrotom/pokemon/utils/types.ts` — remove `off` (L1), `fsPromises` (L4); `result` L344 → investigate
- [ ] `api/smartrotom/pokemon/utils/MoveData.ts` — remove `wolfeyTypeRanking` (L4)
- [ ] `api/smartrotom/pokemon/utils/SpawnData.ts` — remove `MoveData` (L5)
- [ ] `api/smartrotom/pokemon/utils/PokemonData.ts` — `formIndex` L82 → `_formIndex`; `species` L257 → investigate

#### SmartRotom — Other modules

- [ ] `api/smartrotom/liga/liga.facade.service.ts` — remove `LeagueStanding` (L15)
- [ ] `api/smartrotom/liga/repositories/liga.repository.ts` — remove `and` (L3), `asc` (L3), `SmartRotomReplay` (L8), `SmartRotomUserReplay` (L9); `tournamentId` L236, L241 → `_tournamentId`
- [ ] `api/smartrotom/liga/services/tournament.service.ts` — `registration` L72 → investigate
- [ ] `api/smartrotom/mine/repositories/mine.repository.ts` — remove `asc` (L3), `sum` (L3), `count` (L3), `RecompensaMina` (L11)
- [ ] `api/smartrotom/mine/services/energy.service.ts` — remove `PlayerEnergy` (L2)
- [ ] `api/smartrotom/mine/types.ts` — remove `HistoryEntry` (L1), `RankingEntry` (L10), `RewardEntry` (L15)
- [ ] `api/smartrotom/misiones/repositories/quest.repository.ts` — remove `QuestData`, `IDialogue`, `IQuestCategory`, `NPC` (L4)
- [ ] `api/smartrotom/misiones/repositories/interfaces/quest.repository.interface.ts` — remove `QuestSystemData` (L6)
- [ ] `api/smartrotom/misiones/misiones.controller.ts` — remove `Delete` (L8), `CheckImageDto` (L33)
- [ ] `api/smartrotom/misiones/misiones.facade.service.ts` — remove `NPCUpdateRequest` (L4); `error` L193 → `_error`
- [ ] `api/smartrotom/misiones/services/quest.cache.service.ts` — remove `QuestData` (L4), `IDialogue` (L5), `IQuestCategory` (L6)
- [ ] `api/smartrotom/misiones/types.ts` — remove `text` (L1)
- [ ] `api/smartrotom/achievement/achievement.controller.ts` — remove `BaseInsertResponse` (L28)
- [ ] `api/smartrotom/achievement/services/achievements.service.ts` — remove `AchievementStatusEntity` (L12)
- [ ] `api/smartrotom/achievement/repositories/achievements.repository.ts` — `id` L40, L45 → `_id`; `data` L40 → `_data`
- [ ] `api/smartrotom/apps/apps.facade.service.ts` — remove `Inject` (L1)
- [ ] `api/smartrotom/apps/repositories/user-apps.repository.ts` — remove `or` (L3); `result` L46 → investigate
- [ ] `api/smartrotom/apps/apps.controller.spec.ts` — remove `HttpStatus` (L3); `mockSuccessResponse` L59 → investigate if test assertion is missing
- [ ] `api/smartrotom/arcade/arcade.controller.ts` — `itemType` L162, `rarity` L163 → `_itemType`, `_rarity`
- [ ] `api/smartrotom/arcade/arcade.facade.service.ts` — remove `ConflictException` (L6)
- [ ] `api/smartrotom/arcade/arcade.module.ts` — remove `IArcadeStreakRepository` (L15), `IArcadeInventoryRepository` (L16)
- [ ] `api/smartrotom/arcade/dto/lottbox.dto.ts` — remove `IsNumber` (L3), `LootItemDto` (L35)
- [ ] `api/smartrotom/arcade/entities/arcade-inventory.entity.ts` — remove `IsNumber` (L9)
- [ ] `api/smartrotom/arcade/services/inventory.service.ts` — `sourceType` L59 → `_sourceType`
- [ ] `api/smartrotom/arcade/services/lootbox.service.ts` — `newItemResult` L52 → investigate
- [ ] `api/smartrotom/arcade/services/streak.service.ts` — `streak` L217 → investigate
- [ ] `api/smartrotom/chatapp/chatapp.controller.ts` — `limit` L135 → `_limit`
- [ ] `api/smartrotom/chatapp/chatapp.facade.service.ts` — `chatId` L344 → investigate
- [ ] `api/smartrotom/chatapp/dto/call.dto.ts` — remove `IsEnum` (L3)
- [ ] `api/smartrotom/chatapp/dto/chat.dto.ts` — remove `IsEnum` (L9)
- [ ] `api/smartrotom/chatapp/services/call.service.ts` — `status` L90 → `_status`
- [ ] `api/smartrotom/documents/entities/document.entity.ts` — remove `Optional` (L1)
- [ ] `api/smartrotom/documents/dto/news.dto.ts` — remove `IsUrl` (L10), `Base` (L12)
- [ ] `api/smartrotom/ficusai/ficusai.facade.service.ts` — `server` L50 → investigate
- [ ] `api/smartrotom/ficusai/repositories/ficusai.repository.ts` — `id` L29, `updateDto` L29 → `_id`, `_updateDto`
- [ ] `api/smartrotom/starbank/starbank.controller.ts` — remove `Req` (L12), `CreateAccountDto` (L27), `extname` (L38), `join` (L38), `mkdir` (L39)
- [ ] `api/smartrotom/users/users.controller.ts` — remove `ApiBody` (L18)
- [ ] `api/smartrotom/_dto/taxi-stop.dto.ts` — remove `ApiProperty` (L1)
- [ ] `api/smartrotom/_main/smartrotom.service.ts` — remove `OnModuleInit` (L1)
- [ ] `api/smartrotom/wingull/dto/battle-team.dto.ts` — remove `IsArray` (L5), `IsUUID` (L6)
- [ ] `api/smartrotom/wingull/services/wingull-transport.service.ts` — remove `WingullTransportRepository` (L3)
- [ ] `api/smartrotom/wingull/wingull.module.ts` — remove `DrizzleModule` (L4)
- [ ] `api/wingull/invites/invites.controller.ts` — remove `Patch` (L6)

#### Automation / Discord

- [ ] `automation/twitch/services/twitch-monitor.service.ts` — remove `Cron`, `CronExpression` (L2); `source` L150 → `_source`; `userId` L202 → `_userId`
- [ ] `automation/twitch/services/notification.service.ts` — `target` L107, L157 → `_target`
- [ ] `automation/twitch/twitch-debug.controller.ts` — remove `Query` (L1), `ApiQuery` (L2)
- [ ] `discord/_main/discord.controller.ts` — remove `Post` (L1), `DiscordService` (L2)
- [ ] `discord/_main/message.listener.ts` — remove `Message` (L3)
- [ ] `discord/_commands/commands.service.ts` — remove `or` (L10)
- [ ] `discord/commands/global/meta/meta-matchup.command.ts` — `buildCalcPage` L253 → investigate
- [ ] `api/smartrotom/_main/smartrotom.service.ts` — remove `OnModuleInit` (L1)

#### Deprecated module

- [ ] `api/deprecated/battle/_dto/battle-config.dto.ts` — remove `IsObject` (L7) — **also check if entire `deprecated/` folder can be deleted**

---

## 3. Needs investigation before touching

These items require reading the surrounding code before deciding how to proceed.

### 3a. Migration status — `users.module.ts`

```
apps/api/src/api/boffmedia/users/users.module.ts L36, L44
// REMOVE THIS AFTER MIGRATION — BoffMediaUsersRepository
```

- [?] Verify whether the BoffMedia → SmartRotom users migration is complete
- [?] If complete: remove `BoffMediaUsersRepository` import + usage from `users.module.ts`, then re-run type-check

### 3b. `@deprecated` entities — are they still used?

| Symbol | File |
|---|---|
| `ArceuSpeakEntity` | `smartrotomService.ts` |
| `PokemonW` | `playerService.ts` |
| `FicusAiHealthEntity` | `ficusAiService.ts` |
| `smogonUsageUrl`, `smogonMovesetUrl` | `smogon.config.ts` |

- [?] For each: `grep -r "ArceuSpeakEntity" apps/api/src --include="*.ts"` to find all usages
- [?] If 0 usages outside the declaration file: delete the class, its imports, and the `@deprecated` comment

### 3c. Active TODOs

| File | Line | Comment |
|---|---|---|
| `api/boffmedia/users/users.module.ts` | L36, L44 | REMOVE THIS AFTER MIGRATION (see 3a) |
| `api/smartrotom/chatapp/services/group.service.ts` | L190 | TODO: Implement unread count logic |
| `apps/web/src/app/smartrotom/arcade/loot/_hooks/useLootBoxInventory.ts` | L124 | FIX THIS (weight: 0) |
| `api/smartrotom/pokemon/pokemon.controller.ts` | L648 | API FIX |
| `apps/web/src/app/smartrotom/liga/camaralucha/page.tsx` | L12 | TODO: implement useBattleReplays |

- [?] Review each TODO in context and either implement, ticket it, or delete if stale

---

## 4. Console.log → structured logger

**Scale**: ~1,044 statements (API ~900, Web ~140)  
**Decision**: Replace with NestJS Logger in API, thin wrapper in Web.

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

```
apps/api/src/api/deprecated/
```

- [?] Check if any code outside `deprecated/` imports from it
- [?] If no external importers: delete the entire folder

---

## Summary

| Category | Items | Priority |
|---|---|---|
| Delete page copies | 3 files | High — do now |
| Delete test routes | 11 pages | High — do now |
| API unused-vars (rule is now `error`) | 91 files, 216 warnings | High — fix before editing each file |
| Migration status investigation | 1 | Medium |
| @deprecated investigation | 4 symbols | Medium |
| Active TODOs | 5 | Medium |
| Console.log → Logger migration | ~1,044 calls | Medium — plan a sprint |
| Large data files | 4 files | Low |
| `deprecated/` folder | 1 folder | Low — investigate first |
