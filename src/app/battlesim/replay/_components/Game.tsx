"use client"
import { useEffect, useRef, useState } from "react";
import { Battle } from "@pkmn/client";
import { Generations } from '@pkmn/data';
import { Dex } from '@pkmn/sim';
import { create } from "zustand";
import { ArgType, BattleArgsKWArgType, Num, PokemonDetails, PokemonHPStatus, PokemonIdent, Protocol } from "@pkmn/protocol";
import { LogFormatter } from '@pkmn/view';
import { BattleCanvas } from "../../_components/BattleCanvas";
import { Scene } from "../../_components/Scene";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { set } from "react-hook-form";
import { rotomGET } from "@/services/boffAPI";
import { switchAction, turnAction, moveAction, damageAction, healAction } from "../../_utils/battleActions";

export function Game({battleName = 'medalla_doku'}: {battleName?: string}) {
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

  const [simulatedAttack, setSimulatedAttack] = useState<string>('dragondarts');

  
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
    /*rotomGET(`/achievement/67d9b543-5ac9-41e1-a8a5-20d7689e24a4/${battleName}`)
      .then((res) => {
        const replay = res.replay;
        setBattleLog(replay);
        console.log('Battle log:', replay);
        loadScene();
    })
      .catch(console.error);*/

    
    fetch(`https://api.boffmedia.es/smartrotom/combates/sustitutos.txt`)
      .then(response => response.text())
      .then(text => {
        console.log('Battle log:', text);
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

  /*
useEffect(() => {
  if (isPlaying && dataLoaded) {
    const lines = battleLog ? battleLog.split('\n') : [];
    const actions = lines.slice(battle.turn);
    let startFound = false;

    const playActionsSequentially = async () => {
      for (const line of actions) {
        if (line.includes('|start')) startFound = true;
        await playAction(line);
      }
    };

    playActionsSequentially();
  }
}, [isPlaying, dataLoaded]);*/

useEffect(() => {


  if(isPlaying) {
    const lines = battleLog ? battleLog.split('\n') : [];
    if(lines.length === 0 || currentAction >= lines.length) {
      setIsPlaying(false);
      return;
    }
    const action = lines[currentAction];
    playAction(action);
    return;
  }
  if( currentAction === -1 || newTurn === 0){
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
  console.log('Setting turn:', turn);
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
        setLog((prev) => [...prev, html]);

        const params = getParams(args, kwArgs);
        currentBattle.add(args, kwArgs);
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

  function getParams(args: ArgType, kwArgs: BattleArgsKWArgType): { args: ArgType, kwArgs: BattleArgsKWArgType, [key: string]: any } {
    switch (args[0]) {
        case '-damage':
            const damage = battle.damagePercentage(args[1] as PokemonIdent, args[2] as PokemonHPStatus);
            return { args, kwArgs, data:{ damage } };
        case '-heal':
          const fromEffect = kwArgs.from && battle.get('conditions', kwArgs.from);
          const revival = fromEffect?.id === 'revivalblessing';
          const poke = battle.getPokemon(args[1], revival)!;
          const health = poke.healthParse(args[2]);

          return { args, kwArgs, data: { health } };
        default:
            return { args, kwArgs };
    }
}

  async function performAction(params: {args: ArgType, kwArgs: BattleArgsKWArgType, data?: any}, html: string, currentBattle: Battle) {
    const { args, kwArgs, data } = params
    let timeout = 1;
    switch (args[0]) {
      case 'turn':
        await turnAction(currentBattle, args[1] as Num);
        break;
      case 'switch':
        await switchAction(args[1] as PokemonIdent, args[2] as PokemonDetails, args[3] as PokemonHPStatus);
        break;
      case 'move':
        timeout = 500
        await moveAction(currentBattle, scene, args[1] as PokemonIdent, args[2] as string, args[3] as PokemonIdent);
        break;
      case '-damage':
        timeout = 500
        damageAction(currentBattle, scene, args[1] as PokemonIdent, data.damage as string);
        break;
      case '-heal':
        timeout = 500
        healAction(currentBattle, scene, args[1] as PokemonIdent, data.health as number[]);
        break;
      case 'inactive':
      case 't:':
      case '-resisted':
        timeout = 0;
        break;
      default:
        console.log('Unknown action:', args[0]);
        break;
    }
    return await new Promise<void>((resolve) => {
      setTimeout(() => {
        let nextAction = settingTurn ? -1 : currentAction + 1
        setCurrentAction(nextAction);
        

        resolve();
      }, timeout);
    })
  }

  async function simulateAttack() {
    await moveAction(battle, scene, "p1a" as PokemonIdent, simulatedAttack as string, "p2a" as PokemonIdent);
  }

  return (
    <>
      <div className="flex w-full">
      <BattleCanvas battle={battle} pov={pov} messageBar={messageBar}/>
      </div>
      <div className="flex">
        <Button onClick={() => setIsPlaying(!isPlaying)}>{isPlaying ? 'Pause' : 'Play'}</Button>
        <Button onClick={() => setCurrentTurn(0)}>Reset</Button>
        <Button onClick={() => setCurrentTurn(battle.turn - 1)}>Prev</Button>
        <Button onClick={() => setCurrentTurn(battle.turn + 1)}>Next</Button>


        <Button onClick={() => setPov(pov === 'p1' ? 'p2' : 'p1')}>Switch POV</Button>
        <Button onClick={() => simulateAttack()}>Simulate Attack</Button>
        <Input  className="w-24 border border-slate-900" type="string" value={simulatedAttack} 
          onChange={(e) => setSimulatedAttack(e.target.value)}
          min={1} max={lastTurn}
        />


        <Button onClick={() => setCurrentTurn()}>Go to turn</Button>
        <Input  className="w-24 border border-slate-900" type="number" value={turnInput} 
          onChange={(e) => setTurnInput(parseInt(e.target.value))}
          min={1} max={lastTurn}
        />
      </div>
      <span className="text-black">{dataLoaded ? 'Yes' : 'Nope'}</span>
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