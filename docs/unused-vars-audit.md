# Unused Variables Audit — Manual Review Reference

> Generated 2026-05-17. Documents every change made to resolve `@typescript-eslint/no-unused-vars`.
> Two categories: **`_` prefix** (variable kept but suppressed — decide to remove or implement) and **removed imports** (already deleted — listed for reference).

---

## Part 1 — Variables renamed to `_` prefix

These are parameters and local variables that were renamed with a `_` prefix to suppress the lint rule. Each one is a decision point: either **remove it** (if it's truly dead code) or **implement it** (if there's intent to use it).

---

### `apps/api/src/_utils/MySQL2Service.ts`
| Line | Before | After | Context |
|---|---|---|---|
| 87 | `const [rows, fields]` | `const [rows, _fields]` | `mysql2` query result — `fields` is column metadata, unused |

### `apps/api/src/_utils/WingullSQL2Service.ts`
| Line | Before | After | Context |
|---|---|---|---|
| 87 | `const [rows, fields]` | `const [rows, _fields]` | Same pattern as MySQL2Service |

### `apps/api/src/_utils/interceptors/response.interceptor.ts`
| Line | Before | After | Context |
|---|---|---|---|
| 21 | `const response = context.switchToHttp().getResponse()` | `const _response = ...` | HTTP response object fetched but never read |
| 104 | `catch (e)` | `catch (_e)` | Error swallowed silently |

### `apps/api/src/_utils/response/response.service.ts`
| Line | Before | After | Context |
|---|---|---|---|
| 7 | `logRequest(action: string, data: any)` | `logRequest(_action: string, _data: any)` | Logger body is commented out (`//this.logger.log`) |
| 11 | `logSuccess(action: string, data: any)` | `logSuccess(_action: string, _data: any)` | Same — logger body commented out |
| 24 | `handleError(action, error, data?)` | `handleError(action, error, _data?)` | `data` parameter unused in error handler body |

### `apps/api/src/_utils/sockets/sockets.gateway.ts`
| Line | Before | After | Context |
|---|---|---|---|
| 44 | `const existingUser = this.users.get(...)` | `const _existingUser = ...` | User looked up but result never used |
| 101 | `const sockets = this.server.sockets.sockets` | `const _sockets = ...` | Socket map fetched but never iterated |
| 130 | `const sockets = this.server.sockets.sockets` | `const _sockets = ...` | Same pattern, second occurrence |

### `apps/api/src/app.controller.ts`
| Line | Before | After | Context |
|---|---|---|---|
| 55 | `catch (err: any)` | `catch (_err: any)` | Error caught but not logged or rethrown |
| 121 | `@Body() body: { url: string }` | `@Body() _body: { url: string }` | Request body received but unused in handler |

### `apps/api/src/api/_repositories/boffmedia/invites.repository.ts`
| Line | Before | After | Context |
|---|---|---|---|
| 82 | `limit?: number` | `_limit?: number` | Pagination params accepted but not implemented |
| 83 | `offset?: number` | `_offset?: number` | Same |

### `apps/api/src/api/boffmedia/events/services/participants.service.ts`
| Line | Before | After | Context |
|---|---|---|---|
| 131 | `validateParticipantExists(participantId: number)` | `validateParticipantExists(_participantId: number)` | Method is a stub: `return true` — param unused |

### `apps/api/src/api/boffmedia/herramientas/manga/services/novecool.service.ts`
| Line | Before | After | Context |
|---|---|---|---|
| 42 | `const SEL_CHAPTER_IMAGES = ...` | `const _SEL_CHAPTER_IMAGES = ...` | CSS selector constant defined but never used in any query |

### `apps/api/src/api/boffmedia/herramientas/mhwilds/mhwilds.facade.service.ts`
| Line | Before | After | Context |
|---|---|---|---|
| 225 | `catch (error: any)` | `catch (_error: any)` | Silent fallback — error swallowed |
| 240 | `catch (error: any)` | `catch (_error: any)` | Same |

### `apps/api/src/api/boffmedia/herramientas/mhwilds/repositories/mhwilds.repository.ts`
| Line | Before | After | Context |
|---|---|---|---|
| 181 | `catch (fallbackError)` | `catch (_fallbackError)` | Fallback catch — silent |
| 250 | `catch (error: any)` | `catch (_error: any)` | Silent error |

### `apps/api/src/api/boffmedia/herramientas/pokemon/tcgpocket/services/tcg.service.ts`
| Line | Before | After | Context |
|---|---|---|---|
| 208 | `const existingCardsMap = new Map(...)` | `const _existingCardsMap = ...` | Map built from DB results but never read after construction |
| 449 | `catch (error: any)` | `catch (_error: any)` | Silent catch |

### `apps/api/src/api/boffmedia/herramientas/pokemon/tcgpocket/tcg.controller.ts`
| Line | Before | After | Context |
|---|---|---|---|
| 42 | `catch (error: any)` | `catch (_error: any)` | Silent catch |

### `apps/api/src/api/boffmedia/herramientas/pokemon/vgc/mod/scripts.ts`
| Line | Before | After | Context |
|---|---|---|---|
| 32 | `calculatePP(move, ppUps)` | `calculatePP(move, _ppUps)` | PP-ups parameter not used in formula |
| 246 | `canTerastallize(pokemon)` | `canTerastallize(_pokemon)` | Pokemon object unused — returns fixed value |

### `apps/api/src/api/boffmedia/herramientas/pokemon/vgc/mod/items.ts`
| Line | Before | After | Context |
|---|---|---|---|
| 1031 | `onWhiteHerb(pokemon)` | `onWhiteHerb(_pokemon)` | Game engine callback — pokemon param unused in this hook |

### `apps/api/src/api/boffmedia/util/sharex/sharex.controller.ts`
| Line | Before | After | Context |
|---|---|---|---|
| 60 | `catch (error: any)` | `catch (_error: any)` | Silent catch |

### `apps/api/src/api/smartrotom/achievement/repositories/achievements.repository.ts`
| Line | Before | After | Context |
|---|---|---|---|
| 40 | `update(id: number, data: UpdateAchievementDto)` | `update(_id: number, _data: UpdateAchievementDto)` | Stub method — `throw new Error('not implemented')` |
| 45 | `delete(id: number)` | `delete(_id: number)` | Stub method |

### `apps/api/src/api/smartrotom/apps/apps.controller.spec.ts`
| Line | Before | After | Context |
|---|---|---|---|
| 58 | `const mockSuccessResponse: SuccessResponse = {...}` | `const _mockSuccessResponse: ...` | Test fixture built but no assertion uses it |

### `apps/api/src/api/smartrotom/apps/repositories/user-apps.repository.ts`
| Line | Before | After | Context |
|---|---|---|---|
| 46 | `const result = await this.db.insert(...)` | `const _result = ...` | Insert result captured but never inspected |

### `apps/api/src/api/smartrotom/arcade/services/inventory.service.ts`
| Line | Before | After | Context |
|---|---|---|---|
| 59 | `_sourceType?: string` | (already prefixed) | Source type param not used in inventory logic |

### `apps/api/src/api/smartrotom/arcade/services/lootbox.service.ts`
| Line | Before | After | Context |
|---|---|---|---|
| 52 | `const newItemResult = await this.arcadeInventoryRepository.addItem(...)` | `const _newItemResult = ...` | Inventory add result never read |

### `apps/api/src/api/smartrotom/arcade/services/streak.service.ts`
| Line | Before | After | Context |
|---|---|---|---|
| 217 | `shouldResetStreak(streak: ArcadeStreak)` | `shouldResetStreak(_streak: ArcadeStreak)` | Streak object unused — method returns hardcoded value |

### `apps/api/src/api/smartrotom/chatapp/chatapp.controller.ts`
| Line | Before | After | Context |
|---|---|---|---|
| 135 | `@Query('limit') limit?: string` | `@Query('limit') _limit?: string` | Pagination query param accepted but not passed to service |

### `apps/api/src/api/smartrotom/ficusai/repositories/ficusai.repository.ts`
| Line | Before | After | Context |
|---|---|---|---|
| 29 | `update(id: number, updateDto: never)` | `update(_id: number, _updateDto: never)` | Stub method — not implemented |

### `apps/api/src/api/smartrotom/liga/repositories/liga.repository.ts`
| Line | Before | After | Context |
|---|---|---|---|
| 234 | `findTournamentById(tournamentId: number)` | `findTournamentById(_tournamentId: number)` | Stub — throws `new Error('not implemented')` |
| 239 | `findTournamentMatches(tournamentId: number)` | `findTournamentMatches(_tournamentId: number)` | Same |

### `apps/api/src/api/smartrotom/liga/services/tournament.service.ts`
| Line | Before | After | Context |
|---|---|---|---|
| 72 | `registerForTournament(registration: TournamentRegistration)` | `registerForTournament(_registration: TournamentRegistration)` | Stub — throws `new Error('not implemented')` |

### `apps/api/src/api/smartrotom/misiones/misiones.facade.service.ts`
| Line | Before | After | Context |
|---|---|---|---|
| 189 | `catch (error: any)` | `catch (_error: any)` | Silent catch |

### `apps/api/src/api/smartrotom/pokemon/services/data/pokemon-data.service.ts`
| Line | Before | After | Context |
|---|---|---|---|
| 104 | `processForm(species, form, index: number)` | `processForm(species, form, _index: number)` | Form index passed but not used inside |
| 379 | `let index = 0` | `let _index = 0` | Loop counter incremented but never read |
| 429 | `const thisEvo = evoArray[evoId]` | `const _thisEvo = ...` | Evolution object fetched but only its children are traversed |
| 436 | `const evoEvo = this.getEvos(...)` | `const _evoEvo = ...` | Same — recursive result captured but discarded |

### `apps/api/src/api/smartrotom/pokemon/services/data/pokemon-image.service.ts`
| Line | Before | After | Context |
|---|---|---|---|
| 265 | `catch (error: any)` | `catch (_error: any)` | Silent catch — returns fallback URL |

### `apps/api/src/api/smartrotom/pokemon/services/data/spawn-data.service.ts`
| Line | Before | After | Context |
|---|---|---|---|
| 174 | `for (const [pokemonId, spawnInfos] of ...)` | `for (const [_pokemonId, spawnInfos] of ...)` | Dex ID key not needed — only values iterated |

### `apps/api/src/api/smartrotom/pokemon/services/pokemon-showdown.service.ts`
| Line | Before | After | Context |
|---|---|---|---|
| 85 | `for (const [pokemonName, pokemonData] of ...)` | `for (const [_pokemonName, pokemonData] of ...)` | Pokemon name key not needed — only data used |

### `apps/api/src/api/smartrotom/pokemon/utils/PokemonData.ts`
| Line | Before | After | Context |
|---|---|---|---|
| 82 | `let formIndex = 0` | `let _formIndex = 0` | Form counter incremented but never read |
| 257 | `([move, species])` | `([move, _species])` | Object.entries key/value — species list not needed, only key |

### `apps/api/src/api/smartrotom/pokemon/utils/types.ts`
| Line | Before | After | Context |
|---|---|---|---|
| 342 | `const result = Array.isArray(...)` | `const _result = ...` | Result of validation check assigned but never returned or used |

### `apps/api/src/automation/twitch/services/twitch-monitor.service.ts`
| Line | Before | After | Context |
|---|---|---|---|
| 149 | `processStream(stream, source: 'user')` | `processStream(stream, _source: 'user')` | Literal type param not used in body |
| 201 | `for (const [userId, cached] of ...)` | `for (const [_userId, cached] of ...)` | Map key not needed — only value used |

### `apps/api/src/automation/twitch/services/notification.service.ts`
| Line | Before | After | Context |
|---|---|---|---|
| 107 | `sendDiscordNotification(notification, target: NotificationTarget)` | `sendDiscordNotification(notification, _target: NotificationTarget)` | Stub — only logs, doesn't use target |
| 157 | `logToConsole(notification, target: NotificationTarget)` | `logToConsole(notification, _target: NotificationTarget)` | Same |

### `apps/api/src/api/battlesimulator/battle/battle.controller.ts`
| Line | Before | After | Context |
|---|---|---|---|
| 45 | `let equipo1` | `let _equipo1` | Declared for team assignment that was commented out |
| 46 | `let equipo2` | `let _equipo2` | Same |
| 77 | `const dex = Dex.forFormat(FORMAT)` | `const _dex = ...` | Dex instance created but never queried |
| 78 | `const validator = new TeamValidator(FORMAT)` | `const _validator = ...` | Validator created but never used to validate |
| 190 | `new Promise((resolve, reject) =>` | `new Promise((resolve, _reject) =>` | Promise never explicitly rejected — only resolved |
| 214 | `const key = Protocol.key(args)` | `const _key = ...` | Protocol key extracted but discarded |

### `apps/api/src/discord/commands/global/meta/meta-matchup.command.ts`
| Line | Before | After | Context |
|---|---|---|---|
| 253 | `function buildCalcPage(...)` | `function _buildCalcPage(...)` | Superseded by `buildCalcPageWithField` — never called |

---

## Part 2 — Removed imports

These import lines were deleted entirely. Listed by file for reference.

---

### Schema files

**`_db/schema/FicusAI.ts`**
- `mysqlSchema` — drizzle helper, not used in this schema
- `text`, `varchar` — column types not referenced
- `import { smartrotomUsers } from './SmartRotom'` — cross-schema reference, unused

**`_db/schema/SmartRotomDocuments.ts`**
- `date` — column type imported but schema uses `datetime` instead

**`_db/schema/SmartRotomStarBank.ts`**
- `import exp from 'constants'` — accidental Node.js import

---

### Utils / Infrastructure

**`app.module.ts`**
- `import { DiscordService }` — service was registered in providers but removed from the module

**`minecraft.middleware.ts`**
- `import multer from 'multer'` — file upload library imported but not used in this middleware

---

### Auth / Users

**`api/auth/auth.module.ts`**
- `import { BoffMediaUsersManagementService }` — not in providers list

**`api/boffmedia/users/repositories/users.repository.ts`**
- `SmartRotomUser` — cross-domain type, unused in this repository

**`api/boffmedia/users/users.controller.ts`**
- `import { UserWithRolesEntity }` — entity no longer returned by any endpoint

**`api/boffmedia/users/services/users-management.service.ts`**
- `import * as bcrypt from 'bcrypt'` — hashing moved to `PasswordService`
- `import { BoffMediaUser }` — raw DB type, unused (service uses safe types)

**`api/boffmedia/users/dto/get-user-by-id.dto.ts`**
- `IsOptional` — class-validator decorator, no optional fields in this DTO

---

### BoffMedia — Events

**`api/boffmedia/events/services/participants.service.ts`**
- `Achievement` — imported from Events schema, not used in this service

**`api/boffmedia/events/services/progress.service.ts`**
- `boffMediaAchievements` — schema table imported but not queried here

**`api/boffmedia/events/services/teams.service.ts`**
- `import { TeamMember }` — entity type, not referenced

**`api/boffmedia/events/dto/join-event.dto.ts`**
- `IsUrl` — validator decorator, no URL fields in this DTO

**`api/_repositories/boffmedia/participants.repository.ts`**
- `ParticipantProgress` — type not used in repository methods
- `Achievement` — same
- `PARTICIPANT_STATUS` — enum imported but not referenced

---

### BoffMedia — Herramientas

**`api/boffmedia/herramientas/pokemon/tcgpocket/services/tcg.service.ts`**
- `UserCard`, `UserCardHistory` — type imports for DTOs not used in this service
- `import * as fs from 'fs'` — file system, not used after refactor

**`api/boffmedia/herramientas/pokemon/tcgpocket/tcg.module.ts`**
- `import { BoffMediaUsersManagementService }` — not in providers

**`api/boffmedia/herramientas/pokemon/vgc/meta/services/vgcpastes.service.ts`**
- `import { Dex } from '@pkmn/sim'` — showdown Dex, not used after refactor

**`api/boffmedia/herramientas/mhwilds/services/mhwilds-cache.service.ts`**
- `import { MhwildsRepository }` — was constructor-injected but removed

**`api/boffmedia/herramientas/mhwilds/services/mhwilds-data.service.ts`**
- `import { MhwildsRepository }` — same

**`api/boffmedia/herramientas/manga/services/manga-download.service.ts`**
- `ChapterDownloadStatus` — enum imported but not referenced in method signatures

**`api/boffmedia/herramientas/vgc/meta/config/smogon.config.ts`**
- `smogonChaosUrl` function — deprecated and unused, replaced by `smogonUsageUrl` + `smogonMovesetUrl`

**`api/boffmedia/herramientas/scrape/services/myrient.service.ts`**
- `MYRIENT_BASE_URL` — constant defined, never referenced

**`api/boffmedia/herramientas/scrape/dto/download-selected-games.dto.ts`**
- `IsString` — validator decorator, unused

---

### BoffMedia — Util

**`api/boffmedia/util/sharex/sharex.controller.ts`**
- `Get` — NestJS decorator, no `@Get` routes in this controller

**`api/boffmedia/util/sharex/sharex.service.ts`**
- `Inject` — NestJS decorator, no token-based injection used

**`api/boffmedia/util/upload/upload.controller.ts`**
- `Param` — NestJS decorator, no `:param` routes
- `ApiParam` — Swagger decorator, same

**`api/boffmedia/util/upload/services/file-upload.service.ts`**
- `UploadedFileDetails` — type not referenced in this service

---

### SmartRotom — Pokemon

**`api/smartrotom/pokemon/pokemon.controller.ts`**
- `GetPokemonByDexDto`, `SearchPokemonDto`, `GetPokemonMovesDto`, `GetPokemonImageDto` — request DTOs not used in method signatures
- `Move` — entity type, no endpoint returns it
- `BiomeSpawnData`, `PokemonBiomes` — types not used in controller

**`api/smartrotom/pokemon/pokemon.facade.service.ts`**
- `Attack` — move type, not referenced in facade
- `Fuse` (default import) — only `FuseResult` type is used, not the class itself

**`api/smartrotom/pokemon/services/data/pokemon-data.service.ts`**
- `import * as fs from 'fs'` — file system, reads delegated to utility class

**`api/smartrotom/pokemon/services/data/spawn-data.service.ts`**
- `import * as fs from 'fs'` — same
- `import { Console } from 'console'` — Node.js Console class, unused

**`api/smartrotom/pokemon/services/pokemon-showdown.service.ts`**
- `ShowdownPokemon` — type, only `ShowdownPokemonData` used
- `fs`, `path`, `fsPromises` — file system, no longer used after data loading refactor

**`api/smartrotom/pokemon/services/data/move-data.service.ts`**
- `import { Attack }` — type not referenced in this service

**`api/smartrotom/pokemon/services/pokemon-data-management.service.ts`**
- `PokemonForm`, `Attack` — types not referenced

**`api/smartrotom/pokemon/services/sprite-manifest.service.ts`**
- `SpriteLocation` — interface not used in this service

**`api/smartrotom/pokemon/repositories/interfaces/pokemon.repository.interface.ts`**
- `BulkUpdateData`, `BulkUpdateResult` — types declared but not used in the interface

**`api/smartrotom/pokemon/interfaces/pokemon.interface.ts`**
- `import { index } from 'drizzle-orm/mysql-core'` — ORM helper, not used in type definitions

**`api/smartrotom/pokemon/utils/types.ts`**
- `import { off } from 'process'` — Node.js event emitter helper, unused
- `import { promises as fsPromises } from 'fs'` — async file system, unused

**`api/smartrotom/pokemon/utils/MoveData.ts`**
- `import { wolfeyTypeRanking } from './types'` — ranking data, only used in PokemonData

**`api/smartrotom/pokemon/utils/SpawnData.ts`**
- `import { MoveData } from './MoveData'` — type not used in spawn loading

**`apps/api/src/types/pokemon.ts`**
- `import { index } from 'drizzle-orm/mysql-core'` — ORM helper, not used in raw type file

---

### SmartRotom — Other modules

**`api/smartrotom/liga/liga.facade.service.ts`**
- `LeagueStanding` — type not returned by any facade method

**`api/smartrotom/liga/repositories/liga.repository.ts`**
- `and`, `asc` — drizzle query operators, not used
- `SmartRotomReplay`, `SmartRotomUserReplay` — schema tables, not queried in this repository

**`api/smartrotom/mine/repositories/mine.repository.ts`**
- `asc`, `sum`, `count` — drizzle operators, unused
- `RecompensaMina` — schema type, not used

**`api/smartrotom/mine/services/energy.service.ts`**
- `PlayerEnergy` — type not returned by public methods

**`api/smartrotom/misiones/repositories/quest.repository.ts`**
- `IQuestCategory` — interface imported but repository uses only external response types

**`api/smartrotom/misiones/repositories/interfaces/quest.repository.interface.ts`**
- `QuestSystemData` — type not used in this interface

**`api/smartrotom/misiones/misiones.controller.ts`**
- `Delete` — NestJS decorator, no delete routes
- `CheckImageDto` — DTO type not used in controller

**`api/smartrotom/misiones/misiones.facade.service.ts`**
- `NPCUpdateRequest` — request type, no update NPC endpoint wired up

**`api/smartrotom/misiones/services/quest.cache.service.ts`**
- `QuestData`, `IDialogue`, `IQuestCategory` — types imported but not used in cache methods

**`api/smartrotom/misiones/types.ts`**
- `text` — drizzle column type, no schema in this file

**`api/smartrotom/achievement/achievement.controller.ts`**
- `BaseInsertResponse` — response type, not returned by any endpoint

**`api/smartrotom/achievement/services/achievements.service.ts`**
- `AchievementStatusEntity` — entity class, not returned by service methods

**`api/smartrotom/apps/apps.facade.service.ts`**
- `Inject` — NestJS decorator, no token injection in this facade

**`api/smartrotom/apps/repositories/user-apps.repository.ts`**
- `or` — drizzle operator, queries use only `and`/`eq`

**`api/smartrotom/apps/apps.controller.spec.ts`**
- `HttpStatus` — NestJS enum, no status code assertions in spec

**`api/smartrotom/arcade/arcade.facade.service.ts`**
- `ConflictException` — NestJS exception, not thrown in facade

**`api/smartrotom/arcade/arcade.module.ts`**
- `IArcadeStreakRepository`, `IArcadeInventoryRepository` — token imports not registered in providers

**`api/smartrotom/arcade/dto/lottbox.dto.ts`**
- `IsNumber` — validator decorator, no number fields in lootbox DTO
- `LootItemDto` — DTO class not used in this file

**`api/smartrotom/arcade/entities/arcade-inventory.entity.ts`**
- `IsNumber` — validator decorator, unused

**`api/smartrotom/chatapp/dto/call.dto.ts`**
- `IsEnum` — validator decorator, unused

**`api/smartrotom/chatapp/dto/chat.dto.ts`**
- `IsEnum` — validator decorator, unused

**`api/smartrotom/documents/entities/document.entity.ts`**
- `Optional` — NestJS decorator, no optional properties in entity

**`api/smartrotom/documents/dto/news.dto.ts`**
- `IsUrl` — validator decorator, no URL fields
- `Base` — discord.js class, no Discord in news DTO

**`api/smartrotom/ficusai/ficusai.facade.service.ts`**
- `server` removed from destructuring: `const { uuid, mensaje, server } = sendMessageDto` → `const { uuid, mensaje } = sendMessageDto`

**`api/smartrotom/chatapp/chatapp.facade.service.ts`**
- `chatId` removed from destructuring: `const { chatId, caller, users } = callSession` → `const { caller, users } = callSession`

**`api/smartrotom/starbank/starbank.controller.ts`**
- `Req` — NestJS decorator, unused
- `CreateAccountDto` — DTO not used in controller methods
- `extname`, `join` — path utilities, unused
- `mkdir` — fs utility, unused

**`api/smartrotom/users/users.controller.ts`**
- `ApiBody` — Swagger decorator, no request body docs needed

**`api/smartrotom/_dto/taxi-stop.dto.ts`**
- `ApiProperty` — Swagger decorator, no property docs in this DTO

**`api/smartrotom/_main/smartrotom.service.ts`**
- `OnModuleInit` — NestJS lifecycle interface, not implemented

**`api/smartrotom/wingull/dto/battle-team.dto.ts`**
- `IsArray`, `IsUUID` — validator decorators, unused

**`api/smartrotom/wingull/services/wingull-transport.service.ts`**
- `WingullTransportRepository` — repository import not injected

**`api/smartrotom/wingull/wingull.module.ts`**
- `DrizzleModule` — module not needed here (already imported higher up)

**`api/wingull/invites/invites.controller.ts`**
- `Patch` — NestJS decorator, no PATCH routes

---

### Automation / Discord

**`automation/twitch/services/twitch-monitor.service.ts`**
- `Cron`, `CronExpression` — schedule decorators, the `@Cron` usage is commented out

**`automation/twitch/twitch-debug.controller.ts`**
- `Query` — NestJS decorator, no query params
- `ApiQuery` — Swagger decorator, same

**`discord/_main/discord.controller.ts`**
- `Post` — NestJS decorator, the only `@Post` route is commented out
- `DiscordService` — service injection also commented out

**`discord/_main/message.listener.ts`**
- `Message` — discord.js type, not used as a type annotation

**`discord/_commands/commands.service.ts`**
- `or` — drizzle operator, all queries use `and`/`eq`

---

## Part 3 — Entire files / symbols deleted

| Item | Reason |
|---|---|
| `apps/api/src/api/deprecated/` (entire folder) | No external importers. Self-contained dead module (battle sim v1, chat v1). |
| `apps/api/src/api/smartrotom/mine/types.ts` | File defined `RankingEntry` type with no `export` keyword and no importers. |
| `smogonChaosUrl` function in `smogon.config.ts` | Marked `@deprecated`, never imported anywhere. |
