"use client"
import { useEffect, useRef, useState } from "react";
import { Battle } from "@pkmn/client";
import { Generations } from '@pkmn/data';
import { Dex } from '@pkmn/sim';
import { create } from "zustand";
import { ArgType, BattleArgsKWArgType, Num, PokemonDetails, PokemonHPStatus, PokemonIdent, Protocol } from "@pkmn/protocol";
import { LogFormatter } from '@pkmn/view';
import { BattleCanvas, BattleCanvasRefProps } from "../../_components/BattleCanvas";
import { Scene } from "../../_components/Scene";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { switchAction, turnAction, moveAction, damageAction, healAction, faintAction, missAction } from "../../_utils/battleActions";
import { ReplayControls } from "./ReplayControls";
import useViewportWidth from "@/services/useViewPortWidth";
import { ASPECT_RATIO } from "../../_utils/viewUtils";

export function Game({battleName = 'medalla_doku', replayData}: {battleName?: string, replayData?: any}) {
  const [battleLog, setBattleLog] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [currentAction, setCurrentAction] = useState<number>(0);
  const [scene, setScene] = useState<Scene | null>(null);
  const [htmlLog, setLog] = useState<string[]>( []);  
  
  const [isPlaying, setIsPlaying] = useState(false);

  const [turnInput, setTurnInput] = useState<number>(0);
  const [newTurn, setNewTurn] = useState<number>(0);

  const [settingTurn, setSettingTurn] = useState(false);
  const [lastTurn, setLastTurn] = useState<number>(0);

  const [messageBar, setMessageBar] = useState<string[]>([]);
  const [simulatedAttack, setSimulatedAttack] = useState<string>('contactattack');

  const battleCanvasRef = useRef<BattleCanvasRefProps>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const [, canvasWidth] = useViewportWidth();

  const [logVisible, setLogVisible] = useState(false);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [htmlLog]);

  const [pov, setPov] = useState<0 | 1>(0);
  
  const battle = useBattle() as Battle;
  const setBattle = useSetBattle();

  const formatter = new LogFormatter('p1', battle);

  useEffect(() => {
    if(replayData) {
      setBattleLog(replayData.replay);
      loadScene();
      return;
    }

    /*rotomGET(`/achievement/67d9b543-5ac9-41e1-a8a5-20d7689e24a4/${battleName}`)
      .then((res) => {
        const replay = res.replay;
        setBattleLog(replay);
        console.log('Battle log:', replay);
        loadScene();
    })
      .catch(console.error);*/

    
    fetch(`https://api.boffmedia.es/smartrotom/combates/booststera.txt`)
      .then(response => response.text())
      .then(text => {
        //console.log('Battle log:', text);
        setBattleLog(text);
        loadScene();
      })
      .catch(error => console.error("Error fetching battle log:", error));
  }, []);

  function loadGameData(battle: Battle) {
    const lines = battleLog ? battleLog.split('\n') : [];
    let started = false;
    let finalTurn = 0;
    for (const line of lines) {
      const {args, kwArgs} = Protocol.parseBattleLine(line);
      console.log(line);
      console.log('args:', args);
      if(line.includes('|start')) started = true;
      if(!started) battle.add(line);
      if(line.includes('|turn|')) finalTurn++;
    }

    setLastTurn(finalTurn);
  }

  const loadScene = () => {
    const observer = new MutationObserver((mutations, obs) => {
      const gameElement = document.getElementById('game') as HTMLElement;
      if (gameElement) {
        const battleScene = new Scene(battle, gameElement);
        setScene(battleScene);
        obs.disconnect(); // Stop observing once the element is found
      }
    });

    // Start observing the document for changes
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  };

  useEffect(() => {
    if(!dataLoaded && battleLog){
      loadGameData(battle);
    }

  }, [battleLog]);


useEffect(() => {
  if(isPlaying && currentAction !== -1) {
    const lines = battleLog ? battleLog.split('\n') : [];
    if(lines.length === 0 || currentAction >= lines.length) {
      setIsPlaying(false);
      return;
    }
    const action = lines[currentAction];
    playAction(action);
    return;
  }
  
  if( currentAction === -1 || newTurn === -1){
    const lines = battleLog ? battleLog.split('\n') : [];
    const currBattle = new Battle(new Generations(Dex as any));

    let changeTurn = newTurn;
    if(changeTurn < 0) changeTurn = 0;
    if(changeTurn > lastTurn + 1) changeTurn = lastTurn + 1;

    if(changeTurn === 0){
      currBattle.setTurn(changeTurn);
      setLog([]);
      setIsPlaying(false);
      setCurrentAction(0);
      loadGameData(currBattle);
      setBattle(currBattle);
      return
    }
    
    setLog([]);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const {args, kwArgs} = Protocol.parseBattleLine(line);
      currBattle.add(line);
      if (args[0] === 'turn') {
        const currentTurn = parseInt(args[1]);
        if (currentTurn === changeTurn) {
          currBattle.setTurn(changeTurn);
          setBattle(copyBattle(currBattle));
          setCurrentAction(i);
          setSettingTurn(false);
          setMessageBar([]);
          break;
        }
      }
      setLog((prev) => [...prev, formatter.formatHTML(args, kwArgs)]);
    }
    
    if(changeTurn === lastTurn + 1) {
      currBattle.setTurn(changeTurn );
      setBattle(currBattle);
      setCurrentAction(0);
      setSettingTurn(false);
    }
    return;
  }
}, [currentAction, isPlaying]);

function setCurrentTurn(turn?: number) {
  if(turn === undefined) turn = turnInput;
  setNewTurn(turn);
  if(isPlaying) {
    setSettingTurn(true);
  } else {
    setCurrentAction(-1);
  }
}

  const clearActions = ['switch', 'move', 'turn'];

  async function playAction(line: string) {
    const { args, kwArgs } = Protocol.parseBattleLine(line);
    const currentBattle = copyBattle(battle);
  
    // We wait for the animation to finish
    return new Promise<void>(async (resolve) => {
        const html = formatter.formatHTML(args, kwArgs);

        const params = await getParams(args, kwArgs);
        currentBattle.add(args, kwArgs);

        setLog((prev) => [...prev, html]);
        setBattle(currentBattle);
        

        if(clearActions.includes(args[0])){ 
          setMessageBar([html]);
        } else{ 
          setMessageBar((prev) => [...prev, html]);
        }

        await performAction(params, html, currentBattle);
  
        resolve();
    });
  }

  async function getParams(args: ArgType, kwArgs: BattleArgsKWArgType): Promise<{ args: ArgType, kwArgs: BattleArgsKWArgType, [key: string]: any }> {
    switch (args[0]) {
        case 'switch': {
            await switchAction(scene, getRelativeIdent(args[1]), args[2] as PokemonDetails, args[3] as PokemonHPStatus);
            return { args, kwArgs };
        }
        case '-damage': {
            const damage = battle.damagePercentage(args[1] as PokemonIdent, args[2] as PokemonHPStatus);
            return { args, kwArgs, data: { damage } };
        }
        case '-heal': {
            const fromEffect = kwArgs.from && battle.get('conditions', kwArgs.from);
            const revival = fromEffect?.id === 'revivalblessing';
            const poke = battle.getPokemon(args[1], revival)!;
            const health = poke.healthParse(args[2]);
            return { args, kwArgs, data: { health } };
        }
        case 'faint': {
            await faintAction(battle, scene, getRelativeIdent(args[1]));
            return { args, kwArgs };
        }
        default:
            return { args, kwArgs };
    }
}

  async function performAction(params: {args: ArgType, kwArgs: BattleArgsKWArgType, data?: any}, html: string, currentBattle: Battle) {
    if(!scene) return;
    const { args, kwArgs, data } = params
    let timeout = 500 / scene.acceleration;
    switch (args[0]) {
      case 'switch':
        timeout = 1000 / scene.acceleration;
        const pokemon = battle.getPokemon(args[1] as PokemonIdent);
        await scene.clearPokemonElement(args[1].split(':')[0] as PokemonIdent);
        const audio = new Audio('/battlesim/audio/cries/mewtwo.mp3');
        //console.log(`https://play.pokemonshowdown.com/audio/cries/${pokemon?.species.baseSpecies.toLowerCase()}.mp3`)
        //audio.src = `https://play.pokemonshowdown.com/audio/cries/${pokemon?.species?.baseSpecies?.toLowerCase()}.mp3`;
        audio.src = `https://play.pokemonshowdown.com/audio/cries/${pokemon?.baseSpeciesForme?.toLowerCase()}.mp3`;
        audio.play();
        break;
      case 'turn':
        currentBattle.setTurn(parseInt(args[1] as string));
        timeout = 1000 / scene.acceleration;
        await turnAction(currentBattle, args[1] as Num);
        break;
      case '-damage':
        timeout = 1000 / scene.acceleration;
        damageAction(currentBattle, scene, getRelativeIdent(args[1]), data.damage as string);
        break;
      case '-heal':
        timeout = 1000 / scene.acceleration;
        healAction(currentBattle, scene, getRelativeIdent(args[1]), data.health as number[]);
        break;
      case 'move':
        timeout = 500 / scene.acceleration;
        const deffender = args[3] as PokemonIdent || args[1] as PokemonIdent;
        await moveAction(currentBattle, scene, getRelativeIdent(args[1]), args[2] as string, getRelativeIdent(deffender));
        break;
      case '-miss': 
        timeout = 500 / scene.acceleration;
        await missAction(currentBattle, scene, getRelativeIdent(args[1]));
        break;
      case 'inactive': case 't:': case '-resisted': case '':
      case 'join': case 'gametype': case 'player': case 'teamsize': case 'gen': case 'tier':
      case 'rated': case 'rule': case 'clearpoke': case 'poke': case 'rule': case 'start': 
      case 'faint':
        timeout = 0;
        break;
      default:
        console.log('Unknown action:', args[0]);
        break;
    }
    return await new Promise<void>((resolve) => {
      setTimeout(() => {
        //console.log('Action END:', args[0]);
        let nextAction = settingTurn ? -1 : currentAction + 1
        setCurrentAction(nextAction);
        

        resolve();
      }, timeout);
    })
  }

  function getRelativeIdent(PokemonIdent: PokemonIdent): PokemonIdent {
    const identCode = PokemonIdent.split(':')[0];
    if(pov === 0) return identCode as PokemonIdent;
    // Change 1 to 2 and viceversa
    if(identCode.includes('1')) return identCode.replace('1', '2') as PokemonIdent;
     return identCode.replace('2', '1') as PokemonIdent;
  }

  async function simulateAttack() {
    await moveAction(battle, scene, 'p1a' as PokemonIdent, simulatedAttack, 'p2a' as PokemonIdent);
  }

  return (
    <>
      <div className="flex">
        <BattleCanvas battle={battle} pov={pov} messageBar={messageBar} ref={battleCanvasRef} />
        {logVisible &&<div className="w-[400px]  bg-main-800 p-2 overflow-y-auto text-main-50" ref={logRef} style={{height:`${canvasWidth * ASPECT_RATIO}px`}}>
          {htmlLog.map((line, index) => (
            <div key={index} dangerouslySetInnerHTML={{ __html: line }} />
          ))}
        </div>}
      </div>
      <ReplayControls
        battle={battle}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        setCurrentTurn={setCurrentTurn}
        pov={pov}
        setPov={(pov: number) => setPov(pov as 0 | 1)}
        simulateAttack={simulateAttack}
        simulatedAttack={simulatedAttack}
        setSimulatedAttack={setSimulatedAttack}
        turnInput={turnInput}
        setTurnInput={setTurnInput}
        lastTurn={lastTurn}
        setLogVisible={setLogVisible}
        logVisible={logVisible}
      />
    </>
  );
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