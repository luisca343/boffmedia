# Battlesim Full Audit

> Generated: 2026-06-11
> Scope: All client (web) and server (api) code related to `/battlesim`

---

## 1. Client-Side File Inventory (apps/web/src/app/battlesim/)

### 1.1 Root-Level Files

| File | Exports | Purpose |
|------|---------|---------|
| `page.tsx` | `Page` (default) | Landing hub — links to play / pvp / showdown / replay |
| `types.ts` | `ScenePos`, `AnimationData`, `StartingPosition`, `AnimationProps`, `ReplayData` | Extends `Battle` with optional `winner`; animation positioning types |
| `test.css` | CSS classes `.hp-bar`, `.electric`, `.misty`... | Terrain/weather background styling + `@keyframes slideUp` |
| `TerasDex.ts` | `initTerasMod()`, `TerasDex` (promise) | Initializes custom "Teras" mod via `Dex.mod('teras', modData)` |

---

### 1.2 `_utils/` — Core Battle Engine (18 files)

| File | Exports | Imports (key) | Purpose |
|------|---------|---------------|---------|
| `AnimationRegistry.ts` | `AnimationContext`, `AnimationRegistry` class | `@pkmn/client`, `@pkmn/protocol`, `Scene`, `getEventHandler`... | Dispatches `beforeStateChange` / `afterStateChange` by arg type |
| `battle_animations.ts` | `BattleEffects` dictionary | — | Sprite effects: wisps, fireballs, rocks, leaves, etc. |
| `battle-animations-moves.ts` | `BattleOtherAnims`, `BattleMoveAnims` | `PokemonSprite`, `Scene`, `getImageSize`... | PS-style bounce/shake/slide animation functions |
| `battleActions.ts` | `turnAction`, `switchAction`, `moveAction`, `damageAction`, `healAction`, `missAction`, `faintAction`, `getPokemonIdentCode` | `@pkmn/client`, `@pkmn/protocol`, `Scene` | Action data builders |
| `BattleEventProcessor.ts` | `ProcessedBattleEvent`, `BattleEventProcessor` class | `@pkmn/client`, `@pkmn/protocol`, `@pkmn/view`, `Scene`, `AnimationRegistry` | Processes protocol lines: parses, formats HTML, runs state/anim callbacks |
| `BattleSession.ts` | `BattleSessionState`, `BattleSession` class | `@pkmn/client`, `@pkmn/data`, `@pkmn/sim`, `@pkmn/protocol`, `Scene`, `BattleEventProcessor` | Mutable battle session: addLine, initScene, makeChoice, forfeit, resume, reset |
| `BattleStateBuilder.ts` | `BattleStateResult`, `BattleStateBuilder` class | `@pkmn/client`, `@pkmn/data`, `@pkmn/sim`, `@pkmn/protocol`, `@pkmn/view` | Rebuilds battle state up to a target turn for replay seeking |
| `battleUtils.ts` | re-exports `countActions` | `./replayUtils` | Convenience barrel |
| `eventHandlers.ts` | `eventHandlers` record (29 handlers), `getEventHandler`, `noAnimEvents`, `getDefaultTimeout` | `@pkmn/protocol`, `./battleActions`, `./replayUtils` | Maps protocol event types to animation logic |
| `eventPayload.ts` | `EventPayload`, `getEventPayload` | `@pkmn/client`, `@pkmn/protocol` | Extracts structured payloads from protocol args |
| `PokemonSprite.ts` (scene) | `PokemonSprite` class | `@pkmn/protocol`, `./viewUtils`, `Scene` | DOM sprite animation: delay, playNextAnim, x/y positioning, hide/show |
| `replayUtils.ts` | `getRelativeIdent`, `getParticipantName`, `countActions` | — | POV translation, participant name extraction, log line counting |
| `sanitizeHtml.ts` | `sanitizeHtml(html)` | — | Strips `<script>` / `on*=` attributes |
| `Scene.ts` | `Scene` class | `@pkmn/client`, `./battle-animations-moves`, `./viewUtils`, `./SceneEffects` | Main field visualization: backgrounds, popups, animations, Pokemon elements |
| `SceneEffects.ts` | `SceneEffects` class | `battle_animations`, `battle-animations-moves`, `./viewUtils` | Floating text, weather/terrain/screen/hazard visuals |
| `ShowdownBaseSession.ts` | `ChatMessage`, `ShowdownBaseSession` (extends `BattleSession`) | `socket.io-client`, `@pkmn/protocol` | Showdown-specific session: handles chat, spectator count, requests |
| `toBSXMon.ts` | `toBSXMon`, `toBSXKeyMoves`, `requestPokemonToBSXMon`, `toBSXTicks`, `toTeamHP`; types `BSXKeyMove`, `BSXTickEv`, `TeamMemberHP` | `@pkmn/client`, `@pkmn/dex`, `@/components/boffmedia/primitives` | Bridge: `@pkmn` Pokemon → BSXMon shape |
| `viewUtils.ts` | `SCALE_WIDTH`, `getTargetWidth`, `ASPECT_RATIO`, `positionsP1/P2`, `getOffset`, `getImageSize`, `getScaleMultiplier`, `getStartingPosition`, `getCanvasWidth`, `getCanvasHeight` | `@pkmn/client` | Field position math; `getTargetWidth()` = 65% of screen |

---

### 1.3 `_hooks/` — React Hooks (8 files)

| File | Exports | Imports | Purpose |
|------|---------|---------|---------|
| `useBattleActions.tsx` | `useBattleActions(battle, scene, pov)` | `@pkmn/client`, `Scene`, `battleActions` | High-level action dispatchers (turn, damage, heal, move, switch, miss) |
| `useBattleFlow.tsx` | `useBattleFlow(battle, setBattle, ...)` | `@pkmn/client`, `@pkmn/data`, `@pkmn/sim`, `@pkmn/protocol`, `Scene`, `BattleEventProcessor`, `BattleStateBuilder` | Replay playback orchestrator — play/pause/seek, turn-by-turn state building, animation timing |
| `useBSXLayout.ts` | `BSXLayout`, `useBSXLayout(state)` | `@pkmn/client`, `@pkmn/protocol`, `toBSXMon` | Converts `BattleSessionState` → flat BSX display layout (ally, foe, moves, bench, ticks, timer, mechanics, turn text) |
| `useGameState.tsx` | `useBattleStore` (Zustand), `GameState`, `useGameState()` | Zustand, `@pkmn/client`, `@pkmn/data`, `@pkmn/sim`, `@pkmn/protocol`, `Scene`, `ReplayData`, `countActions` | Zustand store for replay gamestate |
| `useLiveBattle.tsx` | `useLiveBattle(roomId, side, options?)` | `socket.io-client`, `@pkmn/client`, `@pkmn/data`, `@pkmn/sim`, `@pkmn/protocol`, Zustand, `Scene`, `useBattleFlow` | Live battle via Socket.IO (global `window.__battlesim_socket`) |
| `useLiveBattleManager.tsx` | `useLiveBattleManager()` | `socket.io-client`, `@pkmn/protocol`, `BattleSession` | Multi-tab AI battle manager: createBattle, switchTab, closeTab, makeChoice, forfeit, initScene (global `window.__battlesim_socket`) |
| `usePvPMatchmaking.tsx` | `usePvPMatchmaking()` | `socket.io-client`, `BattleSession` | PvP queue/challenge system (global `window.__pvp_socket`) |
| `useShowdownBattle.tsx` | `useShowdownBattle(roomId?, options?)`, `getGlobalUsername()` | `socket.io-client`, `@pkmn/protocol`, `ShowdownBaseSession`, `AchievementService` | PS auth, lobby, challenges, battle rooms, chat, spectating, replay save (global `window.__showdown_socket`) |

---

### 1.4 `_components/` — Battle UI (20 files)

#### Core Components

| File | Exports | Purpose |
|------|---------|---------|
| `Avatar.tsx` | `Avatar({ side, pov })` | Trainer avatar (Minecraft skin / NPC / PS avatar) |
| `BattleCanvas.tsx` | `BattleCanvas` (forwardRef) | Main battle field: team preview, 3D field, PokemonElements, hazards, weather/terrain, BSXPlate overlays, choicePanel overlay, battle end screen |
| `BattleEndScreen.tsx` | `BattleEndScreen({ battle, pov, username, onRestart })` | Victory/defeat screen with stats, replay saving |
| `BattleLayout.tsx` | `BattleLayout({ children, header, rightPanel, switchBench, forcedSwitch, teamPreview, postBattle, ... })` | Generic layout wrapper for all 3 battle pages |
| `BattlePreview.tsx` | `EnhancedBattlePreview` (default) | Animated VS splash: trainer sprites, Pokemon, start button |
| `BattlePreviewAvatar.tsx` | `BattlePreviewAvatar({ side, pov, size })` | Avatar for preview overlay |
| `BattleSideBar.tsx` | `PlayerDataBar({ battle, side, pov })` | Sidebar player info + team listing |
| `Hazard.tsx` | `Hazard({ hazard, side })` | Renders Stealth Rock, Spikes, TSpikes, Sticky Web |
| `PokemonDetail.tsx` | `PokemonDetail({ pokemon, children, ... })` | Hover card: stats, abilities, moves, HP, types, boosts (uses HoverCard, Tabs, ScrollArea Radix primitives) |
| `PokemonElement.tsx` | `PokemonElement` (forwardRef) | Positioned wrapper around `PokemonDetail` + `PokemonImage` |
| `PokemonImage.tsx` | `PokemonImage({ id, pokemon, side, ... })` | Renders sprite with scaling, protect overlay, shiny |
| `PokemonSprite.tsx` | `PokemonSprite({ pokemon, scale })` | Small icon sprite for team displays |
| `PokemonStatus.tsx` | `PokemonStatus({ pokemon, className })` | Compact HP bar + types + status (legacy — replaced by BSXPlate) |
| `PokemonTeam.tsx` | `PokemonTeam({ side })` | Team lineup with PokemonDetail wrappers |
| `TurnTimer.tsx` | `TurnTimer({ p1, p2, activeSide })` | Turn/total timer bars (legacy — replaced by BSXRing) |

#### Choice Input Components (`ChoiceInput/`)

| File | Exports | Purpose |
|------|---------|---------|
| `ChoiceInput/ChoiceInput.tsx` | `ChoiceInput({ request, makeChoice, isWaiting, mechanicUsed })` | Main input: switches to MoveSelector/SwitchMenu/TeamPreview by request type; manages active mechanic (mega/z/dynamax/tera) |
| `ChoiceInput/ActionButtons.tsx` | `BattleMechanic`, `ActionButtons(...)` | Mega/z/dynamax/tera toggle buttons |
| `ChoiceInput/MoveSelector.tsx` | `MoveSelector(...)` | Grid of move buttons with PP, type, disabled states |
| `ChoiceInput/SwitchMenu.tsx` | `SwitchMenu(...)` | Pokemon switch selector with HP bars, status |
| `ChoiceInput/TeamPreview.tsx` | `TeamPreview(...)` | Team order preview + confirm |

---

### 1.5 Route Pages

| Route | File | Exports | Purpose |
|-------|------|---------|---------|
| `/battlesim/play` | `play/page.tsx` | `PlayPage` (default) | AI battle with tabbed sessions, 5 formats, BattleLayout + BSX |
| `/battlesim/pvp` | `pvp/page.tsx` | `PvPLobbyPage` | Matchmaking lobby with queue, challenges, 4 formats |
| `/battlesim/pvp/battle/[roomid]` | `pvp/battle/[roomid]/page.tsx` | `PvPBattlePage` | Live PvP with BSX, timer, forfeit, chat |
| `/battlesim/showdown` | `showdown/page.tsx` | `ShowdownLobbyPage` | PS lobby: login, formats, user list, challenges, chat |
| `/battlesim/showdown/battle/[roomid]` | `showdown/battle/[roomid]/page.tsx` | `ShowdownBattlePage` | Showdown battle with chat, spectator count, reconnect, replay save |
| `/battlesim/replay` | `replay/page.tsx` (Server) | `ReplayPage` (async) | Fetches hardcoded replay from AchievementService |
| `/battlesim/replay/[name]` | `replay/[name]/page.tsx` (Client) | `ReplayPage` | Fetches replay by ID from LigaService |

#### Replay Subcomponents

| File | Exports | Purpose |
|------|---------|---------|
| `replay/_components/Game.tsx` | `Game({ replayData })` | Main replay player: paste loader, play/pause/seek, turns, tick events, POV switch, simulated attack editing |
| `replay/_components/ReplayControls.tsx` | `ReplayControls(...)` | Toolbar: play/pause, prev/next turn, speed, POV, slider, log toggle, attack input |
| `replay/_components/ReplayControlsButton.tsx` | `ReplayControlsButton` (default) | Styled icon+label button |
| `replay/_components/ReplayErrorBoundary.tsx` | `ReplayErrorBoundary` (class) | Error boundary with fallback + retry |

---

### 1.6 `mods/teras/` — Custom "Teras" Game Mod (9 files)

| File | Content |
|------|---------|
| `index.ts` | Re-exports all sub-modules as `ModData` |
| `pokedex.ts` (11400 lines!) | Custom species: Kanto + Sakura/Omnitrix/Pesadilla/Volcanic/RamAlbun/Teras formes + Paldea-Combat/Blaze/Aqua + Gmax |
| `moves.ts` | Empty placeholder |
| `abilities.ts` | 1 custom ability: `Merequetengue` (+1 priority, bypass ability-filter) |
| `items.ts` | Empty placeholder |
| `formats.ts` | 1 format: `[Gen 9] VGC 2023 Reg D` (doubles, lvl 50, Walking Wake / Iron Leaves ban) |
| `formats-data.ts` | Tier assignments for `tinkaglaze` (Uber/OU), `punktricity` (Uber/OU) |
| `learnsets.ts` | Empty placeholder |
| `scripts.ts` | Empty placeholder |

---

## 2. Server-Side File Inventory (apps/api/src/)

### 2.1 Battlesimulator Module (11 files)

| File | Exports | Purpose |
|------|---------|---------|
| `battle/battle.module.ts` | `BattleModule` | Module: imports AchievementModule, registers controller/service/gateway/matchmaking |
| `battle/battle.controller.ts` | `BattleController` `@Controller('battlesimulator/battle')` | `GET /battlesimulator/battle` — simulates AI v AI Gen 9 Random Doubles; returns `{ winner, log, team1, team2 }` |
| `battle/battle.service.ts` | `BattleService` | In-memory room registry: createRoom, getRoom, removeRoom, setPlayerRoom, getActiveRoomCount |
| `battle/battle.room.ts` | `BattleRoom` class; types `BattleRoomStatus`, `BattleRoomMode`, `BattleRoomCallbacks`, `PlayerSpec`, `BattleEndResult`, `TimerConfig`, `TimerState` | Core simulation engine: creates streams, runs @pkmn/sim battle, handles readOmniscient/readP1/readP2, playerChoice, forfeit, timers |
| `battle/battle.gateway.ts` | `BattleGateway` `@WebSocketGateway('/battle')` | WebSocket: createBattle (AI), makeChoice, forfeit, spectate, joinQueue/leaveQueue, challengePlayer/acceptChallenge/rejectChallenge, reconnect, createPvPRoom, cleanupRoom |
| `battle/matchmaking.service.ts` | `MatchmakingService`; types `QueuedPlayer`, `MatchResult` | Per-format queues: joinQueue (auto-match or wait 60s), leaveQueue, getQueueSize |
| `showdown.gateway.ts` | `ShowdownGateway` `@WebSocketGateway('/showdown')` | Proxies to real PS server: connectToShowdown, sendToShowdown, login (via @pkmn/login Actions), auto-reconnect exponential backoff |
| `_utils/teams.ts` | `getRandomTeam(format?)` | Generates random team via `@pkmn/randoms` `TeamGenerators.getTeamGenerator(format)` |
| `battle/battle.service.spec.ts` | Unit test | Asserts service is defined |
| `battle/battle.room.spec.ts` | Integration-like test | End-to-end battle simulation with auto-play (35s timeout) |
| `battle/battle.controller.integration.spec.ts` | Integration test | SKIPPED — production bug (`this.logger` crash) + long runtime |

### 2.2 Achievement Module (14 files)

| File | Exports | Purpose |
|------|---------|---------|
| `achievement/achievement.module.ts` | `AchievementModule` | Module providing achievement/replay/battle-achievement services |
| `achievement/achievement.controller.ts` | `AchievementController` `@Controller('smartrotom/achievement')` | Endpoints: get-achievements, get-achievement-by-id, check-achievement, battle-achievement (process battle result), create-replay, create-user-replay, get-replay |
| `achievement/achievement.facade.service.ts` | `AchievementFacadeService` | Facade wrapping AchievementsService, ReplaysService, BattleAchievementService |
| `achievement/services/battle-achievement.service.ts` | `BattleAchievementService`; `BattleAchievementRequest` interface | Processes battle result: validates, checks achievement, requires victory, creates replay+user-replay+achievement record |
| `achievement/services/replays.service.ts` | `ReplaysService` | CRUD for replays and user-replay associations |
| `achievement/dto/battle-achievement.dto.ts` | `BattleAchievementDto`, `BattleAchievementResponse` | Input/response DTOs |
| `achievement/dto/create-replay-full.dto.ts` | `CreateReplayFullDto` | Internal replay creation DTO |
| `achievement/dto/replay.dto.ts` | `CreateReplayDto`, `CreateUserReplayDto`, `GetReplayDto`, responses | API input/output DTOs |
| `achievement/entities/replay.entity.ts` | `Replay`, `UserReplay` | Swagger entities |
| `achievement/entities/user-replay.entity.ts` | `UserReplayEntity` | Swagger entity |
| `achievement/repositories/replays.repository.ts` | `ReplaysRepository` | Drizzle: create/update/delete replays + user-replay operations |
| `achievement/repositories/achievements.repository.ts` | `AchievementsRepository` (partial) | Drizzle: find user achievements with joined replay data |
| `achievement/services/battle-achievement.service.spec.ts` | Test | Unit tests |
| `achievement/achievement.controller.integration.spec.ts` | Test | Integration tests |

### 2.3 Showdown Integration (SmartRotom — 4 files)

| File | Exports | Purpose |
|------|---------|---------|
| `pokemon/services/pokemon-showdown.service.ts` | `PokemonShowdownService` | Converts Pixelmon Teras data → PS-compatible `ShowdownPokemonData` (forms, abilities, stats, evolutions) |
| `pokemon/interfaces/showdown.interface.ts` | `ShowdownPokemon`, `ShowdownPokemonData` | Data shapes for PS-compatible Pokemon |
| `pokemon/utils/ShowdownHelper.ts` | `formStandardization`, `standardizeFormDisplayName`, `standardizeFormIdSegment` | Form name normalization (e.g., `paldean_combat` → `Paldea-Combat`) |
| `pokemon/services/pokemon-showdown.service.spec.ts` | Test | Unit tests |

### 2.4 Battle Teams (Wingull — 5 files)

| File | Exports | Purpose |
|------|---------|---------|
| `wingull/dto/battle-team.dto.ts` | `CreateBattleTeamDto`, `UpdateBattleTeamDto`, `BattleTeamSlotDto`, `BattleTeamResponseDto`, `BattleTeamDataResponseDto` | Input/output DTOs |
| `wingull/wingull.controller.ts` | `WingullController` | Battle team endpoints (proxied to Wingull external API) |
| `wingull/wingull.facade.service.ts` | `WingullFacadeService` | Battle team facade methods |
| `wingull/services/wingull-player.service.ts` | `WingullPlayerService` | Battle team CRUD methods |
| `wingull/repositories/wingull-player.repository.ts` | `WingullPlayerRepository` | Proxy to external Wingull API |

### 2.5 DB Schema (Drizzle)

| Table | Columns | Purpose |
|-------|---------|---------|
| `rotom_replays` | `id` (PK), `side1`, `side2`, `team1`, `team2`, `replay`, `winner`, `createdAt`, `updatedAt` | Stores battle replay data |
| `rotom_user_replays` | `uuid` (FK), `replayId` (FK), `side` | Many-to-many user↔replay links |

---

## 3. BSX/BS Primitives (apps/web/src/components/boffmedia/primitives/)

### 3.1 BSX (Battlesim V2) Components

| Component | Props | Purpose |
|-----------|-------|---------|
| `BSXPlate` | `{mon, slotTag?, foe?, ghost?, active?}` | Field Pokemon: sprite, HP bar, types, status, boosts, ghost damage preview |
| `BSXTick` | `{ev: BSXTickEv}` | Single log tick: turn header, system/action message with type bar, dmg badge, eff badge |
| `BSXScorePlate` | `{name, rating, av, team, right?}` | Player header: name, rank, avatar, team HP dots |
| `BSXKey` | `{move, hotkey?, target?, selected?, disabled?, onClick?, onHover?, onLeave?, tera?}` | Move button: name, type, PP bar, priority, effectiveness tag |
| `BSXOrderRail` | `{slots: BSXOrderSlot[]}` | Speed order: sorted chips with sprite, name, speed |
| `BSXRing` | `{sec, max?, size?}` | Circular countdown timer (SVG) |
| `BSXPlanChip` | `{tag, action?, onClear?, hint?}` | Planned action chip: move/switch with clear button |
| `BSXBenchChip` | `{mon, hotkey?, disabled?, reserved?, onClick?}` | Bench Pokemon: sprite, HP bar, types, status |
| `BSXTeraBtn` | `{type, armed?, used?, onToggle?, hotkey?}` | Terastallization button |
| `BSXSpark` | `{data, w?, h?}` | Mini sparkline chart |

### 3.2 BS (Battlesim V1) Components

| Component | Purpose |
|-----------|---------|
| `BSType` / `BSTypeRow` / `BSCat` | Type badges, type row, category indicator |
| `BSStatusChip` | Status condition badge |
| `BSBoost` | Stat boost badge |
| `BSTera` | Tera crystal diamond icon |
| `BSHpMeter` | Full HP meter panel |
| `BSPokeChip` | Circular avatar chip |
| `BSMonCard` | Pokemon detail card |
| `BSMove` | Move detail card |
| `BSTraySlot` | Team tray slot |
| `BSLogEvent` / `BSChatRow` | Log event + chat row |
| `BSTracker` | Team tracker row |
| `BSWinProb` | Win probability bar |
| `BSFieldCond` | Field condition badge |

### 3.3 Data Utilities

| Export | Source | Purpose |
|--------|--------|---------|
| `MOVESETS`, `MON_DATA`, `freshMon`, `calcRange`, `koLabel`, `speedOrder`, `BSXMon` | `bsx-data.ts` | Predefined mons, damage calc, speed sort |
| `aniF`, `aniB`, `TYPES`, `tyVar`, `CHART`, `effMult`, `effLabel`, `hpColor`, `STATUS_LABELS`, `BOOST_NAMES`, `CAT_LABELS` | `bs-data.ts` | Shared constants: type chart, status labels, sprite URLs |
| `Icon` | `icon.tsx` | 70+ named SVG icons |

---

## 4. Shared Types & DTOs

### 4.1 Server DTOs (class-validator + Swagger)

| DTO | Location | Fields |
|-----|----------|--------|
| `BattleAchievementDto` | `achievement/dto/battle-achievement.dto.ts` | `uuid`, `logro`, `name1`, `name2`, `team1`, `team2`, `replay`, `victoria` |
| `CreateReplayFullDto` | `achievement/dto/create-replay-full.dto.ts` | `side1`, `side2`, `team1`, `team2`, `replay`, `winner` |
| `CreateReplayDto` | `achievement/dto/replay.dto.ts` | `side1`, `side2`, `team1`, `team2`, `replay`, `winner` |
| `CreateBattleTeamDto` | `wingull/dto/battle-team.dto.ts` | `name`, `description?` |
| `UpdateBattleTeamDto` | `wingull/dto/battle-team.dto.ts` | `uuid`, `id`, `name?`, `description?`, `teamSlot`, `pokemon?` |

### 4.2 Shared Auto-Generated Types (`packages/shared/src/models/`)

| Type | Fields |
|------|--------|
| `BattleAchievementDto` | `uuid`, `logro`, `name1`, `name2`, `team1`, `team2`, `replay`, `victoria` |
| `BattleAchievementResponse` | `success`, `error?`, `replayId?` |
| `PokemonBattleStats` | `hp`, `attack`, `defense`, `specialAttack`, `specialDefense`, `speed` |
| `UserAchievement` | `id`, `name`, `description`, `icon`, `category`, `subcategory`, `battleId`, `team`, `replay`... |
| `Replay` | `id`, `side1`, `side2`, `team1`, `team2`, `replay`, `winner`, `date` |
| `CreateReplayDto` | `side1`, `side2`, `team1`, `team2`, `replay`, `winner` |
| `UpdateBattleTeamDto` | `uuid`, `id`, `name?`, `description?`, `teamSlot`, `pokemon?` |
| `TrainerDefeatMoneyDto` | `server?`, `uuid`, `money` |

### 4.3 Client-Side DTOs (apps/web/src/types/dto/)

| Interface | Fields |
|-----------|--------|
| `BattleTeam` | `id`, `name`, `description?`, `pokemon`, `isActive?`, `createdAt?`, `updatedAt?` |
| `BattleTeamSlot` | `teamId`, `position`, `pokemon` |
| `CreateBattleTeamRequest` | `name`, `description?` |
| `UpdateBattleTeamRequest` | `id`, `name?`, `description?`, `pokemon?` |
| `BattleTeamData` | `teams`, `maxTeams`, `activeTeamId?` |

---

## 5. External Dependencies

| Package | Used In | Purpose |
|---------|---------|---------|
| `@pkmn/client` | _utils, _hooks | Battle state machine (`Battle`, `BattleEvent`) |
| `@pkmn/protocol` | _utils, _hooks, server | Protocol line parsing |
| `@pkmn/view` | _utils, server | Log formatting (`LogFormatter`) |
| `@pkmn/dex` | toBSXMon, TerasDex | Pokemon/Move/Item/Ability dex data |
| `@pkmn/data` | BattleSession, BattleStateBuilder | `Generations` data access |
| `@pkmn/sim` | BattleSession, BattleStateBuilder, server | `Dex`, `BattleStreams`, `RandomPlayerAI`, `Teams`, `PRNG`, mods |
| `@pkmn/img` | _components, server | Sprites (`Sprites`, `Icons`, `GraphicsGen`) |
| `@pkmn/randoms` | server | `TeamGenerators.getTeamGenerator` |
| `@pkmn/login` | server | `Actions.login()` for PS auth |
| `socket.io-client` | _hooks | Real-time communication |
| `socket.io` (server) | `@nestjs/websockets` | WebSocket gateways |
| `zustand` | useGameState, useLiveBattle | State management |
| `lucide-react` | _components | Icons |

---

## 6. Call Graph / Data Flow

```
Player Action (UI)
  ├── play/page.tsx ───────────────────── useLiveBattleManager ── socket ── BattleGateway
  │     └── BattleCanvas ── BattleSession ── BattleEventProcessor ── Scene
  │     └── useBSXLayout ── toBSXMon ── BSXPlate / BSXTick / BSXKey / BSXRing / BSXBenchChip
  │
  ├── showdown/battle/[roomid] ─────────── useShowdownBattle ── socket ── ShowdownGateway → PS Server
  │     └── BattleCanvas ── ShowdownBaseSession ── BattleEventProcessor ── Scene
  │     └── useBSXLayout
  │
  ├── pvp/battle/[roomid] ──────────────── usePvPMatchmaking ── socket ── BattleGateway
  │     └── BattleCanvas ── BattleSession ── BattleEventProcessor ── Scene
  │     └── useBSXLayout
  │
  └── replay/[name] ───────────────────── AchievementService / LigaService
        └── Game ── useGameState ── useBattleFlow ── BattleStateBuilder + BattleEventProcessor ── Scene
              └── BattleCanvas + ReplayControls

Server Gateways:
  ├── BattleGateway (namespace /battle) ── BattleService ── BattleRoom ── @pkmn/sim streams
  │     └── MatchmakingService (queue)
  │     └── AchievementFacadeService (replay save)
  │
  ├── ShowdownGateway (namespace /showdown) ── ws → sim3.psim.us
  │
  └── BattleController (HTTP GET) ── @pkmn/sim (ai v ai, buggy)

Replay Persistence:
  BattleGateway ── AchievementFacadeService ── ReplaysService ── ReplaysRepository ── rotom_replays
  Showdown ─────── useShowdownBattle ── AchievementService.createReplay() ── AchievementController
```

---

## 7. Architecture Insights

### 7.1 Four Socket Singletons
- `window.__battlesim_socket` — AI battles (play page)
- `window.__pvp_socket` — PvP battles
- `window.__showdown_socket` — Showdown proxy
- All use global `window` properties to survive Fast Refresh

### 7.2 Dual State Patterns
- **Zustand stores** (`useBattleStore`, `useLiveBattleStore`) for reactive cross-component state
- **`BattleSession` class instances** (mutable, non-reactive by design) for battle engine state

### 7.3 Animation Layer
- `Scene` / `SceneEffects` / `PokemonSprite` (scene utility) manage DOM animations imperatively via CSS transitions + timeouts
- React components (`PokemonElement`, `BattleCanvas`) manage declarative layout
- Communicate via imperative refs and DOM element references

### 7.4 BSX Translation Layer
- `useBSXLayout` hook + `toBSXMon.ts` converts `@pkmn/client` internal Pokemon/state → `BSXMon`/`BSXTick` format
- Boffmedia primitives consume this format, keeping design system decoupled from @pkmn internals

### 7.5 Replay Architecture
- Replays fetched from `AchievementService` or `LigaService`
- `ReplayData` (log + metadata) fed to `Game` component
- `BattleEventProcessor` + `BattleStateBuilder` rebuild state per turn
- `useBattleFlow` orchestrates playback with animation/seek

### 7.6 The Teras Mod
- Partial mod extending `@pkmn/dex` with custom Pokemon forms (11400-line pokedex.ts)
- 1 custom ability (`Merequetengue`)
- 1 VGC format definition
- Moves/items/learnsets/scripts are placeholders

---

## 8. Known Issues

1. **`battle.controller.ts` crash bug** — `getPokemonTeam()` calls `this.logger.log` but `this` is `undefined` (plain function, not class method). Integration test is SKIPPED.

2. **Potential double registration** — `BattleModule` registers `BattleController`/`BattleService`/`BattleGateway`, but `AppModule` also separately registers `BattleController` and `BattleService` in providers/controllers. Could cause duplicate instances.

3. **`ShowdownGateway` orphan** — Registered as provider in `AppModule` but NOT part of `BattleModule` — lives at battlesimulator level outside module boundary.

4. **`PokemonStatus.tsx` and `TurnTimer.tsx`** — Legacy components replaced by `BSXPlate` and `BSXRing` respectively. `PokemonStatus.tsx` may still be importable but is no longer rendered in any page.


