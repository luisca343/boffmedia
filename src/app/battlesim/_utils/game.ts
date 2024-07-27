import { Sprites } from "@pkmn/img";
import { Protocol } from "@pkmn/protocol";
import { GenerationNum, Generations } from '@pkmn/data';
import { Dex, PRNG, TeamValidator, Teams as DTeams, BattleStreams, RandomPlayerAI } from '@pkmn/sim';

const prng = new PRNG();
const GRAPHICS: "ani" | "gen1rg" | "gen1rb" | "gen1" | "gen2g" | "gen2s" | "gen2" | "gen3rs" | "gen3frlg" | "gen3" | "gen3-2" | "gen4dp" | "gen4dp-2" | "gen4" | "gen5" | "gen5ani" | GenerationNum = prng.sample( ['ani']);

export async function generateLog(replay:string){
    let turn = 0;
    const log = {} as { [turn: number]: {
        events: { args: string[]; kwArgs: { [k: string]: any; }, text: string, line: string }[];
        t1: { gen: number; w: number; h: number; url: string; pixelated: boolean; };
        t2: { gen: number; w: number; h: number; url: string; pixelated: boolean; };
    }; }
    
    
    for (const line of replay.split('\n')) {
        //console.log(line);
        const { args, kwArgs } = Protocol.parseBattleLine(line);
        //console.log(args, kwArgs);

        if(args[0] === 'turn'){
          const turnNum = parseInt(args[1]);
          turn = turnNum;
        } 
        /*else if (args[0] === 'teampreview') {
          equipo1 = battle.p1.team;
          equipo2 = battle.p2.team;
          break;
        }*/
         else if (args[0] === 'win') {
            
        }


        const key = Protocol.key(args);

        

        
        updateLog(log, turn, args, kwArgs, line);
      }

        return log;
}

export async function updateLog(log, turn:number,  args: any, kwArgs: { [k: string]: any; }, line?: string) {
    //console.log(turn, text);
    let img1 = {} as { gen: number; w: number; h: number; url: string; pixelated: boolean; }
    let img2 = {} as { gen: number; w: number; h: number; url: string; pixelated: boolean; }
  

  
    log[turn] = log[turn] || { events: [], t1: img1, t2: img2 };
    log[turn].events.push({ args, kwArgs, text:'', line });
  }