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
import { switchAction, turnAction, moveAction, damageAction } from "../../_components/battleActions";

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
        loadScene();
    })
      .catch(console.error);*/

    
    fetch(`https://api.boffmedia.es/smartrotom/combates/test.txt`)
      .then(response => response.text())
      .then(text => {
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
  if( currentAction === -1){
    const lines = battleLog ? battleLog.split('\n') : [];
    const currBattle = new Battle(new Generations(Dex as any));

    let changeTurn = newTurn;
    if(changeTurn < 0) changeTurn = 0;
    if(changeTurn > lastTurn) changeTurn = lastTurn;

    if(changeTurn === 0){
      setLog([]);
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
    return;
  }


  if(isPlaying) {
    const lines = battleLog ? battleLog.split('\n') : [];
    if(lines.length === 0 || currentAction >= lines.length) {
      setIsPlaying(false);
      return;
    }
    const action = lines[currentAction];
    playAction(action);
  }
}, [currentAction, isPlaying]);

function setCurrentTurn(turn?: number) {
  if(!turn) turn = turnInput;
  setNewTurn(turn);
  if(isPlaying) {
    setSettingTurn(true);
  } else {
    setCurrentAction(-1);
  }
}

  async function playAction(line: string) {
    const { args, kwArgs } = Protocol.parseBattleLine(line);
    const currentBattle = copyBattle(battle);
  
    // We wait for the animation to finish
    return new Promise<void>(async (resolve) => {
        const html = formatter.formatHTML(args, kwArgs);
        setLog((prev) => [...prev, html]);

        await performAction(args, kwArgs, currentBattle);
  
        currentBattle.add(args, kwArgs);

        setBattle(currentBattle);
        resolve();
    });
  }

  async function performAction(args: ArgType | BattleArgsKWArgType[], kwArgs: BattleArgsKWArgType, currentBattle: Battle) {
    console.log('Performing action:', args);
    switch (args[0]) {
      case 'turn':
        await turnAction(currentBattle, args[1] as Num);
        break;
      case 'switch':
        await switchAction(args[1] as PokemonIdent, args[2] as PokemonDetails, args[3] as PokemonHPStatus);
        break;
      case 'move':
        await moveAction(currentBattle, scene, args[1] as PokemonIdent, args[2] as string, args[3] as PokemonIdent);
        break;
      case '-damage':
        await damageAction(args[1] as PokemonIdent, args[2] as PokemonHPStatus);
        break;
      default:
        console.log('Unknown action:', args[0]);
        break;
    }
    let timeout = 500
    return await new Promise<void>((resolve) => {
      setTimeout(() => {
        let nextAction = settingTurn ? -1 : currentAction + 1
        setCurrentAction(nextAction);
        resolve();
      }, timeout);
    })
  }

  return (
    <div>
      <div className="flex">
      <BattleCanvas battle={battle} pov={pov}/>
        <div ref={logRef} className="w-1/4 h-[360px] overflow-auto">
          {htmlLog.map((line, index) => (
            <div key={index} dangerouslySetInnerHTML={{ __html: line }}></div>
          ))}
        </div>
      </div>
      <div className="flex">
        <Button onClick={() => setIsPlaying(!isPlaying)}>{isPlaying ? 'Pause' : 'Play'}</Button>
        <Button onClick={() => setCurrentTurn(0)}>Reset</Button>
        <Button onClick={() => setCurrentTurn(battle.turn - 1)}>Prev</Button>
        <Button onClick={() => setCurrentTurn(battle.turn + 1)}>Next</Button>

        <Button onClick={() => setCurrentTurn()}>Go to turn</Button>
        <Input  className="w-24 border border-slate-900" type="number" value={turnInput} 
          onChange={(e) => setTurnInput(parseInt(e.target.value))}
          min={1} max={lastTurn}
        />
      </div>
      <span className="text-black">{dataLoaded ? 'Yes' : 'Nope'}</span>
    </div>
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