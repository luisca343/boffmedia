/**
 * Timer state machine for battle turns.
 *
 * Lifts the timer logic from apps/api's BattleRoom, tracking elapsed time per
 * side and invoking callbacks on update or expiration. No Nest, no logger.
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

export class TimerManager {
  private config: TimerConfig;
  private state: TimerState;
  private turnStartTimes: Map<'p1' | 'p2', number> = new Map();
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private callbacks: TimerManagerCallbacks;

  constructor(callbacks: TimerManagerCallbacks, config?: Partial<TimerConfig>) {
    this.callbacks = callbacks;
    this.config = {
      enabled: config?.enabled ?? false,
      turnMs: config?.turnMs ?? 60_000,
      totalMs: config?.totalMs ?? 300_000,
    };
    this.state = {
      p1: {
        turnRemaining: this.config.turnMs,
        totalRemaining: this.config.totalMs,
      },
      p2: {
        turnRemaining: this.config.turnMs,
        totalRemaining: this.config.totalMs,
      },
      activeSide: null,
    };
  }

  startTurn(side: 'p1' | 'p2'): void {
    if (!this.config.enabled) return;
    this.turnStartTimes.set(side, Date.now());
    this.state.activeSide = side;
    if (!this.timerInterval) {
      this.timerInterval = setInterval(() => this.tick(), 1000);
    }
  }

  pauseTurn(side: 'p1' | 'p2'): void {
    if (!this.config.enabled) return;
    const startTime = this.turnStartTimes.get(side);
    if (startTime) {
      const elapsed = Date.now() - startTime;
      const player = this.state[side];
      player.turnRemaining = Math.max(0, this.config.turnMs - elapsed);
      player.totalRemaining = Math.max(0, player.totalRemaining - elapsed);
      this.turnStartTimes.delete(side);
    }
    if (this.turnStartTimes.size === 0) {
      this.stop();
      this.state.activeSide = null;
    }
  }

  stop(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.turnStartTimes.clear();
  }

  getState(): TimerState {
    return { ...this.state };
  }

  private tick(): void {
    const now = Date.now();
    for (const [s, startTime] of this.turnStartTimes.entries()) {
      const elapsed = now - startTime;
      const player = this.state[s];
      player.turnRemaining = Math.max(0, this.config.turnMs - elapsed);
    }
    this.callbacks.onUpdate(this.state);
    for (const [s] of this.turnStartTimes.entries()) {
      const player = this.state[s];
      if (player.turnRemaining <= 0 || player.totalRemaining <= 0) {
        this.callbacks.onExpire(s);
        return;
      }
    }
  }
}
