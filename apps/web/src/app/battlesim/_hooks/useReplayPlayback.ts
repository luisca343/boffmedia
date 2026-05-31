import { useRef } from "react";
import { PokemonIdent } from "@pkmn/protocol";
import { useGameState } from "./useGameState";
import { useBattleFlow } from "./useBattleFlow";
import { moveAction } from "../_utils/battleActions";
import { ReplayData } from "../types";

export function useReplayPlayback(replayData?: ReplayData) {
  const gameState = useGameState(replayData);

  const {
    battle, setBattle, battleLog, currentAction, scene, htmlLog, isPlaying, messageBar,
    turnInput, newTurn, settingTurn, lastTurn, simulatedAttack, logVisible, pov,
    setCurrentAction, countActions, setScene, setHtmlLog: setLog, setIsPlaying, setMessageBar,
    setTurnInput, setNewTurn, setSettingTurn, setLastTurn, setSimulatedAttack, setLogVisible,
    setPov, setCurrentTurn, timeline
  } = gameState;

  const battleFlow = useBattleFlow(
    battle, setBattle, battleLog, currentAction, scene, isPlaying, newTurn, lastTurn,
    settingTurn, pov, setCurrentAction, setLog, setIsPlaying, setMessageBar, setSettingTurn, timeline
  );

  async function simulateAttack() {
    await moveAction(battle, scene, 'p1a' as PokemonIdent, simulatedAttack, 'p2a' as PokemonIdent);
  }

  return {
    // State
    battle,
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
    timeline,

    // Setters
    setIsPlaying,
    setCurrentTurn,
    setPov,
    setSimulatedAttack,
    setTurnInput,
    setLogVisible,
    setCurrentAction,
    setScene,

    // Derived
    countActions,

    // Actions
    simulateAttack,
  };
}
