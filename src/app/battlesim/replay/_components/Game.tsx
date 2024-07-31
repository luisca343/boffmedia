"use client"
import { useEffect, useRef, useState } from "react";
import { Battle } from "@pkmn/client";
import { Generations } from '@pkmn/data';
import { Dex } from '@pkmn/sim';
import { create } from "zustand";
import { ArgType, BattleArgsKWArgType, PokemonDetails, PokemonHPStatus, PokemonIdent, Protocol } from "@pkmn/protocol";
import { LogFormatter } from '@pkmn/view';
import { PlayerDataBar } from "../../_components/BattleSideBar";
import { BattleCanvas } from "../../_components/BattleCanvas";
import { Scene } from "../../_components/Scene";
import { Button } from "@/components/ui/button";
import { rotomGET } from "@/services/boffAPI";

export function Game() {
  const [battleLog, setBattleLog] = useState<string | null>(null);
  const [actionQueue, setActionQueue] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [scene, setScene] = useState<Scene | null>(null);
  const [htmlLog, setLog] = useState<string[]>( []);  
  
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [htmlLog]);

  const [pov, setPov] = useState<'p1' | 'p2'>('p1');
  const battle = useBattle() as Battle;
  const setBattle = useSetBattle();

  const formatter = new LogFormatter('p1', battle);
  

  useEffect(() => {
    
    rotomGET('/achievement/67d9b543-5ac9-41e1-a8a5-20d7689e24a4/ez')
      .then((res) => {
        const data = JSON.parse(res[0].data);
        const replay = data.replay;
        console.log(replay);

        setBattleLog(data.replay);
        const gameElement = document.querySelector('#game') as HTMLElement;
        //console.log('gameElement', gameElement)
        const battleScene = new Scene(battle, gameElement);
        setScene(battleScene);
    })
      .catch(console.error);

    /*
    fetch("https://api.boffmedia.es/smartrotom/combates/battle.txt")
      .then(response => response.text())
      .then(text => {
        setBattleLog(text);
        
        const gameElement = document.querySelector('#game') as HTMLElement;
        //console.log('gameElement', gameElement)
        const battleScene = new Scene(battle, gameElement);
        setScene(battleScene);
      })
      .catch(error => console.error("Error fetching battle log:", error));*/
  }, []);


  useEffect(() => {
    if(!isPlaying && actionQueue.length > 0){
      setIsPlaying(true);
      const action = actionQueue[0];

      if(action.startsWith('AUDIO:') || action.startsWith('AUDIO_FAINT:')) {
        let audio
        if(action.startsWith('AUDIO_FAINT:')) {
          // If faint, lower the pitch
          audio = new Audio(action.split('AUDIO_FAINT:')[1]);
          audio.playbackRate = 0.7;
        } else {
          audio = new Audio(action.split('AUDIO:')[1]);
        }
          
        audio.play();
        setActionQueue(actionQueue.slice(2));
        setTimeout(() => setIsPlaying(false), 500);
        return;
      }

      performAction(copyBattle(battle), action);
      setActionQueue(actionQueue.slice(1));
    }
  }, [isPlaying, actionQueue, battle]);
  
  function readTurn(localBattle: Battle, log: string, targetTurn: number) {
    if(targetTurn < 0) targetTurn = 0;

    if(!localBattle || targetTurn === 0 || localBattle.turn > targetTurn) {
      localBattle = new Battle(new Generations(Dex as any));
    }

    //console.log('CURRENT BATTLE TURN:', localBattle.turn);
    let turnQueue: string[] = [];
    return new Promise<void>((resolve, reject) => {
      try {
        const lines = log.split("\n");
        let logTurn = 0;
        for (const line of lines) {
          const { args, kwArgs } = Protocol.parseBattleLine(line);
  
          if (args[0] === 'turn') {
            const turnNum = parseInt(args[1]);
            logTurn = turnNum;
            localBattle.setTurn(targetTurn);
          } else if (args[0] === 'win') {
            // Handle win condition
          }

          if(localBattle.turn > logTurn){
            // Skip turn
            //console.log('Skipping turn:', logTurn);
            continue;
          }

          if (logTurn > targetTurn) {
            //console.log('Breaking at turn:', logTurn);
            break;
          }
          
          // Add all lines up to the specified turn
          if (logTurn <= targetTurn) {
            if(logTurn === targetTurn){
              turnQueue.push(line);
            } else {
              localBattle.add(args, kwArgs);
            }

            //console.log('Adding line:', logTurn);
          }
        }
        setBattle(localBattle);
        setActionQueue(turnQueue);
        setIsPlaying(false);

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  let timeout = {start: 0, end: 0};
  const delay = (ms: number | undefined) => new Promise(res => setTimeout(res, ms));

  function resetTimeout() {
    timeout = {start: 0, end: 0};
  }
  

  async function performAction(localBattle: Battle, line: string) {
    if(!scene) return;
    const {args, kwArgs} = Protocol.parseBattleLine(line);


    if(timeout.start > 0){
      await delay(timeout.start).then(() => {
        resetTimeout();
        performAction(localBattle, line);
      });

      return;
    }

    
    
    if(args[0] === 'switch') {
      timeout.end = 1000 / scene.acceleration;
      const [, positionIdent, pokemonDetails, hpstatus] = args as [string, PokemonIdent, PokemonDetails, PokemonHPStatus]
      const pos = positionIdent.split(':')[0];
      const name = pokemonDetails.split(',')[0];
      
      //console.log('switching', pos, name)
      const switchedInPokemon = localBattle.getSwitchedPokemon(positionIdent, pokemonDetails);
      const switchedOutPokemon = localBattle.getSwitchedOutPokemon(positionIdent, pokemonDetails);

      if(!switchedOutPokemon){
        await scene.playEffect('pokeball', positionIdent, async() => {
          setBattle(localBattle);
          const audioUrl = `AUDIO:https://play.pokemonshowdown.com/audio/cries/${switchedInPokemon?.species.id.toLowerCase()}.mp3`
          setActionQueue([audioUrl, ...actionQueue]);
          

        });
      } else {
        await scene.playEffect('switch', positionIdent, async() => {
          setBattle(localBattle);
          const audioUrl = `AUDIO:https://play.pokemonshowdown.com/audio/cries/${switchedInPokemon?.species.id.toLowerCase()}.mp3`
          setActionQueue([audioUrl, ...actionQueue]);
        });
      }
    }

    if(args[0] === 'faint'){
      const [, positionIdent] = args as [string, PokemonIdent];
      timeout.end = 1000 / scene.acceleration;
      //console.log('fainting', positionIdent)

      const pokemon = localBattle.getPokemon(positionIdent);
      if(pokemon){
        await scene.playBattleAnim('faint', args[1].split(':')[0] as PokemonIdent, args[1].split(':')[0] as PokemonIdent, async() => {
          setBattle(localBattle);
          const audioUrl = `AUDIO_FAINT:https://play.pokemonshowdown.com/audio/cries/${pokemon.species.id.toLowerCase()}.mp3`
          setActionQueue([audioUrl, ...actionQueue]);
        });
      }

      

    }

    if(args[0] === 'move'){
      const move = localBattle.get("moves", args[2]);

      let arg3 = args[3] === "" ? args[1].includes('p1') ? 'p2a' : 'p1a' : args[3] as string

      scene.playBattleAnim(move.id, args[1].split(':')[0] as PokemonIdent, arg3.split(':')[0] as PokemonIdent, async() => {
        endAction(args, kwArgs, localBattle);
      });
      timeout.start = 1000 / scene.acceleration;
      timeout.end = -1
      
    }
    
    const logLine = formatter.formatHTML(args, kwArgs);
    setLog([...htmlLog, logLine]);
    if(timeout.end >= 0) await delay(timeout.end).then(() => {
      endAction(args, kwArgs, localBattle);
    });
  }

  function endAction(args: ArgType, kwArgs: BattleArgsKWArgType, localBattle: Battle) {
    localBattle.add(args, kwArgs);
    setBattle(localBattle);
    setIsPlaying(false);

  }


  useEffect(() => {
    if (battleLog) {
      readTurn(copyBattle(battle), battleLog, 0).then(() => {
        
      }).catch((error) => {
        console.error('Error reading log:', error);
      });
    }
  }, [battleLog]);

  /*
  useEffect(() => {
    console.log('Reading Log');
    if (battleLog) {
      readLog(battleLog).then(() => {
        
      }).catch((error) => {
        console.error('Error reading log:', error);
      });
    }
  }, [battleLog]);*/

  useEffect(() => {
    //console.log(battle);
  }, [battle]);

  
  async function simulateFaint() {
    if(!scene) return;
    await scene.playBattleAnim('flamethrower', 'p1a' as PokemonIdent, 'p2a' as PokemonIdent, async() => {
        console.log('fainted')
    });
  }

  async function simulateOtherAttack() {
    if(!scene) return;
    await scene.playBattleAnim('flamethrower', 'p2a' as PokemonIdent, 'p1a' as PokemonIdent, async() => {
      console.log('attacked')
    });
  }

  return (
    <div>
      <div className="flex">
        <div className="flex h-[360px] w-fit overflow-hidden" style={{backgroundImage: 'url(https://play.pokemonshowdown.com/sprites/gen6bgs/bg-icecave.jpg)', backgroundSize: 'cover'}}>
          <PlayerDataBar battle={battle} side="p1" pov={pov}/>
          <BattleCanvas battle={battle}/>
          <PlayerDataBar battle={battle} side="p2" pov={pov}/>
        </div>
        <div ref={logRef} className="w-1/4 h-[360px] overflow-auto">
          {htmlLog.map((line, index) => (
            <div key={index} dangerouslySetInnerHTML={{ __html: line }}></div>
          ))}
        </div>
      </div>
      <Button onClick={() => playTurn(battle.turn - 1)}>Previous turn</Button>
      <Button onClick={() => playTurn(battle.turn + 1)}>Next turn</Button>
      <Button onClick={() => simulateFaint()}>Simulate faint</Button>
      <Button onClick={() => simulateOtherAttack()}>Simulate attack other side</Button>
    </div>
  );


  function playTurn(turn?: number) {
    if( isPlaying ) return;

    if(turn === undefined){
      turn = battle.turn;
    }
    readTurn(copyBattle(battle), battleLog as string, turn).then(() => {
    }).catch((error) => {
      console.error('Error reading log:', error);
    });
  }

}

function copyBattle(battle: Battle) {
  const newBattle = new Battle(new Generations(Dex as any));
  Object.assign(newBattle, battle);
  return newBattle;
}


const useBattleStore = create((set) => ({
  battle: new Battle(new Generations(Dex as any)),
  setBattle: (battle: Battle) => set({ battle }),
}));

export function useBattle() {
  return useBattleStore((state: any) => state.battle);
}

export function useSetBattle() {
  return useBattleStore((state: any) => state.setBattle);
}