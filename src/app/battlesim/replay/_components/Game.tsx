"use client"
import { useEffect, useRef } from "react";
import { ReplayControls } from "./ReplayControls";
import { ASPECT_RATIO } from "../../_utils/viewUtils";
import { PokemonIdent, Protocol } from "@pkmn/protocol";
import { useGameState } from "../../_hooks/useGameState";
import useViewportWidth from "@/services/useViewPortWidth";
import { useBattleFlow } from "../../_hooks/useBattleFlow";
import { BattleCanvas } from "../../_components/BattleCanvas";
import { moveAction, } from "../../_utils/battleActions";

export function Game({battleName = 'medalla_doku', replayData}: {battleName?: string, replayData?: any}) {
  const { battle, setBattle, battleLog, currentAction, scene, htmlLog, isPlaying, messageBar,
    turnInput, newTurn, settingTurn, lastTurn, simulatedAttack, logVisible, pov, setBattleLog,
    setCurrentAction, setScene, setHtmlLog: setLog, setIsPlaying, setMessageBar, setTurnInput,
    setNewTurn, setSettingTurn, setLastTurn, setSimulatedAttack, setLogVisible, setPov, setCurrentTurn} = useGameState(replayData);
  
  const battleFlow = useBattleFlow(
    battle, setBattle, battleLog, currentAction, scene, isPlaying,  newTurn, lastTurn,
    settingTurn, pov, setCurrentAction, setLog, setIsPlaying, setMessageBar, setSettingTurn );
  
  // Refs
  const battleCanvasRef = useRef<any>(null);
  const logRef = useRef<HTMLDivElement>(null);
  
  // Canvas width
  const [, canvasWidth] = useViewportWidth();
  
  // Scroll log to bottom when updated
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [htmlLog]);
  
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

export default Game;