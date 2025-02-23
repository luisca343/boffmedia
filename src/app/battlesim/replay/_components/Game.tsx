"use client"
import { useEffect, useRef, useState } from "react";
import { Battle } from "@pkmn/client";
import { Generations } from '@pkmn/data';
import { Dex } from '@pkmn/sim';
import { ArgType, BattleArgsKWArgType, Num, PokemonDetails, PokemonHPStatus, PokemonIdent, Protocol } from "@pkmn/protocol";
import { LogFormatter } from '@pkmn/view';
import { BattleCanvas } from "../../_components/BattleCanvas";
import { Scene } from "../../_components/Scene";
import { ReplayControls } from "./ReplayControls";
import useViewportWidth from "@/services/useViewPortWidth";
import { ASPECT_RATIO } from "../../_utils/viewUtils";
import { create } from "zustand";
import { useGameState } from "../../_hooks/useGameState";
import { useBattleFlow } from "../../_hooks/useBattleFlow";

// Game Component
export function Game({battleName = 'medalla_doku', replayData}: {battleName?: string, replayData?: any}) {
  const { 
    battle, 
    setBattle, 
    battleLog,
    currentAction,
    scene,
    htmlLog,
    isPlaying,
    messageBar,
    turnInput,
    newTurn,
    settingTurn,
    lastTurn,
    simulatedAttack,
    logVisible,
    pov,
    setBattleLog,
    setCurrentAction,
    setScene,
    setHtmlLog: setLog,
    setIsPlaying,
    setMessageBar,
    setTurnInput,
    setNewTurn,
    setSettingTurn,
    setLastTurn,
    setSimulatedAttack,
    setLogVisible,
    setPov, 
  } = useGameState();

  const battleFlow = useBattleFlow(
    battle,
    setBattle,
    battleLog,
    currentAction,
    scene,
    isPlaying,
    newTurn,
    lastTurn,
    settingTurn,
    pov,
    setCurrentAction,
    setLog,
    setIsPlaying,
    setMessageBar,
    setSettingTurn
  );

  // Refs
  const battleCanvasRef = useRef<any>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const processingAction = useRef<boolean>(false);
  
  // Canvas width
  const [, canvasWidth] = useViewportWidth();
  
  // Initialize formatter
  const formatter = new LogFormatter('p1', battle);
  
  // Scroll log to bottom when updated
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [htmlLog]);
  
  // Initialize battle data
  useEffect(() => {
    if(replayData) {
      setBattleLog(replayData.replay);
      loadScene();
      return;
    }
    
    fetch(`https://api.boffmedia.es/smartrotom/combates/booststera.txt`)
    .then(response => response.text())
    .then(text => {
      setBattleLog(text);
      loadScene();
    })
    .catch(error => console.error("Error fetching battle log:", error));
  }, []);
  
  // Load initial game data
  useEffect(() => {
    if (battleLog) {
      loadGameData(battle);
    }
  }, [battleLog]);
  
  function loadGameData(battle: Battle) {
    const lines = battleLog ? battleLog.split('\n') : [];
    let started = false;
    let finalTurn = 0;
    
    for (const line of lines) {
      const {args, kwArgs} = Protocol.parseBattleLine(line);
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
        obs.disconnect();
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  };
  
  
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
  
  const updateBattleLog = (html: string, currentBattle: Battle, actionType: string) => {
    setLog((prev) => [...prev, html]);
    setBattle(currentBattle);
    
    if(clearActions.includes(actionType)) {
      setMessageBar([html]);
    } else {
      setMessageBar((prev) => [...prev, html]);
    }
  };
  

  
  async function simulateAttack() {
    await moveAction(battle, scene, 'p1a' as PokemonIdent, simulatedAttack, 'p2a' as PokemonIdent);
  }
  
  return (
    <>
    <div className="flex">
    <BattleCanvas 
    battle={battle} 
    pov={pov} 
    messageBar={messageBar} 
    ref={battleCanvasRef} 
    />
    {logVisible && (
      <div 
      className="w-[400px] bg-surface-800 p-2 overflow-y-auto text-surface-50" 
      ref={logRef} 
      style={{height:`${canvasWidth * ASPECT_RATIO}px`}}
      >
      {htmlLog.map((line, index) => (
        <div key={index} dangerouslySetInnerHTML={{ __html: line }} />
      ))}
      </div>
    )}
    </div>
    <ReplayControls 
    battle={battle}
    isPlaying={isPlaying}
    setIsPlaying={setIsPlaying}
    setCurrentTurn={setCurrentTurn}
    pov={pov}
    setPov={setPov}
    simulateAttack={simulateAttack}
    simulatedAttack={simulatedAttack}
    setSimulatedAttack={setSimulatedAttack}
    turnInput={turnInput}
    setTurnInput={setTurnInput}
    lastTurn={lastTurn}
    logVisible={logVisible}
    setLogVisible={setLogVisible}
    />
    {process.env.NODE_ENV === 'development' && (
      <div className="mt-4">
      <h3 className="text-lg font-bold mb-2">Debug Information</h3>
      <div className="bg-surface-800 p-4 rounded">
      <div>Current Action: {currentAction}</div>
      <div>Current Turn: {battle.turn}</div>
      <div>Playing: {isPlaying ? 'Yes' : 'No'}</div>
      <div>Setting Turn: {settingTurn ? 'Yes' : 'No'}</div>
      </div>
      </div>
    )}
    </>
  );
}

function copyBattle(battle: Battle) {
  const newBattle = new Battle(new Generations(Dex as any));
  Object.assign(newBattle, battle);
  return newBattle;
}

export default Game;