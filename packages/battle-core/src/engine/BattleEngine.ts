/**
 * Headless battle engine lifted from apps/api's BattleRoom.
 *
 * Pure: @pkmn/sim + @pkmn/data + @pkmn/client + @pkmn/protocol only.
 * No Nest, no socket.io, no logger. Errors go to an onError callback.
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

export interface PlayerSpec {
  name: string;
  team?: PokemonSet[];
}

export interface BattleEndResult {
  winner: string;
  log: string;
  teams: Array<{ speciesForme: string; name: string; gender?: string; fainted: boolean }[]>;
}

export interface BattleEngineCallbacks {
  onProtocol: (line: string) => void;
  onRequestP1: (request: Protocol.Request) => void;
  onRequestP2?: (request: Protocol.Request) => void;
  onBattleEnd: (result: BattleEndResult) => void;
  onError: (error: string) => void;
  onTimerUpdate?: (state: TimerState) => void;
}

export class BattleEngine {
  readonly id: string;
  readonly mode: BattleEngineMode;

  private streams!: ReturnType<typeof BattleStreams.getPlayerStreams>;
  private battle!: Battle;
  private p2AI!: RandomPlayerAI | null;
  private replayLines: string[] = [];
  private p1Request: Protocol.Request | null = null;
  private p2Request: Protocol.Request | null = null;
  private lastP1Request: Protocol.Request | null = null;
  private lastP2Request: Protocol.Request | null = null;
  private callbacks: BattleEngineCallbacks;
  private p2AIPromise: Promise<void> | null = null;
  private omniscientPromise: Promise<void> | null = null;
  private gens: Generations;
  private timerManager: TimerManager | null = null;
  private finished = false;
  /** A forfeit is in flight; see forfeit(). */
  private ending = false;

  constructor(
    id: string,
    callbacks: BattleEngineCallbacks,
    mode: BattleEngineMode = 'ai',
    timerConfig?: Partial<TimerConfig>,
  ) {
    this.id = id;
    this.mode = mode;
    this.callbacks = callbacks;

    this.gens = new Generations(Dex as any);

    if (timerConfig || timerConfig === undefined) {
      this.timerManager = new TimerManager(
        {
          onUpdate: (state) => this.callbacks.onTimerUpdate?.(state),
          onExpire: (side) => this.forfeit(side),
        },
        timerConfig,
      );
    }
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

    this.streams = BattleStreams.getPlayerStreams(new BattleStreams.BattleStream());

    this.battle = new Battle(this.gens);

    if (this.mode === 'ai') {
      // p2 ONLY. `ai` means "a human plays p1 against a bot", not "watch two
      // bots play": attaching a RandomPlayerAI to p1 as well consumes the p1
      // stream, so `onRequestP1` never fires and the player is handed a battle
      // that plays itself. Same split as the BattleRoom this was lifted from.
      this.p2AI = new RandomPlayerAI(this.streams.p2);
      this.p2AIPromise = this.p2AI.start();
    }
    // In PvP mode, real players handle both sides via callbacks

    const spec = { formatid: format };
    const p1 = { name: p1Spec?.name ?? 'Player', team: Teams.pack(team1) };
    const p2 = { name: p2Spec?.name ?? 'Bot', team: Teams.pack(team2) };

    this.omniscientPromise = this.readOmniscient();

    await this.streams.omniscient.write(
      `>start ${JSON.stringify(spec)}\n>player p1 ${JSON.stringify(p1)}\n>player p2 ${JSON.stringify(p2)}`,
    );

    // p1 is ALWAYS read: it is the human side in both modes, and its requests
    // are what the UI renders a choice from. Only p2 differs — a bot consumes
    // it in `ai` mode, a second person in `pvp`.
    this.readP1();
    if (this.mode === 'pvp') {
      this.readP2();
    }
  }

  private async readOmniscient(): Promise<void> {
    try {
      for await (const chunk of this.streams.omniscient) {
        for (const line of chunk.split('\n')) {
          if (!line.trim()) continue;

          this.replayLines.push(line);
          const { args, kwArgs } = Protocol.parseBattleLine(line);

          this.battle.add(args, kwArgs);

          this.callbacks.onProtocol(line);

          if (args[0] === 'win') {
            this.finished = true;
            this.timerManager?.stop();
            const result: BattleEndResult = {
              winner: args[1] as string,
              log: this.replayLines.join('\n'),
              teams: [this.getTeamData(this.battle.p1.team), this.getTeamData(this.battle.p2.team)],
            };
            this.callbacks.onBattleEnd(result);
            this.cleanupStreams();
            return;
          }

          if (args[0] === 'tie') {
            this.finished = true;
            this.timerManager?.stop();
            const result: BattleEndResult = {
              winner: 'tie',
              log: this.replayLines.join('\n'),
              teams: [this.getTeamData(this.battle.p1.team), this.getTeamData(this.battle.p2.team)],
            };
            this.callbacks.onBattleEnd(result);
            this.cleanupStreams();
            return;
          }
        }
      }
    } catch (error: any) {
      if (!this.finished) {
        this.callbacks.onError(`Omniscient stream error: ${error.message}`);
      }
    }
  }

  /**
   * Ends the battle stream.
   *
   * ONLY the omniscient stream, deliberately. Destroying p1/p2 as well races
   * whatever is still reading them — the RandomPlayerAI on p2, and our own
   * readStream loops — and the sim then pushes into a closed stream and throws
   * `Push after end of read stream` from a later microtask. That throw cannot
   * be caught here (it is not on this call stack), so it surfaces as an
   * unhandled exception: a dead process in apps/api, a worker error after every
   * battle in the browser. Ending the omniscient stream ends the player streams
   * underneath it anyway, which is why the BattleRoom this was lifted from only
   * ever destroyed this one.
   */
  /**
   * Nothing to tear down.
   *
   * The simulator ends its own streams once it has written `|win|`, so by the
   * time we get here they are already closing and the `for await` loops fall
   * out on their own.
   *
   * Calling `destroy()` here instead — which is what the BattleRoom this was
   * lifted from did — makes the sim push into a closed stream on a LATER
   * microtask and throw `Push after end of read stream`. That throw is not on
   * this call stack, so the `try/catch` around the destroy cannot see it: it
   * surfaces as an unhandled exception, killing the Node process in apps/api
   * and erroring the worker after every battle in the browser. Measured, not
   * theorised — it reproduced on every run until the destroy went.
   */
  private cleanupStreams(): void {}

  private readP1(): void {
    this.readStream('p1');
  }

  private readP2(): void {
    this.readStream('p2');
  }

  private async readStream(side: 'p1' | 'p2'): Promise<void> {
    const stream = this.streams[side];
    try {
      for await (const chunk of stream) {
        const trimmed = chunk.trim();
        if (!trimmed) continue;

        const lines = trimmed.split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;
          const { args } = Protocol.parseBattleLine(line);

          if (args[0] === 'request') {
            try {
              const rawRequest = JSON.parse(args[1] as string);
              // Fill in the requestType if it's missing (load-bearing for the UI).
              //
              // `teamPreview` MUST be tested first. A team-preview request has a
              // `side` and no `active`, so without this it fell through to
              // 'switch' and every team format opened on a "forced switch" the
              // player could not answer — the choice the UI sent was `switch N`
              // where the simulator wanted `team N`. Random battles have no team
              // preview at all, which is why this survived M1 unseen.
              // `'team'` is @pkmn/protocol's own name for it, not a local one.
              if (!rawRequest.requestType) {
                if (rawRequest.teamPreview) {
                  rawRequest.requestType = 'team';
                } else if (rawRequest.active) {
                  rawRequest.requestType = 'move';
                } else if (rawRequest.side) {
                  rawRequest.requestType = 'switch';
                }
              }
              const request = rawRequest as Protocol.Request;

              if (side === 'p1') {
                this.p1Request = request;
                this.callbacks.onRequestP1(request);
                this.timerManager?.startTurn('p1');
              } else {
                this.p2Request = request;
                this.callbacks.onRequestP2?.(request);
                this.timerManager?.startTurn('p2');
              }
            } catch (e: any) {
              this.callbacks.onError(`Failed to parse ${side} request: ${e.message}`);
            }
          }
        }
      }
    } catch (error: any) {
      if (!this.finished) {
        this.callbacks.onError(`${side} stream error: ${error.message}`);
      }
    }
  }

  async playerChoice(choice: string, side: 'p1' | 'p2' = 'p1'): Promise<void> {
    if (this.finished) {
      this.callbacks.onError('Battle is finished');
      return;
    }

    const hasRequest = side === 'p1' ? this.p1Request : this.p2Request;
    if (!hasRequest) {
      this.callbacks.onError(`No pending request for ${side}`);
      return;
    }

    if (side === 'p1') {
      this.lastP1Request = this.p1Request;
      this.p1Request = null;
    } else {
      this.lastP2Request = this.p2Request;
      this.p2Request = null;
    }
    this.timerManager?.pauseTurn(side);

    try {
      await this.streams[side].write(choice);
    } catch (error: any) {
      this.callbacks.onError(`Failed to write ${side} choice: ${error.message}`);
    }
  }

  async undoChoice(side: 'p1' | 'p2' = 'p1'): Promise<boolean> {
    if (this.finished) return false;

    const last = side === 'p1' ? this.lastP1Request : this.lastP2Request;
    if (!last) {
      this.callbacks.onError(`Nothing to undo for ${side}`);
      return false;
    }

    try {
      await this.streams[side].write('undo');
    } catch (error: any) {
      this.callbacks.onError(`Failed to undo ${side} choice: ${error.message}`);
      return false;
    }

    if (side === 'p1') {
      this.p1Request = last;
      this.lastP1Request = null;
      this.callbacks.onRequestP1(last);
    } else {
      this.p2Request = last;
      this.lastP2Request = null;
      this.callbacks.onRequestP2?.(last);
    }
    this.timerManager?.startTurn(side);
    return true;
  }

  /**
   * Concedes the battle for `side`.
   *
   * Asks the SIMULATOR to end it (`>forcelose`) rather than synthesising a
   * result and tearing the stream down. Three things fall out of that: the
   * `|win|` line is real, so the replay log is complete and a spectator sees
   * the ending; `onBattleEnd` fires exactly once, from the same place every
   * other ending goes through; and the stream closes itself, avoiding the
   * uncatchable `Push after end of read stream` that a destroy provokes.
   *
   * `ending` rather than `finished` guards re-entry: `finished` is set by
   * readOmniscient when the win line actually arrives, and setting it here
   * would make that handler drop the real ending on the floor.
   */
  async forfeit(side: 'p1' | 'p2' = 'p1'): Promise<void> {
    if (this.finished || this.ending) return;
    this.ending = true;
    this.timerManager?.stop();

    try {
      await this.streams.omniscient.write(`>forcelose ${side}`);
      return;
    } catch {
      // The stream was already gone. Fall through and report the ending
      // ourselves so a caller waiting on onBattleEnd is not left hanging.
    }

    this.finished = true;
    this.callbacks.onBattleEnd({
      winner: side === 'p1' ? 'p2' : 'p1',
      log: this.replayLines.join(String.fromCharCode(10)),
      teams: [this.getTeamData(this.battle.p1.team), this.getTeamData(this.battle.p2.team)],
    });
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
