import { useEffect, useMemo, useRef, useCallback, useState } from 'react';
import { Battle } from "@pkmn/client";
import { Generations } from '@pkmn/data';
import { Dex } from '@pkmn/sim';
import { ArgType, BattleArgsKWArgsTypes, PokemonDetails, PokemonHPStatus, PokemonIdent, Protocol } from "@pkmn/protocol";
import { LogFormatter } from '@pkmn/view';
import { Scene } from "../_utils/Scene";
import { switchAction, faintAction } from "../_utils/battleActions";
import { useBattleActions } from './useBattleActions';
import { getRelativeIdent } from "../_utils/replayUtils";
import { getEventPayload } from "../_utils/eventPayload";

export interface UseBattleFlowOptions {
  liveMode?: boolean;
  onRequest?: (request: Protocol.Request) => void;
  onBattleEnd?: (winner: string) => void;
  isWaitingForChoice?: boolean;
  setIsWaitingForChoice?: (waiting: boolean) => void;
}

export function useBattleFlow(
  battle: Battle,
  setBattle: (battle: Battle) => void,
  battleLog: string | null,
  currentAction: number,
  scene: Scene | null,
  isPlaying: boolean,
  newTurn: number,
  lastTurn: number,
  settingTurn: boolean,
  pov: 0 | 1,
  setCurrentAction: (action: number) => void,
  setHtmlLog: React.Dispatch<React.SetStateAction<string[]>>,
  setIsPlaying: (playing: boolean) => void,
  setMessageBar: React.Dispatch<React.SetStateAction<string[]>>,
  setSettingTurn: (setting: boolean) => void,
  options?: UseBattleFlowOptions
) {
  const liveMode = options?.liveMode ?? false;
  const onRequest = options?.onRequest;
  const onBattleEnd = options?.onBattleEnd;
  const isWaitingForChoice = options?.isWaitingForChoice ?? false;
  const setIsWaitingForChoice = options?.setIsWaitingForChoice;

  const battleActions = useBattleActions(battle, scene, pov);
  const battleActionsRef = useRef(battleActions);
  battleActionsRef.current = battleActions;

  const formatter = useMemo(() => new LogFormatter('p1', battle), [battle]);
  const battleLines = useMemo(() => battleLog ? battleLog.split('\n') : [], [battleLog]);

  // ─── LIVE MODE STATE ───
  const liveBufferRef = useRef<string[]>([]);
  const liveIndexRef = useRef(0);
  const liveProcessingRef = useRef(false);
  const [liveTrigger, setLiveTrigger] = useState(0);
  const liveWaitingRef = useRef(false);
  const pendingBufferRef = useRef<string[]>([]);
  const sceneRef = useRef(scene);
  const liveCallbacksRef = useRef<{ onRequest?: (req: Protocol.Request) => void; onBattleEnd?: (winner: string) => void }>({});

  // Keep refs in sync
  sceneRef.current = scene;
  liveCallbacksRef.current = {
    onRequest: options?.onRequest,
    onBattleEnd: options?.onBattleEnd,
  };

  // Advance to next line — called after each line is fully processed
  const bumpLiveIndex = useCallback(() => {
    liveIndexRef.current++;
    setLiveTrigger((t) => t + 1);
  }, []);

  // Cache: turn number → line index (O(1) seeking instead of O(n) scan)
  const turnIndexMap = useMemo(() => {
    const map = new Map<number, number>();
    for (let i = 0; i < battleLines.length; i++) {
      const line = battleLines[i];
      if (line.includes('|turn|')) {
        const match = line.match(/\|turn\|(\d+)/);
        if (match) {
          map.set(parseInt(match[1]), i);
        }
      }
    }
    return map;
  }, [battleLines]);

  const clearActions = ['switch', 'move', 'turn'];

  // ─── LIVE MODE: useEffect-driven one-line-per-render cycle ───
  // Mirrors replay mode's useEffect([currentAction]) pattern exactly.
  // Uses a ref for the index to prevent React batching from skipping lines.

  useEffect(() => {
    if (!liveMode) return;
    if (liveWaitingRef.current) return;

    const idx = liveIndexRef.current;
    if (idx >= liveBufferRef.current.length) return;

    const line = liveBufferRef.current[idx];
    if (!line?.trim()) {
      bumpLiveIndex();
      return;
    }

    const { args, kwArgs } = Protocol.parseBattleLine(line);

    // Check for request — pause and notify
    if (args[0] === 'request') {
      try {
        const request = JSON.parse(args[1] as string) as Protocol.Request;
        liveWaitingRef.current = true;
        setIsWaitingForChoice?.(true);
        liveCallbacksRef.current.onRequest?.(request);
      } catch (e) {
        console.error('Failed to parse request:', e);
      }
      return;
    }

    // Process the line — EXACT same order as replay mode's playAction:
    // 1. formatter.formatHTML (generate HTML from args/kwArgs — independent of battle state)
    // 2. getParams (fire animations — MUST run before battle.add, reads old state)
    // 3. battle.add (mutate state in place)
    // 4. updateBattleLog (trigger re-render via setHtmlLog/setMessageBar)
    // 5. performAction (wait for animation timeout, then bump index)

    (async () => {
      liveProcessingRef.current = true;
      const html = formatter.formatHTML(args, kwArgs);
      try { battle.add(line); } catch (e) { /* battle.add can fail on malformed lines */ }
      let params: { args: ArgType; kwArgs: BattleArgsKWArgsTypes; data?: any };
      try {
        params = await getParams(args, kwArgs as BattleArgsKWArgsTypes);
      } catch (e) {
        params = { args, kwArgs: kwArgs as BattleArgsKWArgsTypes };
      }
      updateBattleLog(html, battle, args[0]);

      if (args[0] === 'win' || args[0] === 'tie') {
        battle.winner = args[1] as string;
        liveCallbacksRef.current.onBattleEnd?.(args[1] as string);
        liveProcessingRef.current = false;
        return;
      }

      await performAction(params, battle);
      liveProcessingRef.current = false;
      bumpLiveIndex();
    })();
  }, [liveTrigger, liveMode]);

  // addLine: push to buffer. Only trigger effect if nothing is currently processing.
  // bumpLiveIndex will trigger after each line completes.
  const addLine = useCallback((line: string) => {
    if (liveWaitingRef.current) {
      pendingBufferRef.current.push(line);
      return;
    }
    liveBufferRef.current.push(line);
    if (!liveProcessingRef.current) {
      setLiveTrigger((t) => t + 1);
    }
  }, []);

  // resumeAfterChoice: clear waiting, move pending lines, trigger next cycle
  const resumeAfterChoice = useCallback(() => {
    liveWaitingRef.current = false;
    setIsWaitingForChoice?.(false);

    if (pendingBufferRef.current.length > 0) {
      liveBufferRef.current.push(...pendingBufferRef.current);
      pendingBufferRef.current = [];
    }

    setLiveTrigger((t) => t + 1);
  }, []);

  // ─── REPLAY MODE: existing flow control (unchanged) ───

  useEffect(() => {
    if (liveMode) return; // Skip replay logic in live mode

    if(isPlaying && currentAction !== -1) {
      if(battleLines.length === 0 || currentAction >= battleLines.length) {
        setIsPlaying(false);
        return;
      }
      const action = battleLines[currentAction];
      playAction(action);
      return;
    }
    
    if(currentAction === -1 || newTurn === -1) {
      handleTurnChange();
    }
  }, [currentAction, isPlaying, liveMode]);

  const handleTurnChange = () => {
    let changeTurn = newTurn;
    if(changeTurn < 0) changeTurn = 0;
    if(changeTurn > lastTurn + 1) changeTurn = lastTurn + 1;
  
    if(changeTurn === 0) {
      const freshBattle = new Battle(new Generations(Dex as any) as any);
      resetBattle(freshBattle, changeTurn);
      return;
    }

    const currBattle = new Battle(new Generations(Dex as any) as any);
    const newHtmlLog: string[] = [];

    // If going to battle end, process all lines
    const isEnd = changeTurn === lastTurn + 1;
    const targetLineIndex = isEnd ? battleLines.length : turnIndexMap.get(changeTurn);

    if(targetLineIndex === undefined) {
      // Turn not found, fall back to processing all lines
      for (let i = 0; i < battleLines.length; i++) {
        const line = battleLines[i];
        if (!line.trim()) continue;
        const {args, kwArgs} = Protocol.parseBattleLine(line);
        currBattle.add(line);
        if (args[0] === 'win') currBattle.winner = args[1] as string;
        newHtmlLog.push(formatter.formatHTML(args, kwArgs));
      }
      setHtmlLog(newHtmlLog);
      updateBattleState(currBattle, changeTurn, battleLines.length);
      return;
    }

    // Process lines up to the target turn using cached index
    for (let i = 0; i < battleLines.length; i++) {
      const line = battleLines[i];
      if (!line.trim()) continue;
      
      const {args, kwArgs} = Protocol.parseBattleLine(line);
      currBattle.add(line);
      
      if (args[0] === 'win') currBattle.winner = args[1] as string;
      newHtmlLog.push(formatter.formatHTML(args, kwArgs));
      
      // Stop after processing the target turn's last action
      if (!isEnd && args[0] === 'turn') {
        const currentTurn = parseInt(args[1]);
        if (currentTurn === changeTurn) {
          setHtmlLog(newHtmlLog);
          updateBattleState(currBattle, changeTurn, i);
          return;
        }
      }
    }

    // Reached end (for isEnd case)
    setHtmlLog(newHtmlLog);
    const lastActionIndex = battleLines.filter(line => line.trim()).length;
    updateBattleState(currBattle, changeTurn, lastActionIndex);
  };

  const resetBattle = (currBattle: Battle, turn: number) => {
    // Create a completely new battle instance
    const freshBattle = new Battle(new Generations(Dex as any) as any);
    
    // Set turn to 0
    freshBattle.setTurn(turn);
    
    // Reset HTML log and message bar
    setHtmlLog([]);
    setMessageBar([]);
    
    // Stop playback
    setIsPlaying(false);
    
    // Reset current action to start
    setCurrentAction(0);

    // Reset live mode buffer
    if (liveMode) {
      liveBufferRef.current = [];
      liveIndexRef.current = 0;
      setLiveTrigger(0);
    }
    
    // Clear scene if available
    const resetScene = sceneRef.current;
    if (resetScene) {
      // Clear any active Pokemon on the field
      Object.keys(freshBattle.sides).forEach(side => {
        const sideObj = freshBattle.sides[side as keyof typeof freshBattle.sides];
        if (sideObj && typeof sideObj === 'object' && 'active' in sideObj) {
          const activePokemon = sideObj.active[0];
          if (activePokemon) {
            const pokemonIdent = `${side}a:` as PokemonIdent;
            resetScene.clearPokemonElement(pokemonIdent);
          }
        }
      });
    }
    
    // Process initial setup lines from the battle log
    if (!liveMode && battleLines.length > 0) {
      let startFound = false;
      
      for (const line of battleLines) {
        // Only process lines until 'start' command is found
        if (line.includes('|start')) {
          startFound = true;
          freshBattle.add(line);
          break;
        }
        
        // Add setup commands to the fresh battle
        if (!startFound) {
          freshBattle.add(line);
        }
      }
    }
    
    // Update the battle state
    setBattle(freshBattle);
    setSettingTurn(false);
  };

  const updateBattleState = (currBattle: Battle, turn: number, actionIndex: number) => {
    currBattle.setTurn(turn);
    setBattle(copyBattle(currBattle));
    setCurrentAction(actionIndex);
    setSettingTurn(false);
    setMessageBar([]);
  };

  async function playAction(line: string) {
    const { args, kwArgs } = Protocol.parseBattleLine(line);

    try {
      const html = formatter.formatHTML(args, kwArgs);
      const params = await getParams(args, kwArgs as BattleArgsKWArgsTypes);

      battle.add(args, kwArgs);
      updateBattleLog(html, battle, args[0]);

      await performAction(params, battle);
    } catch (error) {
      console.error('Error in playAction:', error);
    }
  }

  const updateBattleLog = (html: string, currentBattle: Battle, actionType: string) => {
    setHtmlLog((prev) => [...prev, html]);
    setBattle(currentBattle);
    
    if(clearActions.includes(actionType)) {
      setMessageBar([html]);
    } else {
      setMessageBar((prev) => [...prev, html]);
    }
  };

  async function performAction(params: any, currentBattle: Battle) {
    const currentScene = sceneRef.current;
    const currentActions = battleActionsRef.current;
    if(!currentScene) return;
    const { args, kwArgs, data } = params;
    const accel = currentScene.acceleration;
    let timeout = 300 / accel;
    
    try {
      // Skip visual animations when acceleration is very high (fast-forward)
      const skipAnims = accel >= 3;

      switch (args[0]) {
        case 'switch':
          timeout = skipAnims ? 100 : await currentActions.handleSwitchAction(args);
          break;
        case 'turn':
          timeout = skipAnims ? 50 : await currentActions.handleTurnAction(args, currentBattle);
          break;
        case '-damage':
          timeout = skipAnims ? 50 : currentActions.handleDamageAction(args, data);
          break;
        case '-heal':
          timeout = skipAnims ? 50 : currentActions.handleHealAction(args, data);
          break;
        case 'move':
          timeout = skipAnims ? 100 : await currentActions.handleMoveAction(args, currentBattle);
          break;
        case '-miss':
          timeout = skipAnims ? 50 : await currentActions.handleMissAction(args);
          break;
        case 'win':
          currentBattle.winner = args[1] as string;
          timeout = 0;
          break;
        case 'inactive': case 't:': case '-resisted': case '':
        case 'join': case 'gametype': case 'player': case 'teamsize': case 'gen': case 'tier':
        case 'rated': case 'rule': case 'clearpoke': case 'poke': case 'rule': case 'start': 
        case 'faint':
          timeout = 0;
          break;
        default:
          break;
      }
      
      return await new Promise<void>((resolve) => {
        setTimeout(() => {
          if (!liveMode) {
            let nextAction = settingTurn ? -1 : currentAction + 1;
            setCurrentAction(nextAction);
          }
          resolve();
        }, timeout);
      });
    } catch (error) {
      console.error('Error in performAction:', error);
      throw error;
    }
  }

  async function getParams(args: ArgType, kwArgs: BattleArgsKWArgsTypes): Promise<{ args: ArgType, kwArgs: BattleArgsKWArgsTypes, data?: any }> {
    const currentScene = sceneRef.current;

    // Pure data extraction via getEventPayload
    const eventPayload = getEventPayload(args[0], args, kwArgs as BattleArgsKWArgsTypes, battle);

    // Animation side effects (to be moved to AnimationRegistry in a later task)
    switch (args[0]) {
      case 'switch':
        try {
          await switchAction(currentScene, getRelativeIdent(args[1] as PokemonIdent, pov), args[2] as PokemonDetails, args[3] as PokemonHPStatus);
          const pokemonIdent = getRelativeIdent(args[1] as PokemonIdent, pov);
          if (currentScene) {
            await currentScene.clearPokemonElement(pokemonIdent);
          }
          const pokemon = battle.getPokemon(args[1] as PokemonIdent);
          if (pokemon?.baseSpeciesForme) {
            const audio = new Audio(`https://play.pokemonshowdown.com/audio/cries/${pokemon.baseSpeciesForme.toLowerCase()}.mp3`);
            audio.play().catch(console.error);
          }
        } catch (error) {
          console.error('Error during switch:', error);
        }
        break;
      case 'faint':
        await faintAction(battle, currentScene, getRelativeIdent(args[1] as PokemonIdent, pov));
        break;
    }

    return { args, kwArgs, data: eventPayload.payload };
  }

  return {
    handleTurnChange,
    playAction,
    updateBattleState,
    resetBattle,
    // Live mode additions
    addLine,
    resumeAfterChoice,
  };
}

function copyBattle(battle: Battle) {
  const newBattle = new Battle(new Generations(Dex as any) as any);
  Object.assign(newBattle, battle);
  return newBattle;
}
