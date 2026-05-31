# Battlesim Replay Architecture Audit

## Executive Summary

The `battlesim/replay` experience is built from a thin App Router entry point, a shared replay widget, and an imperative battle animation engine. The visible page at `apps/web/src/app/battlesim/replay/page.tsx` simply fetches one replay and renders `Game`, while the actual playback logic lives in `apps/web/src/app/battlesim/replay/_components/Game.tsx`, `apps/web/src/app/battlesim/_hooks/useGameState.tsx`, `apps/web/src/app/battlesim/_hooks/useBattleFlow.tsx`, and the `Scene`/`PokemonSprite` utilities.

The main architectural risk is that the current replay stack mixes data loading, state ownership, parsing, animation, and DOM mutation in the same execution path. The replay API contract also looks inconsistent: the web service calls a GET replay path, while the traced API controller exposes a POST replay endpoint. That mismatch should be treated as a blocking reliability issue before any larger refactor.

## Entry Points and Routing

Primary entry files:

- `apps/web/src/app/battlesim/replay/page.tsx`
- `apps/web/src/app/battlesim/replay/[name]/page.tsx`
- `apps/web/src/app/smartrotom/pasaporte/page.tsx`
- `apps/web/src/app/smartrotom/pasaporte/_components/BadgePage.tsx`
- `apps/web/src/app/smartrotom/liga/camaralucha/ver/[id]/page.tsx`

Observed routing flow:

- `/battlesim/replay` renders the static replay page.
- `/battlesim/replay/[name]` also mounts the shared `Game` component, but the `name` prop is not consumed by the engine.
- SmartRotom pages embed the same replay widget directly, which makes `Game` a shared replay viewer rather than a page-private component.

Notable routing issue:

- `apps/web/src/app/battlesim/replay/page2.tsx` is not a real App Router page because the filename is not `page.tsx`. It is legacy or prototype code rather than an active route.

## Dependency Tree

```mermaid
flowchart TD
  A[/battlesim/replay page.tsx/] --> B[Game]
  A2[/battlesim/replay/[name]/page.tsx/] --> B
  S1[/smartrotom/pasaporte/page.tsx/] --> B
  S2[/smartrotom/pasaporte/_components/BadgePage.tsx/] --> B
  S3[/smartrotom/liga/camaralucha/ver/[id]/page.tsx/] --> B

  B --> C[useGameState]
  B --> D[useBattleFlow]
  B --> E[ReplayControls]
  B --> F[BattleCanvas]
  B --> G[BattlePreview]
  B --> H[BattleEndScreen]

  D --> I[useBattleActions]
  I --> J[battleActions.ts]
  J --> K[Scene]
  K --> L[SceneEffects]
  K --> M[PokemonSprite]
  K --> N[BattleBackground]
  K --> O[battle-animations-moves]

  F --> P[PokemonElement]
  F --> Q[PokemonTeam]
  F --> R[PokemonStatus]
  P --> U[PokemonDetail]
  P --> V[PokemonImage]
  Q --> W[PokemonSprite]
  R --> W
  G --> X[BattlePreviewAvatar]

  C --> Y[Zustand battle store]
  C --> Z[useViewportWidth]
  E --> Z

  B --> AA[AchievementService.getReplay]
  AA --> AB[boffAPI rotomGET]
  AB --> AC[AchievementController]
  AC --> AD[AchievementFacadeService]
  AD --> AE[ReplaysService]
  AE --> AF[ReplaysRepository]
  AF --> AG[(Drizzle MySQL tables)]
```

## Data Flow

Replay data enters the system through the API layer or, in one fallback path, via a hardcoded external fetch inside `useGameState`.

Observed sources:

- `apps/web/src/services/api/smartrotom/achievementsService.ts`
- `apps/web/src/services/api/smartrotom/ligaService.ts`
- `apps/web/src/app/battlesim/_hooks/useGameState.tsx` fallback fetch
- `apps/api/src/api/smartrotom/achievement/repositories/replays.repository.ts`

Lifecycle summary:

1. A page requests replay data.
2. The client service wraps the HTTP request through `apps/web/src/services/boffAPI.ts`.
3. The API controller delegates to `AchievementFacadeService` and `ReplaysService`.
4. The repository queries MySQL via Drizzle and returns the replay row.
5. `Game` stores the payload in local state and passes the replay text to `useGameState`.
6. `useGameState` loads a `Battle`, counts turns, and prepares a `Scene` when the DOM is ready.
7. `useBattleFlow` parses battle log lines and drives playback.
8. `Scene` and its helpers mutate the battlefield DOM directly.

No WebSocket, Redux, session storage, or indexedDB usage was found in the replay path.

## Replay Engine Architecture

The engine is event-driven but imperative.

- `useGameState` owns raw replay text, turn counters, current action index, play state, POV, and the shared `Battle` instance.
- `useBattleFlow` reacts to `currentAction`, `isPlaying`, and turn-jump state changes to decide whether to step one action or rebuild the battle state for an arbitrary turn.
- `useBattleActions` maps replay log actions to animation helpers and POV-relative identifiers.
- `battleActions.ts` delegates to `Scene` and specialized animation functions.
- `Scene` composes `BattleBackground`, `SceneEffects`, and `PokemonSprite` and maintains a queue of in-flight animation promises.
- `PokemonSprite` and `SceneEffects` use DOM mutation and `setTimeout` to animate sprites and popups.

Important sequence:

1. The replay log is split into lines.
2. Each line is parsed with `Protocol.parseBattleLine`.
3. The battle object is updated with `battle.add(...)`.
4. The formatter builds HTML for the log panel.
5. A switch/move/damage/heal/faint action triggers scene mutation.
6. The next action is scheduled with a timeout based on scene acceleration.

## State Management Map

State sources:

- Local component state: `loadedReplayData`, `battleStarted`, pasted text in `ReplayLoader`, hover/preview state in `BattlePreview` and `PokemonDetail`.
- Global state: a module-level Zustand store in `useGameState` for the `Battle` instance.
- Derived state: preview visibility, turn counts, HP percentages, winner text, and Pokémon ordering by POV.
- Memoized state: effectively none.

Potential issues:

- A module-level Zustand store can leak state across mounts or between replay sessions.
- `useBattleFlow` depends on several values that are not all present in the effect dependency list, which increases the risk of stale closures.
- The current action and turn-jump model is split across multiple setters and can become inconsistent during rapid interactions.

## File-by-File Notes

### Web

- `apps/web/src/app/battlesim/replay/page.tsx` - page-level wrapper, hardcoded replay fetch.
- `apps/web/src/app/battlesim/replay/[name]/page.tsx` - dynamic route shell, but the route param is not used by the replay engine.
- `apps/web/src/app/battlesim/replay/_components/Game.tsx` - orchestrator and composition root.
- `apps/web/src/app/battlesim/replay/_components/ReplayControls.tsx` - playback controls and turn navigation.
- `apps/web/src/app/battlesim/replay/_components/ReplayControlsButton.tsx` - button wrapper.
- `apps/web/src/app/battlesim/replay/_components/BattleStateDebugger.tsx` - unused debugger helper.
- `apps/web/src/app/battlesim/_hooks/useGameState.tsx` - replay loading and local state.
- `apps/web/src/app/battlesim/_hooks/useBattleFlow.tsx` - playback sequencing.
- `apps/web/src/app/battlesim/_hooks/useBattleActions.tsx` - POV normalization and action dispatch.
- `apps/web/src/app/battlesim/_utils/battleActions.ts` - low-level animation adapters.
- `apps/web/src/app/battlesim/_utils/Scene.ts` - scene controller.
- `apps/web/src/app/battlesim/_utils/SceneEffects.ts` - popup and effect rendering.
- `apps/web/src/app/battlesim/_utils/PokemonSprite.ts` - sprite animation queue.
- `apps/web/src/app/battlesim/_utils/viewUtils.ts` - layout and scaling math.
- `apps/web/src/app/battlesim/_components/BattleCanvas.tsx` - battlefield renderer.
- `apps/web/src/app/battlesim/_components/PokemonDetail.tsx` - hover card and battle detail.
- `apps/web/src/app/battlesim/_components/PokemonImage.tsx` - sprite URL resolution and rendering.
- `apps/web/src/app/battlesim/_components/PokemonStatus.tsx` - HP/status display.
- `apps/web/src/app/battlesim/_components/BattlePreview.tsx` - start overlay.
- `apps/web/src/app/battlesim/_components/BattleEndScreen.tsx` - end-state overlay.
- `apps/web/src/app/battlesim/_components/BattlePreviewAvatar.tsx` - trainer/avatar rendering.
- `apps/web/src/app/battlesim/_components/Hazard.tsx` - entry hazard rendering.
- `apps/web/src/services/api/smartrotom/achievementsService.ts` - replay fetch client.
- `apps/web/src/services/api/smartrotom/ligaService.ts` - alternate replay client.
- `apps/web/src/services/boffAPI.ts` - HTTP transport wrapper.

### API

- `apps/api/src/api/smartrotom/achievement/achievement.controller.ts` - replay endpoints.
- `apps/api/src/api/smartrotom/achievement/achievement.facade.service.ts` - facade over achievements/replays.
- `apps/api/src/api/smartrotom/achievement/services/replays.service.ts` - validation and orchestration.
- `apps/api/src/api/smartrotom/achievement/repositories/replays.repository.ts` - Drizzle persistence.
- `apps/api/src/api/smartrotom/achievement/entities/replay.entity.ts` - replay DTO/entity shape.

## Performance Findings

1. Re-render pressure is high because playback state is spread across React state and the log array is rebuilt frequently.
2. Replay parsing is repeated on step changes instead of being precomputed once.
3. Viewport width is tracked in several consumers and can trigger redundant resize updates.
4. The scene layer uses `setTimeout` and promise chains without a visible cancellation story.
5. Some render paths still reach into `window` during render, which complicates SSR and tests.

## Security and Reliability Findings

1. `dangerouslySetInnerHTML` is used for battle log and message output.
2. The replay fetch contract appears mismatched between client and server.
3. `MutationObserver` setup in `useGameState` lacks explicit cleanup.
4. The replay loader path accepts raw user text with minimal validation.
5. Effect dependency coverage in `useBattleFlow` is incomplete for the values it reads.

## Technical Debt Findings

- Hardcoded replay IDs and URLs.
- Unused route and debugger files.
- Shared engine logic spread across page, hook, utility, and component layers.
- Imperative DOM animation without an explicit lifecycle boundary.
- Debug logging still present in production-facing files.

## Refactoring Recommendations

1. Normalize the replay data contract and remove hardcoded fetches.
2. Move replay parsing into a one-time preprocessing step that produces a structured action list.
3. Make battle state instance-scoped instead of module-scoped.
4. Add explicit lifecycle cleanup for observers, timers, and animation queues.
5. Split `Game` into loader, controller, and presentation layers.
6. Replace raw HTML rendering with structured or sanitized log output.
7. Delete or archive dead prototype files once their functionality is confirmed unused.
