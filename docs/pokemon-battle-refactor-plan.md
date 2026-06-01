# Battle Simulator Refactor Plan

## Goal

Create a single authoritative battle event processing pipeline that is shared by:

- Live battles (WebSocket)
- Replay playback
- Future spectator modes
- AI/self-play modes

The objective is that changing the handling of an event (`move`, `switch`, `faint`, `-damage`, etc.) automatically affects every battle mode without requiring duplicate updates.

---

# Executive Summary

The current architecture is already close to a unified model, but there are several dangerous divergence points:

1. Replay and Live process events through different code paths.
2. Replay and Live execute operations in different orders.
3. Animation logic is mixed into protocol parsing logic.
4. Replay turn reconstruction bypasses the main processing pipeline.
5. Event handling logic is likely duplicated across switch statements.

The recommended solution is:

```text
LiveController
        \
         \
          > BattleQueueProcessor
         /
ReplayController

            ↓

     BattleEventProcessor
            ↓
    ┌───────┼────────┐
    ▼       ▼        ▼

 Battle   Logs   Animations
 State
```

Only delivery differs.

Processing becomes identical.

---

# Current Architecture Audit

## Shared Pipeline

Both systems ultimately perform:

```text
parseBattleLine()
      ↓
formatHTML()
      ↓
getParams()
      ↓
battle.add()
      ↓
updateBattleLog()
      ↓
performAction()
```

This is already a strong foundation.

---

# Critical Issue 1

## Different Execution Order

### Replay

```text
parse
formatHTML
getParams
battle.add
updateBattleLog
performAction
```

### Live

```text
parse
formatHTML
battle.add
getParams
updateBattleLog
performAction
```

This can produce state desynchronization.

If future animation code reads battle state, replay and live may see different data.

### Required Action

Choose one canonical order and use it everywhere.

Recommended:

```text
parse
formatHTML
battle.add
getParams
updateBattleLog
performAction
```

or

```text
parse
formatHTML
getParams
battle.add
updateBattleLog
performAction
```

Either is acceptable.

Consistency is mandatory.

---

# Critical Issue 2

## Two Different Event Processors

Currently:

Replay:

```ts
playAction(line)
```

Live:

```ts
async IIFE in useEffect
```

These represent the same responsibility.

### Required Action

Create:

```ts
class BattleEventProcessor
```

Primary API:

```ts
processLine(line: string): Promise<ProcessedBattleEvent>
```

Both replay and live must call this method.

No mode-specific event execution should remain.

---

# Critical Issue 3

## Parsing and Animation Logic Are Coupled

Current `getParams()` appears to:

- Parse payload data
- Trigger animations
- Play cries
- Show popups
- Clear elements

This creates excessive coupling.

### Required Action

Split responsibilities.

### Step 1

Create pure event extraction:

```ts
getEventPayload()
```

Returns:

```ts
{
  type,
  payload
}
```

### Step 2

Create animation execution layer:

```ts
AnimationRegistry
```

Example:

```ts
animationRegistry["switch"](payload);
animationRegistry["move"](payload);
animationRegistry["faint"](payload);
```

The parser should never execute animations directly.

---

# Critical Issue 4

## Scheduler Logic Should NOT Be Unified

Replay and Live have different scheduling requirements.

### Live

Driven by:

```text
Socket
 → Buffer
 → Process
```

### Replay

Driven by:

```text
Current Action
 → Timeout
 → Next Action
```

Keep these separate.

### Important Rule

Unify:

```text
Event execution
```

Do NOT unify:

```text
Event delivery
```

---

# Critical Issue 5

## Replay Reconstruction Bypasses Main Logic

Current replay turn reconstruction:

```ts
battle.add()
formatter.formatHTML()
```

is executed manually.

This risks drift from actual playback behavior.

### Required Action

Create:

```ts
BattleStateBuilder
```

Responsibilities:

```ts
buildStateUntilTurn(turn)
```

Only:

```ts
battle.add(line)
```

No:

- animations
- UI updates
- log rendering

State reconstruction must be pure.

---

# Critical Issue 6

## Event Handling Is Likely Distributed

Current architecture likely contains multiple:

```ts
switch(type)
```

blocks.

Examples:

```ts
switch
move
-damage
-heal
faint
```

Adding new protocol events becomes dangerous.

### Required Action

Create a registry.

Example:

```ts
const eventHandlers = {
  move: MoveHandler,
  switch: SwitchHandler,
  faint: FaintHandler,
  "-damage": DamageHandler,
  "-heal": HealHandler,
};
```

Each handler owns:

```ts
formatHTML()
createPayload()
performAnimation()
```

Adding:

```ts
-terastallize
```

should require registration in exactly one place.

---

# Recommended Target Architecture

```text
                    ┌─────────────────┐
Socket ────────────▶│ LiveController  │
                    └────────┬────────┘
                             │

Replay File ───────▶┌────────▼────────┐
                    │ ReplayController│
                    └────────┬────────┘
                             │
                             ▼

                    ┌─────────────────┐
                    │ BattleQueue     │
                    │ Processor       │
                    └────────┬────────┘
                             │
                             ▼

                    ┌─────────────────┐
                    │ EventProcessor  │
                    └────────┬────────┘
                             │
            ┌────────────────┼────────────────┐
            ▼                ▼                ▼

       Battle State      Battle Log     Animations
```

---

# Proposed Interfaces

## BattleEventProcessor

```ts
interface ProcessedBattleEvent {
  type: string;
  html: string;
  payload: unknown;
}
```

```ts
class BattleEventProcessor {
  async processLine(line: string): Promise<ProcessedBattleEvent>;
}
```

---

## BattleStateBuilder

```ts
class BattleStateBuilder {
  buildStateUntilTurn(turn: number): Battle;
}
```

---

## AnimationRegistry

```ts
interface AnimationHandler {
  execute(payload: unknown): Promise<void>;
}
```

```ts
animationRegistry[eventType].execute(payload);
```

---

# Migration Plan

## Phase 1

Extract shared logic from:

- replay playAction()
- live async IIFE

into:

```ts
BattleEventProcessor.processLine()
```

No behavior changes.

---

## Phase 2

Normalize operation order.

Replay and Live must execute identical steps.

---

## Phase 3

Move all animation side effects out of parsing.

Create AnimationRegistry.

---

## Phase 4

Create BattleStateBuilder.

Replace replay reconstruction logic.

---

## Phase 5

Replace event switch statements with registry-driven handlers.

---

## Phase 6

Add tests.

Required test categories:

### Replay vs Live Parity

For identical protocol logs:

- HTML output matches
- Battle state matches
- Event payloads match

### State Reconstruction

For every turn:

```ts
buildStateUntilTurn(turn)
```

must match actual battle state at that turn.

### Event Handler Tests

Each protocol event:

```text
move
switch
faint
-damage
-heal
turn
win
tie
```

must have dedicated tests.

---

# Expected Outcome

After implementation:

- One authoritative protocol implementation
- One authoritative animation implementation
- One authoritative event handler registry
- Replay and Live remain separate delivery systems
- Future features automatically inherit behavior changes

Changing:

```ts
MoveHandler.performAnimation()
```

or

```ts
DamageHandler.createPayload()
```

will affect every battle mode automatically.

This significantly reduces maintenance cost and eliminates replay/live behavioral drift.
