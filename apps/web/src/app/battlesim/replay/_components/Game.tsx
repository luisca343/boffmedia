"use client"
import { useEffect, useRef, useState } from "react";
import { env } from "@/config/env-public";
import { ReplayControls } from "./ReplayControls";
import { ASPECT_RATIO } from "../../_utils/viewUtils";
import useViewportWidth from "@/services/useViewPortWidth";
import { BattleCanvas } from "../../_components/BattleCanvas";
import { ReplayData } from "../../types";
import { SanitizedHTML } from "./SanitizedHTML";
import { ReplayLoader } from "./ReplayLoader";
import { useReplayPlayback } from "../../_hooks/useReplayPlayback";

export function Game({battleName = 'medalla_doku', replayData}: {battleName?: string, replayData?: ReplayData}) {
  const [loadedReplayData, setLoadedReplayData] = useState<ReplayData | undefined>(replayData);
  const [battleStarted, setBattleStarted] = useState<boolean>(false);

  const {
    battle, battleLog, currentAction, scene, htmlLog, isPlaying, messageBar,
    turnInput, newTurn, settingTurn, lastTurn, simulatedAttack, logVisible, pov,
    setIsPlaying, setCurrentTurn, setPov, setSimulatedAttack, setTurnInput,
    setLogVisible, setCurrentAction, countActions, simulateAttack
  } = useReplayPlayback(loadedReplayData);

  const battleCanvasRef = useRef<any>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const [, canvasWidth] = useViewportWidth();

  const showPreviewOverlay = battle.turn === 0 && !isPlaying && !battleStarted;

  useEffect(() => {
    if (isPlaying && !battleStarted) {
      setBattleStarted(true);
    }
  }, [isPlaying, battleStarted]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [htmlLog]);

  async function handleSimulateAttack() {
    setBattleStarted(true);
    await simulateAttack();
  }

  if(!loadedReplayData) {
    return <ReplayLoader onReplayLoad={setLoadedReplayData} />;
  }

  return (
    <>
    <div className="flex">
    <div className="flex flex-col relative">
      <BattleCanvas 
        battle={battle} 
        pov={pov} 
        messageBar={messageBar} 
        ref={battleCanvasRef} 
        showPreviewOverlay={showPreviewOverlay}
        setBattleStarted={setBattleStarted}
        setIsPlaying={setIsPlaying}
        currentAction={currentAction}
        battleLog={battleLog}
        showFullInfo={false}
      />

      <ReplayControls 
        battle={battle}
        isPlaying={isPlaying}
        setIsPlaying={(playing) => {
          if (playing) setBattleStarted(true);
          setIsPlaying(playing);
        }}
        setCurrentTurn={(turn) => {
          setBattleStarted(turn! > 0);
          setCurrentTurn(turn);
        }}
        pov={pov}
        setPov={setPov}
        simulateAttack={handleSimulateAttack}
        simulatedAttack={simulatedAttack}
        setSimulatedAttack={setSimulatedAttack}
        turnInput={turnInput}
        setTurnInput={setTurnInput}
        lastTurn={lastTurn}
        logVisible={logVisible}
        setLogVisible={setLogVisible}
        countActions={countActions}
        setCurrentAction={setCurrentAction}
      />
    </div>
    <div className="flex flex-col">
      {logVisible && (
          <div 
            className="w-[400px] bg-surface-800 p-2 overflow-y-auto text-surface-50 h-full" 
            ref={logRef} 
            style={{height:`${canvasWidth * ASPECT_RATIO}px`}}
          >
            {htmlLog.map((line, index) => (
              <SanitizedHTML key={index} html={line} />
            ))}
          </div>
        )}
      <div className="bg-surface-800 flex-1" />
      </div>
    </div>
    {env.NODE_ENV === 'development' && (
      <div className="mt-4">
        <h3 className="text-lg font-bold mb-2">Debug Information</h3>
        <div className="bg-surface-800 p-4 rounded">
          <div>Current Action: {currentAction}</div>
          <div>Current Turn: {battle.turn}</div>
          <div>Playing: {isPlaying ? 'Yes' : 'No'}</div>
          <div>Setting Turn: {settingTurn ? 'Yes' : 'No'}</div>
          <div>Battle Started: {battleStarted ? 'Yes' : 'No'}</div>
          <div>Show Preview: {showPreviewOverlay ? 'Yes' : 'No'}</div>
        </div>
      </div>
    )}
    </>
  );
}

export default Game;
