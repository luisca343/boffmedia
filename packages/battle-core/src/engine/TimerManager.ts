/**
 * Turn clock for a battle.
 *
 * Disabled by default — `enabled: false` — because nothing in Boffmedia runs a
 * timed format yet. It is still the ONLY place in the engine allowed to own a
 * `setInterval`, which is what keeps a battle's outcome independent of how the
 * host schedules work.
 *
 * Two things were wrong before and are the reason this file was rewritten:
 *
 * 1. `totalRemaining` was only ever touched in `pauseTurn`, so `tick` compared
 *    it against zero every second while it never moved. A player who simply
 *    never answered burned their turn clock over and over and never ran out of
 *    total time — the total budget did not exist.
 *
 * 2. Expiry was derived from two independently recomputed counters. Now each
 *    running side has ONE deadline, fixed when its turn starts at
 *    `now + min(turnMs, totalRemaining)`, and `tick` only reports; the counters
 *    are display state derived from that same start instant, so they cannot
 *    disagree with the thing that actually fires.
 */

export interface TimerConfig {
  enabled: boolean;
  turnMs: number;
  totalMs: number;
}

export interface TimerState {
  p1: { turnRemaining: number; totalRemaining: number };
  p2: { turnRemaining: number; totalRemaining: number };
  activeSide: 'p1' | 'p2' | null;
}

export interface TimerManagerCallbacks {
  onUpdate: (state: TimerState) => void;
  onExpire: (side: 'p1' | 'p2') => void;
}

type Side = 'p1' | 'p2';

interface RunningTurn {
  startedAt: number;
  /** Absolute instant this side loses. Never recomputed while it runs. */
  deadline: number;
  /** `totalRemaining` at `startedAt`; `tick` subtracts elapsed from this. */
  totalAtStart: number;
}

const TICK_MS = 1000;

export class TimerManager {
  private config: TimerConfig;
  private state: TimerState;
  private running = new Map<Side, RunningTurn>();
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private callbacks: TimerManagerCallbacks;
  private readonly now: () => number;

  constructor(
    callbacks: TimerManagerCallbacks,
    config?: Partial<TimerConfig>,
    /** Injected so a test can drive the clock without waiting on one. */
    now: () => number = () => Date.now(),
  ) {
    this.callbacks = callbacks;
    this.now = now;
    this.config = {
      enabled: config?.enabled ?? false,
      turnMs: config?.turnMs ?? 60_000,
      totalMs: config?.totalMs ?? 300_000,
    };
    this.state = {
      p1: { turnRemaining: this.config.turnMs, totalRemaining: this.config.totalMs },
      p2: { turnRemaining: this.config.turnMs, totalRemaining: this.config.totalMs },
      activeSide: null,
    };
  }

  get enabled(): boolean {
    return this.config.enabled;
  }

  startTurn(side: Side): void {
    if (!this.config.enabled) return;
    // Already running: a second `|request|` for the same side (an updated
    // request after an undo) must not hand the player a fresh minute.
    if (this.running.has(side)) return;

    const started = this.now();
    const total = this.state[side].totalRemaining;
    this.state[side].turnRemaining = Math.min(this.config.turnMs, total);
    this.running.set(side, {
      startedAt: started,
      deadline: started + Math.min(this.config.turnMs, total),
      totalAtStart: total,
    });
    this.state.activeSide = side;
    if (!this.timerInterval) {
      this.timerInterval = setInterval(() => this.tick(), TICK_MS);
      (this.timerInterval as any)?.unref?.();
    }
  }

  pauseTurn(side: Side): void {
    if (!this.config.enabled) return;
    const turn = this.running.get(side);
    if (turn) {
      this.commit(side, turn, this.now());
      this.running.delete(side);
    }
    if (!this.running.size) {
      this.stopInterval();
      this.state.activeSide = null;
    } else {
      this.state.activeSide = [...this.running.keys()][0];
    }
  }

  stop(): void {
    this.stopInterval();
    this.running.clear();
    this.state.activeSide = null;
  }

  getState(): TimerState {
    return {
      p1: { ...this.state.p1 },
      p2: { ...this.state.p2 },
      activeSide: this.state.activeSide,
    };
  }

  /** Exposed so a test can advance the clock without a real second passing. */
  tick(): void {
    if (!this.running.size) return;
    const now = this.now();
    const expired: Side[] = [];

    for (const [side, turn] of this.running) {
      this.commit(side, turn, now);
      if (now >= turn.deadline) expired.push(side);
    }

    this.callbacks.onUpdate(this.getState());

    for (const side of expired) {
      this.running.delete(side);
      if (this.state.activeSide === side) this.state.activeSide = null;
    }
    if (!this.running.size) this.stopInterval();
    for (const side of expired) this.callbacks.onExpire(side);
  }

  /** Recomputes both counters from the turn's own start instant. */
  private commit(side: Side, turn: RunningTurn, now: number): void {
    const elapsed = Math.max(0, now - turn.startedAt);
    const player = this.state[side];
    player.turnRemaining = Math.max(0, this.config.turnMs - elapsed);
    player.totalRemaining = Math.max(0, turn.totalAtStart - elapsed);
  }

  private stopInterval(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}
