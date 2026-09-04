import { Logger } from 'nestjs-pino';
import {
  BattleEngine,
  isKnownFormat,
  isRandomFormat,
  unpackTeam,
  type BattleEndResult,
  type ChoiceResult,
  type TimerConfig,
  type TimerState,
} from '@boffmedia/battle-core';

/**
 * One PvP battle.
 *
 * THE ROOM IS THE TRANSCRIPT. Every viewer — p1, p2, a spectator — has its own
 * ordered view of the battle coming out of the simulator, and this class keeps
 * each of those views as an array whose INDEX IS THE SEQUENCE NUMBER. That one
 * property is what makes `resume` and `spectate` idempotent: a socket that
 * comes back at any moment is handed the whole array plus the seq of its last
 * entry, replays it, and is by construction in the same state as a socket that
 * never left. It is also why there is no longer a private `request` event —
 * `|request|` lines live in the view log like every other line, so a resync
 * re-prompts for free instead of depending on a separately-stored "last
 * request" that the old code forgot to re-send on spectate.
 *
 * The simulator itself is `@boffmedia/battle-core`'s `BattleEngine`, consumed
 * here as compiled CJS and by the browser as ESM. One implementation means a
 * PvP battle and a local AI battle cannot diverge in their rules, their
 * protocol or their replay format.
 *
 * A side is a Boffmedia account, never a display name. `rotom_replays` stored
 * names in `side1`/`side2`, so two players called the same thing were the same
 * player as far as any later query was concerned.
 */

export type BattleRoomStatus = 'waiting' | 'active' | 'finished';

/** The three fan-out audiences. Also the socket.io room suffixes. */
export type RoomViewer = 'p1' | 'p2' | 'spec';

export const ROOM_VIEWERS: readonly RoomViewer[] = [
  'p1',
  'p2',
  'spec',
] as const;

/** Who is playing a side. */
export interface RoomPlayer {
  userId: number;
  name: string;
  /** Packed Showdown team. Required for a team format, unused for a random one. */
  team?: string;
}

/** What a resuming or spectating socket needs to be caught up. */
export interface ViewSnapshot {
  /** Every line this viewer has been sent, index === seq. */
  replay: string[];
  /** Seq of the last line in `replay`, or -1 when nothing has been sent. */
  seq: number;
}

export interface BattleRoomCallbacks {
  /** One call per line, per viewer, in that viewer's order. `seq` is its index. */
  onLine: (viewer: RoomViewer, seq: number, line: string) => void;
  onBattleEnd: (
    result: BattleEndResult,
    seqs: Record<RoomViewer, number>,
  ) => void;
  onError: (error: string) => void;
  onTimerUpdate?: (state: TimerState) => void;
}

export class BattleRoom {
  readonly id: string;
  readonly format: string;
  readonly p1: RoomPlayer;
  readonly p2: RoomPlayer;
  /** When the room was made, for the reaper's `waiting` sweep. */
  readonly createdAt = Date.now();
  /** When the battle ended, for the reaper. */
  finishedAt: number | null = null;

  private engine: BattleEngine;
  private state: BattleRoomStatus = 'waiting';

  /** Per-viewer transcript. Index is the sequence number, by construction. */
  private viewLog: Record<RoomViewer, string[]> = { p1: [], p2: [], spec: [] };
  /** Next seq to hand out per viewer. Ahead of `viewLog` only for `battleEnd`. */
  private nextSeq: Record<RoomViewer, number> = { p1: 0, p2: 0, spec: 0 };

  constructor(
    id: string,
    format: string,
    p1: RoomPlayer,
    p2: RoomPlayer,
    private readonly callbacks: BattleRoomCallbacks,
    private readonly logger?: Logger,
    timerConfig?: Partial<TimerConfig>,
  ) {
    this.id = id;
    this.format = format;
    this.p1 = p1;
    this.p2 = p2;

    this.engine = new BattleEngine(
      id,
      {
        onLine: (viewer, line) => {
          const key: RoomViewer = viewer === 'spectator' ? 'spec' : viewer;
          const seq = this.nextSeq[key]++;
          this.viewLog[key].push(line);
          this.callbacks.onLine(key, seq, line);
        },
        onBattleEnd: (result) => {
          this.state = 'finished';
          this.finishedAt = Date.now();
          // The ending gets a seq of its own on every stream, so a client can
          // order it against the protocol lines it has already applied.
          const seqs = {
            p1: this.nextSeq.p1++,
            p2: this.nextSeq.p2++,
            spec: this.nextSeq.spec++,
          } as Record<RoomViewer, number>;
          this.callbacks.onBattleEnd(result, seqs);
        },
        onError: (message) => {
          // Detail to the log, never to the socket: an engine message names
          // internals and a client can make it fire on demand.
          this.logger?.error(`[battle ${this.id}] ${message}`);
          this.callbacks.onError('battle_error');
        },
        onTimerUpdate: (timerState) =>
          this.callbacks.onTimerUpdate?.(timerState),
      },
      'pvp',
      timerConfig,
    );
  }

  async start(): Promise<void> {
    if (!isKnownFormat(this.format)) {
      // Checked again here rather than trusting the gateway: this is the last
      // place before the string reaches the simulator.
      throw new Error(`unknown_format`);
    }
    if (!isRandomFormat(this.format) && (!this.p1.team || !this.p2.team)) {
      throw new Error('team_required');
    }

    await this.engine.create(
      this.format,
      {
        name: this.p1.name,
        team: this.p1.team
          ? (unpackTeam(this.p1.team) ?? undefined)
          : undefined,
      },
      {
        name: this.p2.name,
        team: this.p2.team
          ? (unpackTeam(this.p2.team) ?? undefined)
          : undefined,
      },
    );
    if (this.state === 'waiting') this.state = 'active';
  }

  /**
   * `side` is resolved from the socket's identity by the gateway, never sent.
   * `rqid` is the client's claim about WHICH request it is answering; the
   * engine rejects it if that is not the request it last delivered.
   */
  async choose(
    side: 'p1' | 'p2',
    choice: string,
    rqid?: number | null,
  ): Promise<ChoiceResult> {
    if (this.state !== 'active') return { ok: false, code: 'battle_over' };
    return this.engine.makeChoice(side, choice, rqid);
  }

  async undo(side: 'p1' | 'p2'): Promise<ChoiceResult> {
    if (this.state !== 'active') return { ok: false, code: 'battle_over' };
    return this.engine.undoChoice(side);
  }

  /**
   * Concede.
   *
   * A room that was created and never started (the format threw, the process
   * was mid-`start`) has no streams at all, and this used to walk straight into
   * them and throw out of the gateway's handler. The engine guards it now; the
   * `finished` check here is only to keep a second forfeit quiet.
   */
  async forfeit(side: 'p1' | 'p2'): Promise<void> {
    if (this.state === 'finished') return;
    await this.engine.forfeit(side);
  }

  /** Which side this account is playing, or null if it is only spectating. */
  sideOf(userId: number): 'p1' | 'p2' | null {
    if (this.p1.userId === userId) return 'p1';
    if (this.p2.userId === userId) return 'p2';
    return null;
  }

  /** The viewer an account gets: their own side, or the spectator view. */
  viewerOf(userId: number): RoomViewer {
    return this.sideOf(userId) ?? 'spec';
  }

  playerFor(side: 'p1' | 'p2'): RoomPlayer {
    return side === 'p1' ? this.p1 : this.p2;
  }

  get status(): BattleRoomStatus {
    return this.state;
  }

  /**
   * The catch-up snapshot for one viewer.
   *
   * A player's own view already CONTAINS their last `|request|` line, in the
   * position the simulator emitted it, so replaying this re-prompts them
   * without any separate request plumbing.
   */
  snapshot(viewer: RoomViewer): ViewSnapshot {
    const replay = [...this.viewLog[viewer]];
    return { replay, seq: replay.length - 1 };
  }

  /** The omniscient log — what gets persisted as the replay. */
  get replay(): string {
    return this.engine.replayLog;
  }

  currentRequestLine(side: 'p1' | 'p2'): string | null {
    return this.engine.currentRequestLine(side);
  }
}
