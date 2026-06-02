import { BattleStreams, RandomPlayerAI, Teams } from '@pkmn/sim';
import { Generations } from '@pkmn/data';
import { Battle } from '@pkmn/client';
import { LogFormatter } from '@pkmn/view';
import { Protocol } from '@pkmn/protocol';
import { Dex } from '@pkmn/sim';
import { Logger } from 'nestjs-pino';
import { getRandomTeam } from '../_utils/teams';

export type BattleRoomStatus = 'waiting' | 'active' | 'finished';

export interface BattleRoomCallbacks {
  onProtocol: (line: string) => void;
  onRequest: (request: Protocol.Request) => void;
  onBattleEnd: (result: BattleEndResult) => void;
  onError: (error: string) => void;
  onTimerUpdate?: (state: TimerState) => void;
}

export interface BattleEndResult {
  winner: string;
  replay: string;
  team1: any[];
  team2: any[];
  side1: string;
  side2: string;
}

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

export class BattleRoom {
  readonly id: string;
  private streams!: ReturnType<typeof BattleStreams.getPlayerStreams>;
  private battle!: Battle;
  private formatter!: LogFormatter;
  private ai!: RandomPlayerAI;
  private status: BattleRoomStatus = 'waiting';
  private replayLines: string[] = [];
  private currentRequest: Protocol.Request | null = null;
  private callbacks: BattleRoomCallbacks;
  private readPromise: Promise<void> | null = null;
  private aiPromise: Promise<void> | null = null;
  private omniscientPromise: Promise<void> | null = null;
  private gens: Generations;
  private timerConfig: TimerConfig;
  private timerState: TimerState;
  private turnStartTime: number | null = null;
  private timerInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    id: string,
    callbacks: BattleRoomCallbacks,
    private readonly logger?: Logger,
    timerConfig?: Partial<TimerConfig>,
  ) {
    this.id = id;
    this.callbacks = callbacks;
    this.gens = new Generations(Dex as any);
    this.timerConfig = {
      enabled: timerConfig?.enabled ?? false,
      turnMs: timerConfig?.turnMs ?? 60_000,
      totalMs: timerConfig?.totalMs ?? 300_000,
    };
    this.timerState = {
      p1: {
        turnRemaining: this.timerConfig.turnMs,
        totalRemaining: this.timerConfig.totalMs,
      },
      p2: {
        turnRemaining: this.timerConfig.turnMs,
        totalRemaining: this.timerConfig.totalMs,
      },
      activeSide: null,
    };
  }

  async create(format: string = 'gen9randombattle'): Promise<void> {
    const team1 = getRandomTeam(format);
    const team2 = getRandomTeam(format);

    this.streams = BattleStreams.getPlayerStreams(
      new BattleStreams.BattleStream(),
    );

    this.battle = new Battle(this.gens);
    this.formatter = new LogFormatter('p1', this.battle);

    this.ai = new RandomPlayerAI(this.streams.p2);
    this.aiPromise = this.ai.start();

    const spec = { formatid: format };
    const p1spec = { name: 'Player', team: Teams.pack(team1) };
    const p2spec = { name: 'Bot', team: Teams.pack(team2) };

    this.omniscientPromise = this.readOmniscient();

    await this.streams.omniscient.write(
      `>start ${JSON.stringify(spec)}\n>player p1 ${JSON.stringify(p1spec)}\n>player p2 ${JSON.stringify(p2spec)}`,
    );

    this.status = 'active';
    this.readP1();
  }

  private async readOmniscient(): Promise<void> {
    try {
      for await (const chunk of this.streams.omniscient) {
        for (const line of chunk.split('\n')) {
          if (!line.trim()) continue;

          this.replayLines.push(line);
          const { args, kwArgs } = Protocol.parseBattleLine(line);

          const html = this.formatter.formatHTML(args, kwArgs);
          this.battle.add(args, kwArgs);

          this.callbacks.onProtocol(line);

          if (args[0] === 'win') {
            this.status = 'finished';
            this.stopTimer();
            const result: BattleEndResult = {
              winner: args[1] as string,
              replay: this.replayLines.join('\n'),
              team1: this.getTeamData(this.battle.p1.team),
              team2: this.getTeamData(this.battle.p2.team),
              side1: 'Player',
              side2: 'Bot',
            };
            this.callbacks.onBattleEnd(result);
            return;
          }

          if (args[0] === 'tie') {
            this.status = 'finished';
            this.stopTimer();
            const result: BattleEndResult = {
              winner: 'tie',
              replay: this.replayLines.join('\n'),
              team1: this.getTeamData(this.battle.p1.team),
              team2: this.getTeamData(this.battle.p2.team),
              side1: 'Player',
              side2: 'Bot',
            };
            this.callbacks.onBattleEnd(result);
            return;
          }
        }
      }
    } catch (error: any) {
      if (this.status !== 'finished') {
        this.callbacks.onError(`Omniscient stream error: ${error.message}`);
      }
    }
  }

  private async readP1(): Promise<void> {
    try {
      for await (const chunk of this.streams.p1) {
        const trimmed = chunk.trim();
        if (!trimmed) continue;

        const lines = trimmed.split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;
          const { args } = Protocol.parseBattleLine(line);

          if (args[0] === 'request') {
            try {
              const rawRequest = JSON.parse(args[1] as string);
              // PS protocol doesn't include requestType — infer from structure
              if (!rawRequest.requestType) {
                if (rawRequest.active) {
                  rawRequest.requestType = 'move';
                } else if (rawRequest.side) {
                  rawRequest.requestType = 'switch';
                }
              }
              this.currentRequest = rawRequest as Protocol.Request;
              this.callbacks.onRequest(this.currentRequest);
              this.startTurnTimer('p1');
            } catch (e: any) {
              this.logger?.error(`[P1] Failed to parse request: ${e.message}`);
              this.callbacks.onError(`Failed to parse request: ${e.message}`);
            }
          }
        }
      }
    } catch (error: any) {
      this.logger?.error(`[P1] Stream error: ${error.message}`);
      if (this.status !== 'finished') {
        this.callbacks.onError(`P1 stream error: ${error.message}`);
      }
    }
  }

  async playerChoice(choice: string): Promise<void> {
    if (this.status !== 'active') {
      this.callbacks.onError('Battle is not active');
      return;
    }

    if (!this.currentRequest) {
      this.callbacks.onError('No pending request');
      return;
    }

    this.currentRequest = null;
    this.pauseTurnTimer();

    try {
      await this.streams.p1.write(choice);
    } catch (error: any) {
      this.callbacks.onError(`Failed to write choice: ${error.message}`);
    }
  }

  async forfeit(): Promise<void> {
    if (this.status !== 'active') return;
    this.stopTimer();
    this.status = 'finished';

    const result: BattleEndResult = {
      winner: 'Bot',
      replay: this.replayLines.join('\n'),
      team1: this.getTeamData(this.battle.p1.team),
      team2: this.getTeamData(this.battle.p2.team),
      side1: 'Player',
      side2: 'Bot',
    };
    this.callbacks.onBattleEnd(result);

    try {
      this.streams.omniscient.destroy();
    } catch {}
  }

  getStatus(): BattleRoomStatus {
    return this.status;
  }

  getCurrentRequest(): Protocol.Request | null {
    return this.currentRequest;
  }

  getReplay(): string {
    return this.replayLines.join('\n');
  }

  getTimerState(): TimerState {
    return { ...this.timerState };
  }

  private startTurnTimer(side: 'p1' | 'p2'): void {
    if (!this.timerConfig.enabled) return;
    this.stopTimer();
    this.turnStartTime = Date.now();
    this.timerState.activeSide = side;
    this.timerInterval = setInterval(() => {
      if (!this.turnStartTime) return;
      const elapsed = Date.now() - this.turnStartTime;
      const player = this.timerState[side];
      player.turnRemaining = Math.max(0, this.timerConfig.turnMs - elapsed);
      player.totalRemaining = Math.max(0, player.totalRemaining - 1000);

      this.callbacks.onTimerUpdate?.(this.timerState);

      if (player.turnRemaining <= 0 || player.totalRemaining <= 0) {
        this.logger?.log(`Timer expired for ${side}, auto-forfeiting`);
        this.forfeit();
      }
    }, 1000);
  }

  private pauseTurnTimer(): void {
    if (!this.timerConfig.enabled || !this.turnStartTime) return;
    this.stopTimer();
    const side = this.timerState.activeSide;
    if (side) {
      const elapsed = Date.now() - this.turnStartTime;
      const player = this.timerState[side];
      player.turnRemaining = Math.max(0, this.timerConfig.turnMs - elapsed);
      player.totalRemaining = Math.max(0, player.totalRemaining - elapsed);
    }
    this.turnStartTime = null;
    this.timerState.activeSide = null;
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private getTeamData(team: any[]): any[] {
    return team.map((pokemon: any) => ({
      speciesForme: pokemon.speciesForme || pokemon.name,
      name: pokemon.name,
      gender: pokemon.gender || undefined,
      fainted: pokemon.fainted || false,
    }));
  }
}
