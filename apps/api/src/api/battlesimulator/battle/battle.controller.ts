import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { getRandomTeam } from '../_utils/teams';
import {
  Dex,
  PRNG,
  Teams as DTeams,
  BattleStreams,
  RandomPlayerAI,
} from '@pkmn/sim';
import { GenerationNum, Generations } from '@pkmn/data';
import { Battle, Pokemon } from '@pkmn/client';
import { LogFormatter } from '@pkmn/view';
import { Sprites } from '@pkmn/img';
import { Protocol } from '@pkmn/protocol';

function getPokemonTeam(team: Pokemon[]) {
  const pokemonTeam = [] as any[];
  team.map((pokemon) => {
    pokemonTeam.push({
      speciesForme: pokemon.speciesForme || pokemon.name,
      name: pokemon.name,
      gender: pokemon.gender || undefined,
      fainted: pokemon.fainted || false,
    });
  });

  return pokemonTeam;
}

@ApiTags('BoffMedia 🛠 | Battle Simulator')
@Controller('battlesimulator/battle')
export class BattleController {
  @Get()
  @ApiOperation({ summary: 'Simulate a Pokémon battle' })
  @ApiResponse({ status: 200, description: 'Battle simulated successfully.' })
  @ApiResponse({ status: 500, description: 'Failed to simulate battle.' })
  async getBattle() {
    const log = {} as {
      [turn: number]: {
        events: {
          args: string[];
          kwArgs: { [k: string]: any };
          text: string;
          line: string;
        }[];
        t1: {
          gen: number;
          w: number;
          h: number;
          url: string;
          pixelated: boolean;
        };
        t2: {
          gen: number;
          w: number;
          h: number;
          url: string;
          pixelated: boolean;
        };
      };
    };

    const team1 = getRandomTeam();
    const team2 = getRandomTeam();

    const prng = new PRNG();
    const FORMAT = 'gen9randomdoublesbattle';
    const GRAPHICS:
      | 'ani'
      | 'gen1rg'
      | 'gen1rb'
      | 'gen1'
      | 'gen2g'
      | 'gen2s'
      | 'gen2'
      | 'gen3rs'
      | 'gen3frlg'
      | 'gen3'
      | 'gen3-2'
      | 'gen4dp'
      | 'gen4dp-2'
      | 'gen4'
      | 'gen5'
      | 'gen5ani'
      | GenerationNum = prng.sample(['ani']);

    const spec = { formatid: FORMAT };

    const p1spec = { name: 'Bot A', team: DTeams.pack(team1) };
    const p2spec = { name: 'Bot B', team: DTeams.pack(team2) };

    const streams = BattleStreams.getPlayerStreams(
      new BattleStreams.BattleStream(),
    );
    const p1 = new RandomPlayerAI(streams.p1);
    const p2 = new RandomPlayerAI(streams.p2);

    p1.start();
    p2.start();

    const gens = new Generations(Dex as any);
    const battle = new Battle(gens);
    const formatter = new LogFormatter('p1', battle);

    function updateLog(
      turn: number,
      text: string,
      args: any,
      kwArgs: { [k: string]: any },
      line?: string,
    ) {
      let img1 = {} as {
        gen: number;
        w: number;
        h: number;
        url: string;
        pixelated: boolean;
      };
      let img2 = {} as {
        gen: number;
        w: number;
        h: number;
        url: string;
        pixelated: boolean;
      };

      for (const active of battle.p1.active) {
        if (!active)
          img1 = {} as {
            gen: number;
            w: number;
            h: number;
            url: string;
            pixelated: boolean;
          };
        img1 = Sprites.getPokemon(active?.speciesForme ?? '', {
          gen: GRAPHICS,
          gender: active?.gender || undefined,
          shiny: active?.shiny,
        } as any);
      }

      for (const active of battle.p2.active) {
        if (!active)
          img2 = {} as {
            gen: number;
            w: number;
            h: number;
            url: string;
            pixelated: boolean;
          };
        img2 = Sprites.getPokemon(active?.speciesForme ?? '', {
          gen: GRAPHICS,
          gender: active?.gender || undefined,
          shiny: active?.shiny,
        } as any);
      }

      log[turn] = log[turn] || { events: [], t1: img1, t2: img2 };
      log[turn].events.push({ args, kwArgs, text, line: line ?? '' });
    }

    function end(winner: string) {
      return {
        winner,
        log,
        team1: getPokemonTeam(battle.p1.team),
        team2: getPokemonTeam(battle.p2.team),
      };
    }

    void streams.omniscient.write(`>start ${JSON.stringify(spec)}`);
    void streams.omniscient.write(`>player p1 ${JSON.stringify(p1spec)}`);
    void streams.omniscient.write(`>player p2 ${JSON.stringify(p2spec)}`);

    return new Promise((resolve, reject) => {
      (async () => {
        let turn = 0;
        let winner: string | null = null;
        try {
          for await (const chunk of streams.omniscient) {
            for (const line of chunk.split('\n')) {
              const { args, kwArgs } = Protocol.parseBattleLine(line);

              if (args[0] === 'turn') {
                turn = parseInt(args[1]);
              } else if (args[0] === 'win') {
                winner = args[1] ?? 'Unknown';
              }

              const html = formatter.formatHTML(args, kwArgs);

              battle.add(args, kwArgs);

              updateLog(turn, html, args, kwArgs, line);
            }
            battle.update({} as Protocol.Request);
          }
          // Stream ended — resolve with winner if captured, otherwise tie
          resolve(end(winner ?? 'Tie'));
        } catch (err) {
          reject(err);
        }
      })();
    });
  }
}
