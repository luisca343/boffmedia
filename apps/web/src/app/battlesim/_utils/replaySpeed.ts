/**
 * Global replay playback speed multiplier.
 * Read at every animation sleep in useBattleFlow so changes apply immediately
 * without threading state through the (large) hook signature.
 */
let speed = 1;

export const REPLAY_SPEEDS = [0.5, 1, 2, 4] as const;

export function getReplaySpeed(): number {
  return speed;
}

export function setReplaySpeed(s: number): void {
  speed = s > 0 ? s : 1;
}
