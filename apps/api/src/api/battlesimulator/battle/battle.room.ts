import { Logger } from 'nestjs-pino';
import {
  BattleEngine,
  isKnownFormat,
  isRandomFormat,
  unpackTeam,
  type BattleEndResult,
  type TimerConfig,
  type TimerState,
} from '@boffmedia/battle-core';
import { Protocol } from '@pkmn/protocol';

/**
 * One PvP battle.
 *
 * Two things changed here in M2, and both are the point of the milestone:
 *
 * 1. THE SIMULATOR IS NOW SHARED. The battle plumbing this file used to own is
 *    `@boffmedia/battle-core`'s `BattleEngine`, consumed here as compiled CJS
 *    and by the browser as ESM. One implementation means a PvP battle and a
 *    local AI battle cannot diverge in their rules, their protocol or their
 *    replay format — which they would have, slowly, as two copies.
 *
 * 2. AI MODE IS GONE (D3). The server used to run a `RandomPlayerAI` on p2 so a
 *    single player could battle over a socket. That is now done in a Web Worker
 *    in the player's own page: it works offline, it costs the server nothing,
 *    and it removes the only reason an unauthenticated socket ever needed to
 *    create a room. What is left here is PvP, which is exactly the case that
 *    genuinely needs a server.
 *
 * A side is a Boffmedia account, never a display name. `rotom_replays` stored
 * names in `side1`/`side2`, so two players called the same thing were the same
 * player as far as any later query was concerned.
 */

export type BattleRoomStatus = 'waiting' | 'active' | 'finished';

/** Who is playing a side. */
export interface RoomPlayer {
  userId: number;
  name: string;
  /** Packed Showdown team. Required for a team format, unused for a random one. */
  team?: string;
}

export interface BattleRoomCallbacks {
  onProtocol: (line: string) => void;
  onRequestP1: (request: Protocol.Request) => void;
  onRequestP2: (request: Protocol.Request) => void;
  onBattleEnd: (result: BattleEndResult) => void;
  onError: (error: string) => void;
  onTimerUpdate?: (state: TimerState) => void;
}

export class BattleRoom {
  readonly id: string;
  readonly format: string;
  readonly p1: RoomPlayer;
  readonly p2: RoomPlayer;
  /** When the battle ended, for the reaper. */
  finishedAt: number | null = null;

  private engine: BattleEngine;
  private state: BattleRoomStatus = 'waiting';
  private lastRequest: { p1: Protocol.Request | null; p2: Protocol.Request | null } = {
    p1: null,
    p2: null,
  };
  /** Every protocol line so far. A spectator joining at turn 20 replays this
   *  to catch up, which is why it cannot wait for the battle to end. */
  private replayLines: string[] = [];

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
        onProtocol: (line) => {
          this.replayLines.push(line);
          this.callbacks.onProtocol(line);
        },
        onRequestP1: (request) => {
          this.lastRequest.p1 = request;
          this.callbacks.onRequestP1(request);
        },
        onRequestP2: (request) => {
          this.lastRequest.p2 = request;
          this.callbacks.onRequestP2(request);
        },
        onBattleEnd: (result) => {
          this.state = 'finished';
          this.finishedAt = Date.now();
          this.callbacks.onBattleEnd(result);
        },
        onError: (message) => {
          // Detail to the log, never to the socket: an engine message names
          // internals and a client can make it fire on demand.
          this.logger?.error(`[battle ${this.id}] ${message}`);
          this.callbacks.onError('battle_error');
        },
        onTimerUpdate: (timerState) => this.callbacks.onTimerUpdate?.(timerState),
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
      { name: this.p1.name, team: this.p1.team ? (unpackTeam(this.p1.team) ?? undefined) : undefined },
      { name: this.p2.name, team: this.p2.team ? (unpackTeam(this.p2.team) ?? undefined) : undefined },
    );
    this.state = 'active';
  }

  /** `side` is resolved from the socket's identity by the gateway, never sent. */
  async choose(side: 'p1' | 'p2', choice: string): Promise<void> {
    if (this.state !== 'active') return;
    await this.engine.playerChoice(choice, side);
  }

  async undo(side: 'p1' | 'p2'): Promise<void> {
    if (this.state !== 'active') return;
    await this.engine.undoChoice(side);
  }

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

  playerFor(side: 'p1' | 'p2'): RoomPlayer {
    return side === 'p1' ? this.p1 : this.p2;
  }

  get status(): BattleRoomStatus {
    return this.state;
  }

  /** The log so far — what a joining spectator or a resuming player replays. */
  get replay(): string {
    return this.replayLines.join(String.fromCharCode(10));
  }

  currentRequest(side: 'p1' | 'p2'): Protocol.Request | null {
    return this.lastRequest[side];
  }
}
