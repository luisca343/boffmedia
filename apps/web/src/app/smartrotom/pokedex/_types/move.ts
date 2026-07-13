// Unused today (no consumer imports this file) — re-exported rather than hand-duplicated so it
// can't drift further. The previous hand copy had genuine drift: `Effect` was missing the wire's
// `type` field and invented a `drainPercent` that doesn't exist, and `Animation`/`AnimationEffect`
// invented an object shape for what the wire actually sends as `animations: string[]` (animation
// name tags, e.g. `"leapForward"` — see `apps/api/.../pokemon-move.entity.ts`'s `FullMove`).
export type { MoveEffect as Effect, MoveTargetingInfo as TargetingInfo, ZMove as Z, FullMove as Attack } from "@boffmedia/shared"
