import type { HeldItem, SpawnCondition, SpawnInfo as SharedSpawnInfo } from "@boffmedia/shared"

export type { HeldItem }

// Real drift, fixed here: the wire's `SpawnCondition` has no `maxY`/`minY` at all (only
// `times?`/`weathers?`/`stringBiomes`) — this type invented them, so `SpawnTable.tsx`'s height
// badge (`spawn.condition?.minY`) was always `undefined` and never rendered. The dead branch was
// removed there rather than kept pointed at data the API doesn't send.
export type Condition = SpawnCondition

export interface SpawnInfo extends SharedSpawnInfo {
  /** Computed client-side (`getSpriteUrl`), never sent by the API. */
  spriteUrl?: string
}

export interface Pokemon {
  id: string;
  spawnInfos: SpawnInfo[];
}

export interface SpawnInfos {
  id: string;
  spawnInfos: SpawnInfo[];
}
