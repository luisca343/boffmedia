/**
 * Headless battle engine.
 *
 * Pure: @pkmn/sim + @pkmn/data + @pkmn/client + @pkmn/protocol only.
 * No Nest, no socket.io, no logger. Errors go to an onError callback.
 *
 * VISIBILITY IS SHOWDOWN'S, NOT OURS. `BattleStreams.getPlayerStreams` splits
 * one simulator into five consumers — omniscient, spectator, p1, p2 — and each
 * of those is an ORDERED stream of exactly what that viewer is allowed to see:
 * `|split|` lines resolve to the secret variant for the side they belong to and
 * to the shared variant for everyone else (so p2 sees p1's HP as a percentage),
 * and `|request|{json}` arrives INLINE on the owning side's stream, after the
 * protocol lines of the turn that produced it. That ordering is the simulator's
 * (`Battle.sendUpdates` sends `update` before `sideupdate`), so we never have to
 * reassemble it — we just forward, one line at a time, per viewer.
 *
 * The omniscient stream is used for ONE thing: building the replay log (and the
 * end-of-battle team snapshot). It is never forwarded to a viewer, because
 * doing so is what leaked the opponent's exact HP.
 */

import { BattleStreams, RandomPlayerAI, Teams } from '@pkmn/sim';
import { Generations } from '@pkmn/data';
import { Battle } from '@pkmn/client';
import { Protocol } from '@pkmn/protocol';
import { Dex, PokemonSet } from '@pkmn/sim';

import { getFormat, isKnownFormat, isRandomFormat } from '../formats.js';
import { getRandomTeam } from '../teams/random.js';
import { TimerManager, TimerConfig, TimerState } from './TimerManager.js';

export type BattleEngineMode = 'ai' | 'pvp';

/** Who a line is being delivered to. One ordered stream each. */
export type BattleViewer = 'p1' | 'p2' | 'spectator';

export type BattleSide = 'p1' | 'p2';

export interface PlayerSpec {
  name: string;
  team?: PokemonSet[];
}

export interface BattleEndResult {
  winner: string;
  log: string;
  teams: Array<{ speciesForme: string; name: string; gender?: string; fainted: boolean }[]>;
}

/**
 * Why a choice was not handed to the simulator.
 *
 * `stale_choice` is the one that matters on the wire: a client that answers a
 * request twice, or answers the request before last after a reconnect, must be
 * told rather than silently moving someone's Pokémon.
 */
export type ChoiceErrorCode =
  | 'no_request'
  | 'stale_choice'
  | 'battle_over'
  | 'not_started'
  | 'nothing_to_undo'
  | 'write_failed';

export type ChoiceResult = { ok: true } | { ok: false; code: ChoiceErrorCode };

export interface BattleEngineCallbacks {
  /**
   * One call per protocol line, per viewer, in that viewer's stream order.
   * `line` may be a `|request|{json}` line: requests ARE protocol now.
   */
  onLine: (viewer: BattleViewer, line: string) => void;
  /** Fired once, only after `|win|`/`|tie|` has been delivered on every stream. */
  onBattleEnd: (result: BattleEndResult) => void;
  onError: (error: string) => void;
  onTimerUpdate?: (state: TimerState) => void;
}

export interface BattleEngineOptions {
  /** Keeps the simulator stream open past `|win|`. Off, as in Showdown. */
  keepAlive?: boolean;
}

interface SideState {
  /** The request last delivered on this side's stream. */
  request: Protocol.Request | null;
  /** The delivered `|request|…` line, rqid included, for a resync. */
  line: string | null;
  /** rqid of `request`. Ours, stamped in `observe`. */
  rqid: number | null;
  /** How many requests this side has been sent. The rqid we stamp. */
  requestCount: number;
  /** A choice for `request` has been accepted; a second one is stale. */
  answered: boolean;
  /** An `undo` is in flight; the next `|error|` on this stream rejects it. */
  undoPending: boolean;
}

const newSideState = (): SideState => ({
  request: null,
  line: null,
  rqid: null,
  requestCount: 0,
  answered: false,
  undoPending: false,
});

export class BattleEngine {
  readonly id: string;
  readonly mode: BattleEngineMode;

  private streams!: ReturnType<typeof BattleStreams.getPlayerStreams>;
  private battle!: Battle;
  private p2AI: RandomPlayerAI | null = null;
  private replayLines: string[] = [];
  private sides: Record<BattleSide, SideState> = { p1: newSideState(), p2: newSideState() };
  private callbacks: BattleEngineCallbacks;
  private gens: Generations;
  private timerManager: TimerManager | null = null;
  private readonly keepAlive: boolean;

  private started = false;
  private finished = false;
  /** A forfeit is in flight; see forfeit(). */
  private ending = false;

  /**
   * Streams we are reading, and whether each has delivered the ending.
   *
   * `onBattleEnd` waits for ALL of them. Firing it from the omniscient reader
   * — which is what this used to do — raced the player streams: a socket
   * gateway would send `battleEnd` and tear the room down while p2's `|win|`
   * line was still queued behind it, so one player saw the result and the other
   * saw a battle that stopped mid-turn.
   */
  private pending = new Set<string>();
  private endResult: BattleEndResult | null = null;
  private endFired = false;

  constructor(
    id: string,
    callbacks: BattleEngineCallbacks,
    mode: BattleEngineMode = 'ai',
    timerConfig?: Partial<TimerConfig>,
    options?: BattleEngineOptions,
  ) {
    this.id = id;
    this.mode = mode;
    this.callbacks = callbacks;
    this.keepAlive = options?.keepAlive ?? false;

    this.gens = new Generations(Dex as any);

    // Constructed unconditionally, disabled unless a config says otherwise:
    // it is the ONLY thing in this engine allowed to own a timer, so nothing
    // else can make a battle's outcome depend on wall-clock scheduling.
    this.timerManager = new TimerManager(
      {
        onUpdate: (state) => this.callbacks.onTimerUpdate?.(state),
        onExpire: (side) => void this.forfeit(side),
      },
      timerConfig,
    );
  }

  async create(format: string = 'gen9randombattle', p1Spec?: PlayerSpec, p2Spec?: PlayerSpec): Promise<void> {
    // Validate format before creating anything
    if (!isKnownFormat(format)) {
      throw new Error(`Unknown format: ${format}`);
    }

    const fmt = getFormat(format)!;

    // For random formats, allow team to be undefined
    // For team formats, team is REQUIRED
    if (fmt.kind === 'team' && !p1Spec?.team && !p2Spec?.team) {
      throw new Error(`Team format '${format}' requires a packed team for both sides`);
    }

    const team1 = p1Spec?.team ?? (isRandomFormat(format) ? getRandomTeam(format) : undefined);
    const team2 = p2Spec?.team ?? (isRandomFormat(format) ? getRandomTeam(format) : undefined);

    if (!team1 || !team2) {
      throw new Error(`Failed to generate or supply teams for format '${format}'`);
    }

    this.streams = BattleStreams.getPlayerStreams(
      new BattleStreams.BattleStream({ keepAlive: this.keepAlive }),
    );

    this.battle = new Battle(this.gens);

    if (this.mode === 'ai') {
      // p2 ONLY. `ai` means "a human plays p1 against a bot", not "watch two
      // bots play". The AI OWNS the p2 stream — we must not read it as well, or
      // the two consumers race for the same chunks.
      this.p2AI = new RandomPlayerAI(this.streams.p2);
      void this.p2AI.start();
    }

    const spec = { formatid: format };
    const p1 = { name: p1Spec?.name ?? 'Player', team: Teams.pack(team1) };
    const p2 = { name: p2Spec?.name ?? 'Bot', team: Teams.pack(team2) };

    // Readers start BEFORE the battle is written, so nothing the `>start` burst
    // produces can be pushed into a stream nobody is draining yet.
    this.pending.add('omniscient');
    void this.readOmniscient();

    for (const viewer of this.viewers()) {
      this.pending.add(viewer);
      void this.readViewer(viewer);
    }

    this.started = true;

    await this.streams.omniscient.write(
      `>start ${JSON.stringify(spec)}\n>player p1 ${JSON.stringify(p1)}\n>player p2 ${JSON.stringify(p2)}`,
    );
  }

  /** Which viewer streams THIS engine reads. In `ai` mode p2 belongs to the bot. */
  private viewers(): BattleViewer[] {
    return this.mode === 'pvp' ? ['p1', 'p2', 'spectator'] : ['p1', 'spectator'];
  }

  // ── streams ───────────────────────────────────────────────────────────────

  private async readOmniscient(): Promise<void> {
    try {
      for await (const chunk of this.streams.omniscient) {
        for (const line of splitLines(chunk)) {
          this.replayLines.push(line);
          try {
            const { args, kwArgs } = Protocol.parseBattleLine(line);
            this.battle.add(args, kwArgs);
          } catch (error: any) {
            this.callbacks.onError(`Replay line not applied (${line}): ${error?.message ?? error}`);
          }

          if (isTerminal(line)) {
            this.finished = true;
            this.timerManager?.stop();
            this.endResult = this.buildResult(winnerOf(line));
            this.settle('omniscient');
            return;
          }
        }
      }
    } catch (error: any) {
      if (!this.finished) {
        this.callbacks.onError(`Omniscient stream error: ${error.message}`);
      }
    }
    this.settle('omniscient');
  }

  private async readViewer(viewer: BattleViewer): Promise<void> {
    const stream = viewer === 'spectator' ? this.streams.spectator : this.streams[viewer];
    try {
      for await (const chunk of stream) {
        for (const raw of splitLines(chunk)) {
          // State first, delivery second: a caller that answers synchronously
          // from `onLine` must find the request already current. `observe` also
          // returns the line to deliver, because a `|request|` gets an rqid
          // stamped into it on the way past.
          const line = viewer === 'spectator' ? raw : this.observe(viewer, raw);

          this.callbacks.onLine(viewer, line);

          if (isTerminal(line)) {
            this.settle(viewer);
            return;
          }
        }
      }
    } catch (error: any) {
      if (!this.finished) {
        this.callbacks.onError(`${viewer} stream error: ${error.message}`);
      }
    }
    this.settle(viewer);
  }

  /**
   * Tracks the side-private lines (`|request|`, `|error|`) as they go past, and
   * returns the line to deliver.
   *
   * A `|request|` is REWRITTEN on its way out, to carry an `rqid`. `@pkmn/sim`
   * does not emit one — rqid is added by Pokémon Showdown's own server layer,
   * not by the simulator — so without this there is no id for a client to echo
   * back and no way to tell a fresh choice from a stale one. Stamping it here,
   * once, in the one place that also decides what a choice is answering, is the
   * same thing PS does and keeps the client's `request.rqid` real rather than
   * something the transport invented on the side.
   */
  private observe(side: BattleSide, line: string): string {
    if (line.startsWith('|request|')) {
      const state = this.sides[side];
      const request = parseRequest(line);
      if (!request) {
        this.callbacks.onError(`Failed to parse ${side} request`);
        return line;
      }
      const rqid = ++state.requestCount;
      (request as any).rqid = rqid;
      const stamped = `|request|${JSON.stringify(request)}`;
      state.request = request;
      state.line = stamped;
      state.rqid = rqid;
      state.answered = false;
      state.undoPending = false;
      // A `wait` request is not a prompt; do not start a clock for it.
      if ((request as any).wait !== true) this.timerManager?.startTurn(side);
      return stamped;
    }

    if (line.startsWith('|error|')) {
      const state = this.sides[side];
      if (state.undoPending) {
        // The simulator refused the undo (a trapping effect would leak
        // information). The choice still stands, so put the side back to
        // "answered" instead of leaving it able to choose twice.
        state.undoPending = false;
        state.answered = true;
      } else if (state.request) {
        // A rejected choice: the side is free to try again.
        state.answered = false;
      }
    }
    return line;
  }

  private settle(key: string): void {
    this.pending.delete(key);
    this.maybeFireEnd();
  }

  private maybeFireEnd(): void {
    if (this.endFired || this.pending.size > 0) return;
    const result = this.endResult;
    if (!result) return;
    this.endFired = true;
    this.finished = true;
    this.timerManager?.stop();
    this.callbacks.onBattleEnd(result);
  }

  // ── choices ───────────────────────────────────────────────────────────────

  /**
   * Answers the side's CURRENT request.
   *
   * `rqid` is validated against the request we last delivered on that side's
   * stream. Without this a stale answer — a duplicate click, or a choice sent
   * before a reconnect and re-sent after it — was written straight into the
   * simulator and moved a Pokémon on a turn the player never saw.
   */
  async makeChoice(side: BattleSide, choice: string, rqid?: number | null): Promise<ChoiceResult> {
    if (!this.started) return { ok: false, code: 'not_started' };
    if (this.finished || this.ending) return { ok: false, code: 'battle_over' };

    const state = this.sides[side];
    if (!state.request) return { ok: false, code: 'no_request' };
    if (state.answered) return { ok: false, code: 'stale_choice' };
    if (rqid !== undefined && rqid !== null && state.rqid !== null && rqid !== state.rqid) {
      return { ok: false, code: 'stale_choice' };
    }

    state.answered = true;
    state.undoPending = false;
    this.timerManager?.pauseTurn(side);

    try {
      await this.streams[side].write(choice);
    } catch (error: any) {
      state.answered = false;
      this.callbacks.onError(`Failed to write ${side} choice: ${error.message}`);
      return { ok: false, code: 'write_failed' };
    }
    return { ok: true };
  }

  /**
   * Takes back a choice that has not been locked in.
   *
   * Nothing is "restored" here: the request the client re-prompts from is the
   * `|request|` line it already has, and the simulator emits a FRESH `|request|`
   * on the side stream whenever the undo changed what is legal. All this does is
   * re-open the side for an answer — and if the simulator refuses (`|error|`,
   * seen by `observe`), it closes again. That is the difference from the old
   * version, which synthesised a request callback the client could not tell
   * apart from a real one.
   */
  async undoChoice(side: BattleSide): Promise<ChoiceResult> {
    if (!this.started) return { ok: false, code: 'not_started' };
    if (this.finished || this.ending) return { ok: false, code: 'battle_over' };

    const state = this.sides[side];
    if (!state.request) return { ok: false, code: 'no_request' };
    if (!state.answered) return { ok: false, code: 'nothing_to_undo' };

    state.undoPending = true;
    state.answered = false;

    try {
      await this.streams[side].write('undo');
    } catch (error: any) {
      state.undoPending = false;
      state.answered = true;
      this.callbacks.onError(`Failed to undo ${side} choice: ${error.message}`);
      return { ok: false, code: 'write_failed' };
    }
    this.timerManager?.startTurn(side);
    return { ok: true };
  }

  /**
   * Concedes the battle for `side`.
   *
   * Asks the SIMULATOR to end it (`>forcelose`) rather than synthesising a
   * result and tearing the stream down: the `|win|` line is real, so the replay
   * is complete and every viewer sees the ending on its own stream, and
   * `onBattleEnd` fires from the same place every other ending goes through.
   *
   * `ending` rather than `finished` guards re-entry: `finished` is set when the
   * win line actually arrives, and setting it here would make that handler drop
   * the real ending on the floor.
   */
  async forfeit(side: BattleSide = 'p1'): Promise<void> {
    if (this.finished || this.ending) return;
    this.ending = true;
    this.timerManager?.stop();

    // A room that was created and never started has no streams and no client
    // battle at all. Reaching into either threw a TypeError that took the
    // gateway's handler down with it.
    if (!this.started) {
      this.finished = true;
      this.endFired = true;
      this.callbacks.onBattleEnd({
        winner: side === 'p1' ? 'p2' : 'p1',
        log: '',
        teams: [[], []],
      });
      return;
    }

    try {
      await this.streams.omniscient.write(`>forcelose ${side}`);
      return;
    } catch {
      // The stream was already gone. Fall through and report the ending
      // ourselves so a caller waiting on onBattleEnd is not left hanging.
    }

    this.finished = true;
    this.endFired = true;
    this.callbacks.onBattleEnd(this.buildResult(side === 'p1' ? 'p2' : 'p1'));
  }

  // ── inspection ────────────────────────────────────────────────────────────

  /** The request last delivered on that side's stream, if it is unanswered. */
  currentRequest(side: BattleSide): Protocol.Request | null {
    return this.sides[side].request;
  }

  /** The raw `|request|…` line, for a snapshot that has to re-prompt. */
  currentRequestLine(side: BattleSide): string | null {
    return this.sides[side].line;
  }

  currentRqid(side: BattleSide): number | null {
    return this.sides[side].rqid;
  }

  /** The omniscient log so far — the replay, and only the replay. */
  get replayLog(): string {
    return this.replayLines.join('\n');
  }

  get isStarted(): boolean {
    return this.started;
  }

  get isFinished(): boolean {
    return this.finished;
  }

  private buildResult(winner: string): BattleEndResult {
    let teams: BattleEndResult['teams'] = [[], []];
    try {
      teams = [this.getTeamData(this.battle.p1.team), this.getTeamData(this.battle.p2.team)];
    } catch {
      // A battle that ended before either side was populated. The result still
      // has to go out; an empty roster is better than an exception.
    }
    return { winner, log: this.replayLines.join('\n'), teams };
  }

  private getTeamData(team: any[]): Array<{ speciesForme: string; name: string; gender?: string; fainted: boolean }> {
    return team.map((pokemon: any) => ({
      speciesForme: pokemon.speciesForme || pokemon.name,
      name: pokemon.name,
      gender: pokemon.gender || undefined,
      fainted: pokemon.fainted || false,
    }));
  }
}

// ── helpers ─────────────────────────────────────────────────────────────────

function splitLines(chunk: string): string[] {
  if (!chunk) return [];
  const out: string[] = [];
  for (const line of chunk.split('\n')) {
    if (!line.length) continue;
    out.push(line);
  }
  return out;
}

function isTerminal(line: string): boolean {
  return line.startsWith('|win|') || line === '|tie' || line.startsWith('|tie|');
}

function winnerOf(line: string): string {
  return line.startsWith('|win|') ? line.slice('|win|'.length) : 'tie';
}

/**
 * Reads the JSON off a `|request|` line and fills in `requestType`.
 *
 * `teamPreview` MUST be tested first. A team-preview request has a `side` and
 * no `active`, so without this it fell through to 'switch' and every team
 * format opened on a "forced switch" the player could not answer — the choice
 * the UI sent was `switch N` where the simulator wanted `team N`.
 */
function parseRequest(line: string): Protocol.Request | null {
  const json = line.slice('|request|'.length);
  if (!json) return null;
  try {
    const raw = JSON.parse(json);
    if (!raw || typeof raw !== 'object') return null;
    if (!raw.requestType) {
      if (raw.teamPreview) raw.requestType = 'team';
      else if (raw.active) raw.requestType = 'move';
      else if (raw.forceSwitch) raw.requestType = 'switch';
      else if (raw.wait) raw.requestType = 'wait';
      else if (raw.side) raw.requestType = 'switch';
    }
    return raw as Protocol.Request;
  } catch {
    return null;
  }
}
