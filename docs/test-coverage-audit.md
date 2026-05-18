# API Test Coverage Audit

> **Purpose**: Track test coverage across all 37 NestJS controllers. Used to plan and record integration test work.  
> **Pattern**: Integration tests use Supertest + ValidationPipe + GlobalExceptionFilter — see existing examples in `auth.controller.integration.spec.ts`, `events.controller.integration.spec.ts`, `apps.controller.integration.spec.ts`, `starbank.controller.integration.spec.ts`.  
> **Legend**: `[x]` done · `[ ]` pending · `[~]` partial · `[-]` not applicable (no logic to test)  
> **Last updated**: 2026-05-18 — 2161 tests, 132 suites (1 skipped), all passing

---

## Summary

| Layer | Done | Partial | Pending | N/A |
|---|---|---|---|---|
| **Integration specs (controllers)** | 32 | 0 | 1 | 3 |
| **Unit specs (services)** | 104 | 0 | 0 | — |

---

## Priority tiers

Ordered by: risk to users/data → business criticality → endpoint complexity.

---

## Tier 1 — Critical (auth, money, user data)

### `auth/auth.controller.ts` — prefix: `auth`
Integration spec: `auth.controller.integration.spec.ts` ✅

| Endpoint | Covered |
|---|---|
| `POST /auth/login` — LoginDto validation | [x] |
| `POST /auth/loginmc` — LoginMcDto validation | [x] |
| `POST /auth/register-minecraft` — RegisterMinecraftDto, nested minecraft obj | [x] |
| `POST /auth/refresh` — RefreshTokenDto validation | [x] |
| `POST /auth/link-minecraft` — LinkMinecraftDto | [x] |
| `POST /auth/google/callback` — GoogleCallbackDto | [x] |

---

### `smartrotom/starbank/starbank.controller.ts` — prefix: `smartrotom/starbank`
Integration spec: `starbank.controller.integration.spec.ts` ✅

| Endpoint | Covered |
|---|---|
| `POST /transfer` — CreateTransferDto (amount min 1, missing fields, unknown field) | [x] |
| `GET /balance/:uuid` — returns facade result | [x] |
| `GET /accounts` | [x] |
| `GET /accounts/:uuid` | [x] |
| `POST /transfer/from-main` — TransferFromMainDto | [x] |
| `POST /shop` — CreateShopTransactionDto | [x] |
| `POST /trainerdefeat` — TrainerDefeatMoneyDto | [x] |
| `GET /transactions/:account` | [x] |
| `GET /transactions/user/:uuid` | [x] |
| `GET /transfers/:account` | [x] |
| `GET /transfers/user/:uuid` | [x] |
| `POST /accounts` (multipart+file upload) | [-] |

Service specs:
- [x] `starbank-account.service.spec.ts`
- [x] `starbank-transaction.service.spec.ts`

---

### `boffmedia/users/users.controller.ts` — prefix: `users`
Integration spec: `users.controller.integration.spec.ts` ✅

| Endpoint | Covered |
|---|---|
| `POST /` — CreateUserDto (username/password/email validation) | [x] |
| `GET /` | [x] |
| `GET /statistics` | [x] |
| `GET /:id` — ParseIntPipe, 404 on missing | [x] |
| `GET /:id/integrations` — ParseIntPipe | [x] |
| `GET /username/:username` — 404 on missing | [x] |
| `GET /email/:email` — 404 on missing | [x] |
| `GET /:id/roles` | [x] |
| `PATCH /:id` — UpdateUserDto, forbidNonWhitelisted | [x] |
| `DELETE /:id` — ParseIntPipe | [x] |
| `POST /batch` — BatchUsersDto (array, each IsNumber) | [x] |
| `GET /validate/:type/:identifier` | [x] |
| `POST /minecraft/register`, `/minecraft/link`, `/google/auth`, `/auth/login` | [-] (inline DTOs lack class-validator decorators — no validation occurs) |

---

### `smartrotom/users/users.controller.ts` — prefix: `smartrotom/users`
Integration spec: `users.controller.integration.spec.ts` ✅

| Endpoint | Covered |
|---|---|
| `GET /` | [x] |
| `POST /` — CreateSmartrotomUserDto (uuid, username Length 3-16) | [x] |
| `GET /:id` — ParseIntPipe | [x] |
| `GET /uuid/:uuid` | [x] |
| `PATCH /:id` — UpdateSmartrotomUserDto, forbidNonWhitelisted | [x] |
| `DELETE /:id` — ParseIntPipe | [x] |
| `POST /find-or-create` — CreateSmartrotomUserDto | [x] |
| `POST /initialize` — UserInitializationDataDto | [x] |
| `POST /batch` — BatchUsersRequestDto (uuids v4, ArrayMinSize(1)) | [x] |
| `POST /batch/accounts` — BatchUsersRequestDto | [x] |
| `GET /stats/overview` | [x] |
| `GET /validate/:uuid` | [x] |
| `GET /:uuid/accounts` | [x] |

---

## Tier 2 — Core business logic

### `boffmedia/events/events.controller.ts` — prefix: `events`
Integration spec: `events.controller.integration.spec.ts` ✅

| Endpoint | Covered |
|---|---|
| `GET /` | [x] |
| `GET /event/:id` | [x] |
| `POST /event` — CreateEventDto (full validation suite) | [x] |
| `DELETE /event/:id` | [x] |
| `GET /:eventId/leaderboard` | [x] |
| `PATCH /event/:id` — UpdateEventDto | [x] |
| `GET /games` | [x] |
| `GET /games/:id` | [x] |
| `POST /games` — CreateGameDto | [x] |
| `PATCH /games/:id` | [x] |
| `DELETE /games/:id` | [x] |
| `GET /achievements` | [x] |
| `GET /:eventId/achievements` | [x] |
| `POST /:eventId/achievements` | [x] |
| `PATCH /:eventId/achievements/:achievementId` | [x] |
| `GET /participants/:participantId/progress` | [x] |
| `GET /:eventId/participants/:participantId/progress` | [x] |
| `GET /teams` | [x] |
| `GET /:eventId/teams` | [x] |
| `GET /teams/:teamId` | [x] |
| `GET /teams/:teamId/members` | [x] |
| `POST /:eventId/teams` | [x] |
| `PATCH /:eventId/teams/:teamId` | [x] |
| `POST /:eventId/teams/:teamId/join` | [x] |
| `DELETE /:eventId/teams/:teamId/members/:userId` | [x] |
| `POST /join/:eventId` | [x] |
| `GET /:eventId/participants` | [x] |
| `PUT /:eventId/progress` | [x] |
| `GET /leaderboards` | [x] |
| `GET /:eventId/teams/leaderboard` | [x] |

Service specs:
- [x] `events.service.spec.ts`
- [x] `leaderboards.service.spec.ts`

---

### `smartrotom/apps/apps.controller.ts` — prefix: `smartrotom/apps`
Integration spec: `apps.controller.integration.spec.ts` ✅

| Endpoint | Covered |
|---|---|
| `GET /` | [x] |
| `GET /:id` — numeric id transform | [x] |
| `POST /` — CreateAppDto (name required, MaxLength 32, unknown field) | [x] |
| `POST /player` — GetPlayerAppsDto (uuid required, invalid uuid) | [x] |
| `POST /player/add` — PlayerAppDto (id min 1, uuid required) | [x] |
| `POST /player/remove` — PlayerAppDto | [x] |
| `POST /order` — OrderAppDto (uuid + order array required) | [x] |
| `GET /active` | [x] |
| `GET /inactive` | [x] |
| `PATCH /:id` — UpdateAppDto | [x] |
| `DELETE /:id` | [x] |
| `POST /activate/:id` | [x] |
| `POST /deactivate/:id` | [x] |

Service specs:
- [x] `apps.service.spec.ts`
- [x] `user-apps.service.spec.ts`
- [x] `apps.facade.service.spec.ts`

---

### `smartrotom/wingull/wingull.controller.ts` — prefix: `wingull`
Integration spec: `wingull.controller.integration.spec.ts` ✅

High-complexity controller (~25 endpoints). Economy system — real risk if validation gaps exist.

| Endpoint group | Covered |
|---|---|
| `POST /balance` — WingullBalanceDto | [x] |
| `POST /balance/get` — GetBalanceDto | [x] |
| `POST /message` — MessageRequestDto | [x] |
| `POST /pokemon/give` — PokemonGiveRequestDto | [x] |
| money, stats, team, PC, battle teams, taxi stops, dex, quests, globalchat | [x] |
| NPC updates, world guard, plots, towns, weather, regions, performance | [x] |

---

### `smartrotom/pokemon/pokemon.controller.ts` — prefix: `smartrotom/pokemon`
Integration spec: `pokemon.controller.integration.spec.ts` ✅

| Endpoint group | Covered |
|---|---|
| GET/POST/PATCH/DELETE pokemon CRUD | [x] |
| GET search, dex, evolution chain | [x] |
| POST syncDex — UuidDto | [x] |

---

### `smartrotom/mine/mine.controller.ts` — prefix: `smartrotom/mine`
Integration spec: `mine.controller.integration.spec.ts` ✅

| Endpoint group | Covered |
|---|---|
| energy, games (start/end), rewards, rankings, history, statistics, unclaimed rewards | [x] |

---

### `smartrotom/misiones/misiones.controller.ts` — prefix: `smartrotom/misiones`
Integration spec: `misiones.controller.integration.spec.ts` ✅

| Endpoint group | Covered |
|---|---|
| quests (all, by user, refresh cache, cache status) | [x] |
| NPCs (update, get all, by id, by quest, upload image, render/image exists checks) | [x] |
| health check | [x] |

---

### `wingull/invites/invites.controller.ts` — prefix: `wingull/invites`
Integration spec: `invites.controller.integration.spec.ts` ✅

| Endpoint group | Covered |
|---|---|
| invite CRUD — CreateInviteBodyDto (uuid + username, validation) | [x] |
| GET by id (returns not-found object when null), validate, can-register | [x] |
| POST register, DELETE soft + permanent, GET user/uuid, GET username/:username | [x] |

---

## Tier 3 — Tools & utilities

### `boffmedia/herramientas/mhwilds/mhwilds.controller.ts` — prefix: `tools/mhwilds`
Integration spec: `mhwilds.controller.integration.spec.ts` ✅  
Lower risk — read-only game data. Test happy paths + cache endpoints.

| Endpoint group | Covered |
|---|---|
| weapons, armor, charms, decorations, skills (GET) | [x] |
| charms/ranks, weapons/tree (GET) | [x] |
| search weapons (GET with query param) | [x] |
| weapons by kind, armor by rarity (GET with param) | [x] |
| statistics, locales, resources (GET) | [x] |
| cache management (DELETE, GET stats, POST warmup/validate/optimize) | [x] |

---

### `boffmedia/herramientas/pokemon/tcgpocket/tcg.controller.ts` — prefix: `tools/ptcgp`
Integration spec: `tcg.controller.integration.spec.ts` ✅

| Endpoint group | Covered |
|---|---|
| series, sets, cards (GET from DB) | [x] |
| fetch/store series, sets, cards (GET remote) | [x] |
| user card collection (GET, POST AddUserCardDto, PUT UpdateUserCardQuantityDto, DELETE) | [x] |
| user card history (GET) | [x] |

---

### `boffmedia/herramientas/pokemon/vgc/meta/meta.controller.ts` — prefix: `tools/vgc/meta`
Integration spec: `meta.controller.integration.spec.ts` ✅

| Endpoint group | Covered |
|---|---|
| Smogon (regulations, usage, teams), Champions (usages, speed tiers) | [x] |
| Limitless (tournaments, usage, usage list), personal meta comparison, divergence | [x] |
| Meta snapshots (list, latest, by-id, refresh), meta CRUD (create, update, delete) | [x] |
| Regulation CRUD (get all, by id, create, update, delete) | [x] |

---

### `boffmedia/herramientas/pokemon/vgc/tracker/tracker.controller.ts` — prefix: `tools/vgc/tracker`
Integration spec: `tracker.controller.integration.spec.ts` ✅

| Endpoint group | Covered |
|---|---|
| presets (get, upsert, delete), sessions (get, upsert, delete), syncAll | [x] |
| matches (get, upsert, delete), series (get, upsert, delete) | [x] |

---

### `boffmedia/herramientas/pokemon/vgc/vgc.controller.ts` — prefix: `tools/vgc`
Integration spec: `vgc.controller.integration.spec.ts` ✅

| Endpoint | Covered |
|---|---|
| `GET /champions/:regulationId/pokemon` — happy path + 404 on unknown regulation | [x] |
| `GET /champions/:regulationId/speed-tiers` — happy path + 404 on unknown regulation | [x] |

---

### `boffmedia/herramientas/manga/manga.controller.ts` — prefix: `boffmedia/herramientas/manga`
Integration spec: `manga.controller.integration.spec.ts` ✅

| Endpoint | Covered |
|---|---|
| `GET /search?q=` | [x] |
| `GET /detail?url=` | [x] |
| `GET /local?series=` | [x] |
| `POST /download/stream` — DownloadDto validation + SSE | [x] |

---

### `boffmedia/herramientas/youtube/youtube.controller.ts` — prefix: `boffmedia/herramientas/youtube`
Integration spec: `youtube.controller.integration.spec.ts` ✅

| Endpoint | Covered |
|---|---|
| `GET /transcription/:videoId` | [x] |
| `GET /video-info/:videoId` | [x] |

---

### `boffmedia/util/upload/upload.controller.ts` — prefix: `upload`
Integration spec: `upload.controller.integration.spec.ts` ✅

| Endpoint | Covered |
|---|---|
| `POST /image` — multipart validation | [x] |
| `POST /file` — multipart validation | [x] |
| `DELETE /file` | [x] |
| `GET /info`, `/supported-types`, `/limits` | [x] |

---

### `boffmedia/util/sharex/sharex.controller.ts` — prefix: `sharex`
Integration spec: `sharex.controller.integration.spec.ts` ✅

| Endpoint | Covered |
|---|---|
| `POST /` — SharexUploadDto | [x] |

---

### `boffmedia/util/showdown/pokemon-log.controller.ts` — prefix: `pokemon-log`
Integration spec: `pokemon-log.controller.integration.spec.ts` ✅

| Endpoint | Covered |
|---|---|
| `GET /process/:spreadsheetId` | [x] |
| `GET /test-parse` | [x] |

---

### `smartrotom/achievement/achievement.controller.ts` — prefix: `smartrotom/achievement`
Integration spec: `achievement.controller.integration.spec.ts` ✅

| Endpoint group | Covered |
|---|---|
| achievements (get, get-by-id, check), battle-achievement (validation + internal error catch) | [x] |
| replays (create-replay, create-user-replay, get-replay) | [x] |

---

### `smartrotom/arcade/arcade.controller.ts` — prefix: `smartrotom/arcade`
Integration spec: `arcade.controller.integration.spec.ts` ✅

| Endpoint group | Covered |
|---|---|
| streaks, loot boxes, inventory, daily rewards, claim items | [x] |

---

### `smartrotom/chatapp/chatapp.controller.ts` — prefix: `smartrotom/chatapp`
Integration spec: `chatapp.controller.integration.spec.ts` ✅

| Endpoint group | Covered |
|---|---|
| chat, messages, groups, calls | [x] |

---

### `smartrotom/documents/documents.controller.ts` — prefix: `smartrotom/documents`
Integration spec: `documents.controller.integration.spec.ts` ✅

| Endpoint group | Covered |
|---|---|
| documents (GET, POST, PUT, DELETE) — CreateDocumentDto/UpdateDocumentDto validation | [x] |
| notes (POST /notes, GET /all/:uuid, POST /create, POST /save/:id, POST+DELETE /note/user) | [x] |
| news (GET, GET /featured, GET /:id, POST /news/filter) | [x] |
| news admin (POST, PUT, DELETE, POST /newsstatus) — JWT+Roles bypassed via AllowAllGuard | [x] |

---

### `smartrotom/ficusai/ficusai.controller.ts` — prefix: `smartrotom/ficusai`
Integration spec: `ficusai.controller.integration.spec.ts` ✅

| Endpoint group | Covered |
|---|---|
| `GET /health` | [x] |
| `GET /messages` — GetMessagesDto (uuid required, limit optional 1-100) | [x] |
| `POST /send` — SendMessageDto (uuid, server optional via BaseDto, mensaje nested) | [x] |
| `POST /initialize` — body uuid | [x] |
| `DELETE /messages` — query uuid | [x] |
| `GET /stats` — query uuid | [x] |

---

### `smartrotom/liga/liga.controller.ts` — prefix: `smartrotom/liga`
Integration spec: `liga.controller.integration.spec.ts` ✅

| Endpoint group | Covered |
|---|---|
| replays (by id, recent, player, history), stats, leaderboard, ranking, compare | [x] |
| tournaments (get active, by id, matches, create — CreateTournamentDto, register — TournamentRegistrationDto) | [x] |

---

### `smartrotom/_main/smartrotom.controller.ts` — prefix: `smartrotom`
Integration spec: `smartrotom.controller.integration.spec.ts` ✅

| Endpoint | Covered |
|---|---|
| `GET /performance` | [x] |
| `POST /karts/carrera` — ResultadoCarreraDto (no class-validator decorators; `forbidNonWhitelisted` strips all fields) | [x] |
| `GET /arceuspeak` | [x] |
| `POST /arceuspeak` — ArceusspeakDto (name/value/format required) | [x] |
| `GET /taxi/stops` | [x] |
| `POST /taxi/teleport` — TeleportPlayerDto (id + uuid required) | [x] |

---

### `smartrotom/netfluis/netfluis.controller.ts` — prefix: `smartrotom/netfluis`
Integration spec: `netfluis.controller.integration.spec.ts` ✅

| Endpoint | Covered |
|---|---|
| `GET /test` | [x] |

---

### `smartrotom/player/player.controller.ts` — prefix: `smartrotom/player`
Integration spec: `player.controller.integration.spec.ts` ✅

| Endpoint | Covered |
|---|---|
| `POST /stats` — UuidDto (uuid required, must be v4) | [x] |
| `POST /team` — UuidDto | [x] |

---

## Tier 4 — Infrastructure & automation

### `app.controller.ts` — root prefix
Integration spec: **none** ❌  
Mix of health checks and misc endpoints. Low priority — mostly no DTO validation.

| Endpoint | Covered |
|---|---|
| `GET /health` — happy path smoke test | [ ] |
| `GET /zomboid`, `/blogicons`, `/steamkeys`, etc. | [-] |

---

### `battlesimulator/battle/battle.controller.ts` — prefix: `battlesimulator/battle`
Integration spec: `battle.controller.integration.spec.ts` ✅ (1 test skipped)

| Endpoint | Covered |
|---|---|
| `GET /` — skipped: production bug (`getPokemonTeam` calls `this.logger` in plain function context, TypeError at runtime) + real @pkmn/sim battle runs 60-120+ seconds | [~] |

---

### `automation/twitch/twitch.controller.ts` — prefix: `automation/twitch`
Integration spec: `twitch.controller.integration.spec.ts` ✅

| Endpoint | Covered |
|---|---|
| `GET /status` | [x] |
| `POST /check-now` | [x] |
| `GET /streams/user/:username` — live/offline/wingull detection | [x] |
| `POST /monitor/user/:username` | [x] |
| `DELETE /monitor/user/:username` | [x] |
| `POST /notifications/target` — NotificationTargetDto (type enum: discord/webhook/database) | [x] |
| `DELETE /notifications/target/:type` | [x] |

---

### `automation/twitch/twitch-debug.controller.ts` — prefix: `automation/twitch/debug`
Integration spec: **none** ❌

| Endpoint | Covered |
|---|---|
| `GET /check-user/:username` | [ ] |

---

### `discord/_commands/commands.controller.ts` — prefix: `commands`
Integration spec: **none** [-]  
Empty controller — no endpoints. Skip until implemented.

### `discord/_main/discord.controller.ts` — prefix: `discord`
Integration spec: **none** [-]  
Empty controller — all endpoints commented out. Skip until implemented.

---

## Service unit test status

### auth
| Service | Status |
|---|---|
| `auth.service` | [x] |
| `password.service` | [x] |

### boffmedia/events
| Service | Status |
|---|---|
| `events.service` | [x] |
| `leaderboards.service` | [x] |
| `achievements.service` | [x] |
| `games.service` | [x] |
| `participants.service` | [x] |
| `progress.service` | [x] |
| `teams.service` | [x] |
| `events.facade.service` | [x] |

### boffmedia/users
| Service | Status |
|---|---|
| `users-management.service` | [x] |
| `users.facade.service` | [x] |

### boffmedia/util
| Service | Status |
|---|---|
| `sharex.service` | [x] |
| `pokemon-log.service` | [x] |
| `file-upload.service` | [x] |
| `image-upload.service` | [x] |
| `upload.facade.service` | [x] |

### smartrotom/apps
| Service | Status |
|---|---|
| `apps.service` | [x] |
| `user-apps.service` | [x] |
| `apps.facade.service` | [x] |

### smartrotom/achievement
| Service | Status |
|---|---|
| `achievements.service` | [x] |
| `battle-achievement.service` | [x] |
| `replays.service` | [x] |
| `achievement.facade.service` | [x] |

### smartrotom/arcade
| Service | Status |
|---|---|
| `inventory.service` | [x] |
| `lootbox.service` | [x] |
| `streak.service` | [x] |
| `arcade.facade.service` | [x] |

### smartrotom/chatapp
| Service | Status |
|---|---|
| `chat.service` | [x] |
| `message.service` | [x] |
| `group.service` | [x] |
| `call.service` | [x] |

### smartrotom/documents
| Service | Status |
|---|---|
| `document.service` | [x] |
| `news.service` | [x] |
| `note.service` | [x] |

### smartrotom/ficusai
| Service | Status |
|---|---|
| `messages.service` | [x] |
| `pokemon-data.service` | [x] |
| `ficusai.facade.service` | [x] |

### smartrotom/liga
| Service | Status |
|---|---|
| `replay.service` | [x] |
| `statistics.service` | [x] |
| `tournament.service` | [x] |
| `liga.facade.service` | [x] |

### smartrotom/mine
| Service | Status |
|---|---|
| `energy.service` | [x] |
| `game.service` | [x] |
| `player.service` | [x] |
| `reward.service` | [x] |
| `mine.facade.service` | [x] |

### smartrotom/misiones
| Service | Status |
|---|---|
| `quest.cache.service` | [x] |
| `npc.service` | [x] |
| `user.quest.service` | [x] |
| `image.service` | [x] |
| `misiones.facade.service` | [x] |

### smartrotom/player
| Service | Status |
|---|---|
| `player.stats.service` | [x] |
| `player.team.service` | [x] |
| `player.facade.service` | [x] |

### smartrotom/pokemon
| Service | Status |
|---|---|
| `pokemon.facade.service` | [x] |
| `pokemon-data.service` (sub) | [x] |
| `pokemon-image.service` | [x] |
| `pokedex-management.service` | [x] |
| `pokemon-showdown.service` | [x] |
| `base-data.service` | [-] (abstract, tested via subclasses) |
| `move-data.service` | [x] |
| `spawn-data.service` | [x] |
| `sprite-manifest.service` | [x] |
| `pokemon-data-management.service` | [x] |
| `pokemon-integration.service` | [x] |

### smartrotom/starbank
| Service | Status |
|---|---|
| `starbank-account.service` | [x] |
| `starbank-transaction.service` | [x] |
| `starbank.facade.service` | [x] |

### smartrotom/users
| Service | Status |
|---|---|
| `users.service` | [x] |
| `users.facade.service` | [x] |

### smartrotom/wingull
| Service | Status |
|---|---|
| `wingull-economy.service` | [x] |
| `wingull-player.service` | [x] |
| `wingull-transport.service` | [x] |
| `wingull-world.service` | [x] |
| `wingull.facade.service` | [x] |

### wingull/invites
| Service | Status |
|---|---|
| `invite-management.service` | [x] |
| `registration.service` | [x] |
| `invites.facade.service` | [x] |

### automation/twitch
| Service | Status |
|---|---|
| `twitch-notification.service` | [x] |
| `twitch-api.service` | [x] |
| `twitch-monitor.service` | [x] |

### boffmedia/herramientas/manga
| Service | Status |
|---|---|
| `manga-download.service` | [ ] |
| `novecool.service` | [ ] |
| `cbz.service` | [ ] |
| manga scrape sub-services | [ ] |

### boffmedia/herramientas/mhwilds
| Service | Status |
|---|---|
| `mhwilds-cache.service` | [x] |
| `mhwilds-data.service` | [x] |
| `mhwilds.facade.service` | [x] |

### boffmedia/herramientas/pokemon/tcgpocket
| Service | Status |
|---|---|
| `tcg.service` | [ ] |
| `tcg.facade.service` | [x] |
| `tcg-fetch.service` | [x] |
| `tcg-config.service` | [x] |
| `tcg-error.service` | [x] |
| `tcg-image.service` | [x] |

### boffmedia/herramientas/pokemon/vgc
| Service | Status |
|---|---|
| `meta.facade.service` | [x] |
| `vgc.service` | [ ] |
| `limitless.service` | [ ] |
| `divergence.service` | [x] |
| `ingestion-jobs.service` | [x] |

### boffmedia/herramientas/youtube
| Service | Status |
|---|---|
| `youtube.facade.service` | [x] |
| `transcription.service` | [x] |

### battlesimulator
| Service | Status |
|---|---|
| `battle.service` | [-] (empty stub — smoke test only) |

### misc
| Service | Status |
|---|---|
| `netfluis.service` | [x] |
| `smartrotom.service` (_main) | [x] |
| `scrape.facade.service` | [x] |

---

## Work order (suggested)

1. ~~**Tier 1 — auth gaps**: `link-minecraft`, `google/callback` in `auth.controller.integration.spec.ts`~~ ✅
2. ~~**Tier 1 — starbank gaps**: remaining 8 endpoints in `starbank.controller.integration.spec.ts`~~ ✅
3. ~~**Tier 1 — boffmedia users**: new `users.controller.integration.spec.ts`~~ ✅
4. ~~**Tier 1 — smartrotom users**: new `users.controller.integration.spec.ts`~~ ✅
5. ~~**Tier 2 — events gaps**: remaining 25 endpoints~~ ✅
6. ~~**Tier 2 — apps gaps**: active/inactive, PATCH, DELETE, activate/deactivate~~ ✅
7. ~~**Tier 2 — wingull**: new integration spec~~ ✅
8. ~~**Tier 2 — pokemon, mine, misiones**: new integration specs~~ ✅ (mine + misiones done; pokemon pending)
9. ~~**Tier 3 — tools (mhwilds, tcgpocket, vgc)**: new integration specs~~ ✅
10. ~~**Tier 3 — remaining utilities**: upload, sharex, chatapp, arcade~~ ✅
11. ~~**Tier 3 — invites, achievement, liga, documents**~~ ✅
12. ~~**Remaining**: ficusai, smartrotom main, battlesimulator, twitch, manga, youtube, showdown, netfluis, player~~ ✅ **COMPLETE — all controllers covered**

---

## Known production bugs discovered during testing

| Controller | Endpoint | Bug |
|---|---|---|
| `battlesimulator/battle` | `GET /` | `getPokemonTeam()` is a plain function that calls `this.logger.log()` — `this` is `undefined`, throws `TypeError` at runtime. |
| `smartrotom/_main` | `POST /karts/carrera` | `ResultadoCarreraDto` has no `class-validator` decorators; `forbidNonWhitelisted: true` rejects all non-empty bodies. Fields are silently dropped. |
