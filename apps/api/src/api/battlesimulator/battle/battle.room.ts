import {
  BattleStreams,
  RandomPlayerAI,
  Teams,
} from '@pkmn/sim';
import { Generations } from '@pkmn/data';
import { Battle } from '@pkmn/client';
import { LogFormatter } from '@pkmn/view';
import { Protocol } from '@pkmn/protocol';
import { Dex } from '@pkmn/sim';
import { getRandomTeam } from '../_utils/teams';

export type BattleRoomStatus = 'waiting' | 'active' | 'finished';

export interface BattleRoomCallbacks {
  onProtocol: (line: string) => void;
  onRequest: (request: Protocol.Request) => void;
  onBattleEnd: (result: BattleEndResult) => void;
  onError: (error: string) => void;
}

export interface BattleEndResult {
  winner: string;
  replay: string;
  team1: any[];
  team2: any[];
  side1: string;
  side2: string;
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

  constructor(id: string, callbacks: BattleRoomCallbacks) {
    this.id = id;
    this.callbacks = callbacks;
    this.gens = new Generations(Dex as any);
  }

  async create(format: string = 'gen9randombattle'): Promise<void> {
    const team1 = getRandomTeam();
    const team2 = getRandomTeam();

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

        const { args, kwArgs } = Protocol.parseBattleLine(trimmed);

        if (args[0] === 'request') {
          try {
            this.currentRequest = JSON.parse(args[1] as string) as Protocol.Request;
            this.callbacks.onRequest(this.currentRequest);
          } catch (e: any) {
            this.callbacks.onError(`Failed to parse request: ${e.message}`);
          }
        }
      }
    } catch (error: any) {
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

    try {
      await this.streams.p1.write(choice);
    } catch (error: any) {
      this.callbacks.onError(`Failed to write choice: ${error.message}`);
    }
  }

  async forfeit(): Promise<void> {
    if (this.status !== 'active') return;

    try {
      await this.streams.omniscient.write('>forfeit p1');
    } catch (error: any) {
      this.callbacks.onError(`Forfeit error: ${error.message}`);
    }
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

  private getTeamData(team: any[]): any[] {
    return team.map((pokemon: any) => ({
      speciesForme: pokemon.speciesForme || pokemon.name,
      name: pokemon.name,
      gender: pokemon.gender || undefined,
      fainted: pokemon.fainted || false,
    }));
  }
}
